// Vercel Serverless Function — Real-Time Tally API Gateway
// Communicates live with Tally via TDL XML. Zero static JSON files!

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tally-URL, X-Tally-Company');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.headers['x-tally-url'] || process.env.TALLY_URL || 'https://attempts-celebrate-analyses-mambo.trycloudflare.com/?key=infra_e35b972d8abf4487';
  const company = req.headers['x-tally-company'] || 'Nanak Food Mart';

  const postTally = async (xml) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'User-Agent': 'TallyMobilePOS/2.0'
      },
      body: xml,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return await response.text();
  };

  // GET Requests: Real-time queries
  if (req.method === 'GET') {
    const url = req.url || '';
    
    // 1. /api/ledgers
    if (url.includes('ledgers') || req.query.action === 'ledgers') {
      const xml = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>COLLECTION</TYPE><ID>LedgerCollection</ID></HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY></STATICVARIABLES>
      <TDL><TDLUSERLIST TYPE="Collection" NAME="LedgerCollection"><TYPE>Ledger</TYPE><FETCH>NAME, PARENT, CLOSINGBALANCE, GSTREGISTRATIONTYPE, PARTYGSTIN</FETCH></TDLUSERLIST></TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
      try {
        const text = await postTally(xml);
        const debtors = [];
        const creditors = [];
        const sales = [];

        const ledMatches = text.matchAll(/<LEDGER[\s\S]*?<\/LEDGER>/g);
        for (const m of ledMatches) {
          const block = m[0];
          const nameM = block.match(/<NAME>([\s\S]*?)<\/NAME>/) || block.match(/NAME="([^"]+)"/);
          const parentM = block.match(/<PARENT>([\s\S]*?)<\/PARENT>/);
          const balM = block.match(/<CLOSINGBALANCE>([\s\S]*?)<\/CLOSINGBALANCE>/);
          const gstinM = block.match(/<PARTYGSTIN>([\s\S]*?)<\/PARTYGSTIN>/);

          const name = nameM ? nameM[1].trim() : '';
          const parent = parentM ? parentM[1].trim() : '';
          const balance = balM ? balM[1].trim() : '0.00';
          const gstin = gstinM ? gstinM[1].trim() : '';

          if (name) {
            const entry = { name, group: parent, balance, gstin };
            const pLower = parent.toLowerCase();
            if (pLower.includes('debtor')) debtors.append ? debtors.push(entry) : debtors.push(entry);
            else if (pLower.includes('creditor')) creditors.push(entry);
            else if (pLower.includes('sales')) sales.push(entry);
          }
        }
        return res.status(200).json({ status: 'success', source: 'tally_realtime', debtors, creditors, sales });
      } catch (err) {
        return res.status(502).json({ status: 'error', error: err.message, debtors: [], creditors: [] });
      }
    }

    // 2. /api/items
    if (url.includes('items') || req.query.action === 'items') {
      const xml = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>COLLECTION</TYPE><ID>StockCollection</ID></HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY></STATICVARIABLES>
      <TDL><TDLUSERLIST TYPE="Collection" NAME="StockCollection"><TYPE>StockItem</TYPE><FETCH>NAME, BASEUNITS, OPENINGRATE, HSNCODE</FETCH></TDLUSERLIST></TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
      try {
        const text = await postTally(xml);
        const items = [];
        const itemMatches = text.matchAll(/<STOCKITEM[\s\S]*?<\/STOCKITEM>/g);
        for (const m of itemMatches) {
          const block = m[0];
          const nameM = block.match(/<NAME>([\s\S]*?)<\/NAME>/) || block.match(/NAME="([^"]+)"/);
          const unitM = block.match(/<BASEUNITS>([\s\S]*?)<\/BASEUNITS>/);
          const rateM = block.match(/<OPENINGRATE>([\s\S]*?)<\/OPENINGRATE>/);
          const hsnM = block.match(/<HSNCODE>([\s\S]*?)<\/HSNCODE>/);

          const name = nameM ? nameM[1].trim() : '';
          const unit = unitM ? unitM[1].trim() : 'PCS';
          const rateStr = rateM ? rateM[1].trim() : '0';
          const rNum = parseFloat(rateStr.replace(/[^\d\.]/g, '')) || 0;
          const hsn = hsnM ? hsnM[1].trim() : '';

          if (name) items.push({ name, unit, rate: rNum, hsn });
        }
        return res.status(200).json({ status: 'success', source: 'tally_realtime', items });
      } catch (err) {
        return res.status(502).json({ status: 'error', error: err.message, items: [] });
      }
    }

    // 3. /api/bills?party=X
    if (url.includes('bills') || req.query.action === 'bills') {
      const party = req.query.party || '';
      const xml = `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>COLLECTION</TYPE><ID>BillsCollection</ID></HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY><LEDGERNAME>${party}</LEDGERNAME></STATICVARIABLES>
      <TDL>
        <TDLUSERLIST TYPE="Collection" NAME="BillsCollection"><TYPE>Bills</TYPE><FETCH>BILLDATE, BILLNAME, BILLCL</FETCH><FILTERS>IsPartyBill</FILTERS></TDLUSERLIST>
        <SYSTEM TYPE="Formulae" NAME="IsPartyBill">$LedgerName = "${party}"</SYSTEM>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
      try {
        const text = await postTally(xml);
        const bills = [];
        const billMatches = text.matchAll(/<BILL[\s\S]*?<\/BILL>/g);
        for (const m of billMatches) {
          const block = m[0];
          const nameM = block.match(/<BILLNAME>([\s\S]*?)<\/BILLNAME>/);
          const dateM = block.match(/<BILLDATE>([\s\S]*?)<\/BILLDATE>/);
          const amtM = block.match(/<BILLCL>([\s\S]*?)<\/BILLCL>/);

          const ref = nameM ? nameM[1].trim() : '';
          const date = dateM ? dateM[1].trim() : '';
          const amt = amtM ? parseFloat(amtM[1].replace(/[^\d\.]/g, '')) || 0 : 0;

          if (ref && amt > 0) bills.push({ bill_ref: ref, bill_date: date, amount: amt });
        }
        return res.status(200).json({ status: 'success', source: 'tally_realtime', party, bills });
      } catch (err) {
        return res.status(502).json({ status: 'error', error: err.message, bills: [] });
      }
    }

    // 4. /api/next-voucher
    if (url.includes('next-voucher') || req.query.action === 'next-voucher') {
      const vchType = req.query.type || 'Sales';
      const xml = `<ENVELOPE>
  <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES><SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY></STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <COLLECTION NAME="VchList" ISMODIFY="No"><TYPE>Voucher</TYPE><FETCH>VOUCHERNUMBER</FETCH><FILTERS>IsTargetVch</FILTERS></COLLECTION>
            <SYSTEM TYPE="Formulae" NAME="IsTargetVch">$VoucherTypeName = "${vchType}" OR $VoucherTypeName = "AUTO GST"</SYSTEM>
          </TDLMESSAGE>
        </TDL>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
      try {
        const text = await postTally(xml);
        const matches = [...text.matchAll(/NFM\/26-27\/(\d+)/g)].map(m => parseInt(m[1], 10));
        const maxNum = matches.length > 0 ? Math.max(...matches) : 13739;
        return res.status(200).json({ status: 'success', source: 'tally_realtime', next_voucher_number: `NFM/26-27/${maxNum + 1}` });
      } catch (err) {
        return res.status(200).json({ status: 'fallback', next_voucher_number: 'NFM/26-27/13740' });
      }
    }

    // 5. /api/ping-tally
    if (url.includes('ping') || req.query.action === 'ping') {
      try {
        const text = await postTally('<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>');
        return res.status(200).json({ status: 'online', company });
      } catch (err) {
        return res.status(200).json({ status: 'offline', error: err.message });
      }
    }

    // 6. /api/discover-schema
    if (url.includes('discover-schema') || req.query.action === 'discover-schema') {
      try {
        const partyXml = `<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>List of Ledgers</ID></HEADER><BODY><DESC><STATICVARIABLES><SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY></STATICVARIABLES></DESC></BODY></ENVELOPE>`;
        const text = await postTally(partyXml);
        const partyFields = [
          { tag: 'NAME', label: 'Party Name', sample: 'The Eclair Bakery', is_udf: false },
          { tag: 'CLOSINGBALANCE', label: 'Closing Balance', sample: '305740.86', is_udf: false },
          { tag: 'PARTYGSTIN', label: 'GSTIN Number', sample: '07AAAAA0000A1Z5', is_udf: false },
          { tag: 'PARENT', label: 'Parent Group', sample: 'Sundry Debtors', is_udf: false }
        ];

        // Scan for any custom UDF tags
        const udfMatches = text.matchAll(/<(UDF:[^>\s]+)[^>]*>([\s\S]*?)<\/\1>/gi);
        const customUdfs = [];
        for (const m of udfMatches) {
          const tag = m[1];
          const val = m[2].trim();
          if (!customUdfs.some(u => u.tag === tag)) {
            const fieldInfo = {
              tag,
              label: tag.replace('UDF:', '').replace(/_/g, ' '),
              sample: val.slice(0, 40),
              is_udf: true
            };
            customUdfs.push(fieldInfo);
            partyFields.push(fieldInfo);
          }
        }

        const itemFields = [
          { tag: 'NAME', label: 'Item Name', sample: '12pcs Brownie Tray', is_udf: false },
          { tag: 'BASEUNITS', label: 'Unit', sample: 'PCS', is_udf: false },
          { tag: 'GSTHSNCODE', label: 'HSN / SAC Code', sample: '392410', is_udf: false },
          { tag: 'OPENINGRATE', label: 'Rate (₹)', sample: '14.50', is_udf: false }
        ];

        const voucherFields = [
          { tag: 'VOUCHERNUMBER', label: 'Voucher Number', sample: 'NFM/26-27/13740', is_udf: false },
          { tag: 'DATE', label: 'Voucher Date', sample: '20261011', is_udf: false },
          { tag: 'PARTYLEDGERNAME', label: 'Party Ledger Name', sample: 'The Eclair Bakery', is_udf: false },
          { tag: 'CLASSNAME', label: 'Voucher Class', sample: 'AUTO GST', is_udf: false }
        ];

        return res.status(200).json({
          status: 'success',
          company,
          party_fields: partyFields,
          item_fields: itemFields,
          voucher_fields: voucherFields,
          custom_udfs: customUdfs
        });
      } catch (err) {
        return res.status(200).json({
          status: 'fallback',
          company,
          party_fields: [
            { tag: 'NAME', label: 'Party Name', sample: 'The Eclair Bakery', is_udf: false },
            { tag: 'CLOSINGBALANCE', label: 'Closing Balance', sample: '305740.86', is_udf: false },
            { tag: 'PARTYGSTIN', label: 'GSTIN Number', sample: '07AAAAA0000A1Z5', is_udf: false }
          ],
          item_fields: [
            { tag: 'NAME', label: 'Item Name', sample: 'Hamper Box', is_udf: false },
            { tag: 'BASEUNITS', label: 'Unit', sample: 'PCS', is_udf: false },
            { tag: 'GSTHSNCODE', label: 'HSN Code', sample: '4819', is_udf: false }
          ],
          voucher_fields: [
            { tag: 'VOUCHERNUMBER', label: 'Voucher Number', sample: 'NFM/26-27/13740', is_udf: false }
          ],
          custom_udfs: [],
          warning: err.message
        });
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // POST Requests: Direct Tally Proxy
  if (req.method === 'POST') {
    try {
      const respText = await postTally(req.body);
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      return res.status(200).send(respText);
    } catch (err) {
      return res.status(502).json({ error: 'Tally Gateway Unreachable', details: err.message });
    }
  }
}
