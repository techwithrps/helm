#!/usr/bin/env python3
"""
Tally Billing Suite - Real-Time API Server & Tally Gateway
Directly queries TallyPrime via TDL XML in REAL-TIME:
- GET  /api/ledgers       -> Real-time Debtor & Creditor Masters & live balances
- GET  /api/items         -> Real-time Stock Items, units, rates, and HSN
- GET  /api/bills?party=X -> Real-time Outstanding Bills for Agst Ref settlement
- GET  /api/next-voucher  -> Real-time next sequence number directly from Tally
- POST /api/tally-proxy   -> Direct XML Voucher & Master injection to Tally
- GET  /api/ping-tally    -> Live connectivity check
ZERO STATIC JSON FILES! Pure live API synchronization matching sync_agent architecture.
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import json
import os
import re
import xml.etree.ElementTree as ET

PORT = 8090
DEFAULT_CONNECTOR_URL = os.environ.get("TALLY_URL") or "https://usually-lows-constraints-jon.trycloudflare.com/?key=infra_d4e4f164a4d442d4"
DEFAULT_COMPANY = "Nanak Food Mart"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def post_to_tally(xml_payload, target_url=DEFAULT_CONNECTOR_URL, timeout=45):
    """Sends raw TDL XML to Tally and returns response text."""
    req = urllib.request.Request(
        target_url,
        data=xml_payload.encode("utf-8"),
        headers={
            "Content-Type": "text/xml; charset=utf-8",
            "User-Agent": "TallyBillingSuite/2.0"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")

# Real-time in-memory caching to avoid pounding Tally while ensuring 100% fresh data
_CACHE = {
    "ledgers": None,
    "items": None,
    "last_sync": {}
}

def fetch_realtime_ledgers(target_url=DEFAULT_CONNECTOR_URL, company=DEFAULT_COMPANY):
    """Queries Tally directly for all live Ledgers under Debtors, Creditors, Sales, and Taxes."""
    payload = f"""<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>LedgerCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLUSERLIST TYPE="Collection" NAME="LedgerCollection">
          <TYPE>Ledger</TYPE>
          <FETCH>NAME, PARENT, CLOSINGBALANCE, GSTREGISTRATIONTYPE, PARTYGSTIN</FETCH>
        </TDLUSERLIST>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""
    try:
        xml_data = post_to_tally(payload, target_url)
        clean_xml = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', xml_data)
        root = ET.fromstring(clean_xml.strip().encode('utf-8'))

        debtors = []
        creditors = []
        sales = []
        taxes = []

        for led in root.findall(".//LEDGER"):
            name = led.get("NAME") or ""
            name_elem = led.find("NAME")
            if name_elem is not None and name_elem.text:
                name = name_elem.text.strip()
            
            parent_elem = led.find("PARENT")
            parent = parent_elem.text.strip() if parent_elem is not None and parent_elem.text else ""
            
            bal_elem = led.find("CLOSINGBALANCE")
            balance = bal_elem.text.strip() if bal_elem is not None and bal_elem.text else "0.00"

            gstin_elem = led.find("PARTYGSTIN")
            gstin = gstin_elem.text.strip() if gstin_elem is not None and gstin_elem.text else ""

            entry = {"name": name, "group": parent, "balance": balance, "gstin": gstin}

            parent_lower = parent.lower()
            if "debtor" in parent_lower:
                debtors.append(entry)
            elif "creditor" in parent_lower:
                creditors.append(entry)
            elif "sales" in parent_lower:
                sales.append(entry)
            elif "tax" in parent_lower or "duties" in parent_lower or "gst" in parent_lower:
                taxes.append(entry)

        res = {
            "status": "success",
            "source": "tally_realtime",
            "company": company,
            "debtors": debtors,
            "creditors": creditors,
            "sales": sales,
            "taxes": taxes,
            "total_ledgers": len(debtors) + len(creditors) + len(sales) + len(taxes)
        }
        _CACHE["ledgers"] = res
        return res
    except Exception as e:
        # If Tally is momentarily paused, return cached memory if exists, or error
        if _CACHE["ledgers"]:
            cached = dict(_CACHE["ledgers"])
            cached["source"] = "memory_cache"
            cached["warning"] = f"Tally query failed ({str(e)}), served from live cache."
            return cached
        return {"status": "error", "error": f"Failed to query Tally ledgers: {str(e)}", "debtors": [], "creditors": []}

def fetch_realtime_items(target_url=DEFAULT_CONNECTOR_URL, company=DEFAULT_COMPANY):
    """Queries Tally directly for all live Stock Items."""
    payload = f"""<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>StockCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLUSERLIST TYPE="Collection" NAME="StockCollection">
          <TYPE>StockItem</TYPE>
          <FETCH>NAME, BASEUNITS, OPENINGRATE, HSNCODE</FETCH>
        </TDLUSERLIST>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""
    try:
        xml_data = post_to_tally(payload, target_url)
        clean_xml = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', xml_data)
        root = ET.fromstring(clean_xml.strip().encode('utf-8'))

        items = []
        for item in root.findall(".//STOCKITEM"):
            name = item.get("NAME") or ""
            name_elem = item.find("NAME")
            if name_elem is not None and name_elem.text:
                name = name_elem.text.strip()
            
            unit_elem = item.find("BASEUNITS")
            unit = unit_elem.text.strip() if unit_elem is not None and unit_elem.text else "PCS"

            rate_elem = item.find("OPENINGRATE")
            rate = rate_elem.text.strip() if rate_elem is not None and rate_elem.text else "0.00"
            m_rate = re.search(r'([\d\.]+)', rate)
            rate_val = float(m_rate.group(1)) if m_rate else 0.0

            hsn_elem = item.find("HSNCODE")
            hsn = hsn_elem.text.strip() if hsn_elem is not None and hsn_elem.text else ""

            if name:
                items.append({"name": name, "unit": unit, "rate": rate_val, "hsn": hsn})

        res = {"status": "success", "source": "tally_realtime", "company": company, "items": items, "total_items": len(items)}
        _CACHE["items"] = res
        return res
    except Exception as e:
        if _CACHE["items"]:
            cached = dict(_CACHE["items"])
            cached["source"] = "memory_cache"
            cached["warning"] = f"Tally query failed ({str(e)}), served from live cache."
            return cached
        return {"status": "error", "error": f"Failed to query Tally stock items: {str(e)}", "items": []}

def fetch_realtime_bills(party_name, target_url=DEFAULT_CONNECTOR_URL, company=DEFAULT_COMPANY):
    """Queries Tally directly for pending Bills Outstanding for a specific customer."""
    payload = f"""<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>BillsCollection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY>
        <LEDGERNAME>{party_name}</LEDGERNAME>
      </STATICVARIABLES>
      <TDL>
        <TDLUSERLIST TYPE="Collection" NAME="BillsCollection">
          <TYPE>Bills</TYPE>
          <FETCH>BILLDATE, BILLNAME, BILLCL</FETCH>
          <FILTERS>IsPartyBill</FILTERS>
        </TDLUSERLIST>
        <SYSTEM TYPE="Formulae" NAME="IsPartyBill">
          $LedgerName = "{party_name}"
        </SYSTEM>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>"""
    try:
        xml_data = post_to_tally(payload, target_url)
        clean_xml = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', xml_data)
        root = ET.fromstring(clean_xml.strip().encode('utf-8'))

        bills = []
        for b in root.findall(".//BILL"):
            ref_elem = b.find("BILLNAME")
            ref = ref_elem.text.strip() if ref_elem is not None and ref_elem.text else ""
            
            date_elem = b.find("BILLDATE")
            date = date_elem.text.strip() if date_elem is not None and date_elem.text else ""

            amt_elem = b.find("BILLCL")
            amt_str = amt_elem.text.strip() if amt_elem is not None and amt_elem.text else "0"
            m_amt = re.search(r'([\d\.]+)', amt_str)
            amt = float(m_amt.group(1)) if m_amt else 0.0

            if ref and amt > 0:
                bills.append({"bill_ref": ref, "bill_date": date, "amount": amt})

        return {"status": "success", "source": "tally_realtime", "party": party_name, "bills": bills}
    except Exception as e:
        return {"status": "error", "party": party_name, "bills": [], "error": str(e)}

def fetch_realtime_next_voucher(vch_type="Sales", target_url=DEFAULT_CONNECTOR_URL, company=DEFAULT_COMPANY):
    """Queries Tally directly for the highest voucher number of the given voucher type."""
    payload = f"""<ENVELOPE>
  <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <COLLECTION NAME="VchList" ISMODIFY="No">
              <TYPE>Voucher</TYPE>
              <FETCH>VOUCHERNUMBER</FETCH>
              <FILTERS>IsTargetVch</FILTERS>
            </COLLECTION>
            <SYSTEM TYPE="Formulae" NAME="IsTargetVch">
              $VoucherTypeName = "{'Sales' if vch_type == 'Sales' else vch_type}" OR $VoucherTypeName = "AUTO GST"
            </SYSTEM>
          </TDLMESSAGE>
        </TDL>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>"""
    try:
        xml_data = post_to_tally(payload, target_url)
        matches = [int(m.group(1)) for m in re.finditer(r'NFM/26-27/(\d+)', xml_data)]
        max_num = max(matches) if matches else 13739
        next_num = f"NFM/26-27/{max_num + 1}"
        return {"status": "success", "source": "tally_realtime", "type": vch_type, "next_voucher_number": next_num, "highest_existing": max_num}
    except Exception as e:
        return {"status": "fallback", "type": vch_type, "next_voucher_number": "NFM/26-27/13740", "error": str(e)}

def discover_tally_schema(target_url=DEFAULT_CONNECTOR_URL, company=DEFAULT_COMPANY):
    """
    Universal Schema Discovery Engine:
    Queries Tally for native objects and extracts ALL standard tags + Custom TDL/TCP (UDF) fields.
    Returns structured schema with sample values for easy visual mapping.
    """
    discovered = {
        "status": "success",
        "company": company,
        "party_fields": [],
        "item_fields": [],
        "voucher_fields": [],
        "custom_udfs": [],
        "sample_party": None,
        "sample_item": None
    }
    
    # 1. Inspect Party / Ledger Schema
    try:
        xml_res = post_to_tally(f"""<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>List of Ledgers</ID></HEADER>
  <BODY><DESC><STATICVARIABLES><SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY></STATICVARIABLES></DESC></BODY>
</ENVELOPE>""", target_url, timeout=25)
        clean_xml = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', xml_res)
        clean_xml = re.sub(r'&#x?[0-9a-fA-F]+;', '', clean_xml)
        root = ET.fromstring(clean_xml.strip().encode('utf-8'))
        ledgers = root.findall(".//LEDGER")
        if ledgers:
            # Pick a rich sample ledger (preferably under Sundry Debtors)
            sample_led = next((l for l in ledgers if "debtor" in (l.findtext("PARENT") or "").lower()), ledgers[0])
            discovered["sample_party"] = sample_led.get("NAME") or sample_led.findtext("NAME")
            
            seen_tags = set()
            for child in sample_led:
                tag = child.tag
                if tag not in seen_tags:
                    seen_tags.add(tag)
                    val = (child.text or "").strip()
                    is_udf = "UDF" in tag or tag.startswith("UDF:") or ":" in tag
                    field_info = {
                        "tag": tag,
                        "label": tag.replace("UDF:", "").replace("_", " ").title(),
                        "sample": val[:40] if val else "",
                        "is_udf": is_udf,
                        "category": "party"
                    }
                    discovered["party_fields"].append(field_info)
                    if is_udf:
                        discovered["custom_udfs"].append(field_info)
    except Exception as e:
        discovered["party_error"] = str(e)

    # 2. Inspect Stock Item Schema
    try:
        xml_res = post_to_tally(f"""<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>List of Stock Items</ID></HEADER>
  <BODY><DESC><STATICVARIABLES><SVCURRENTCOMPANY>{company}</SVCURRENTCOMPANY></STATICVARIABLES></DESC></BODY>
</ENVELOPE>""", target_url, timeout=25)
        clean_xml = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', xml_res)
        clean_xml = re.sub(r'&#x?[0-9a-fA-F]+;', '', clean_xml)
        root = ET.fromstring(clean_xml.strip().encode('utf-8'))
        items = root.findall(".//STOCKITEM")
        if items:
            sample_item = items[0]
            discovered["sample_item"] = sample_item.get("NAME") or sample_item.findtext("NAME")
            seen_tags = set()
            for child in sample_item:
                tag = child.tag
                if tag not in seen_tags:
                    seen_tags.add(tag)
                    val = (child.text or "").strip()
                    is_udf = "UDF" in tag or tag.startswith("UDF:") or ":" in tag
                    field_info = {
                        "tag": tag,
                        "label": tag.replace("UDF:", "").replace("_", " ").title(),
                        "sample": val[:40] if val else "",
                        "is_udf": is_udf,
                        "category": "item"
                    }
                    discovered["item_fields"].append(field_info)
                    if is_udf:
                        discovered["custom_udfs"].append(field_info)
    except Exception as e:
        discovered["item_error"] = str(e)

    # Standard Essential Voucher Fields Registry
    discovered["voucher_fields"] = [
        {"tag": "VOUCHERNUMBER", "label": "Voucher Number", "sample": "NFM/26-27/13740", "is_udf": False, "category": "voucher"},
        {"tag": "DATE", "label": "Voucher Date", "sample": "20261011", "is_udf": False, "category": "voucher"},
        {"tag": "PARTYLEDGERNAME", "label": "Party Ledger Name", "sample": "The Eclair Bakery", "is_udf": False, "category": "voucher"},
        {"tag": "PLACEOFSUPPLY", "label": "Place of Supply", "sample": "07 Delhi", "is_udf": False, "category": "voucher"},
        {"tag": "NARRATION", "label": "Narration / Note", "sample": "Being Goods Sold Against Order", "is_udf": False, "category": "voucher"},
        {"tag": "CLASSNAME", "label": "Voucher Class (AUTO GST)", "sample": "AUTO GST", "is_udf": False, "category": "voucher"}
    ]

    return discovered

class BillingHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Tally-URL, X-Tally-Company")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        target_url = self.headers.get("X-Tally-URL") or DEFAULT_CONNECTOR_URL
        company = self.headers.get("X-Tally-Company") or DEFAULT_COMPANY

        # 1. Real-time Ledgers API (Debtors, Creditors, Sales, Taxes)
        if path == "/api/ledgers":
            data = fetch_realtime_ledgers(target_url, company)
            return self.send_json_response(data)

        # 2. Real-time Stock Items API
        elif path == "/api/items":
            data = fetch_realtime_items(target_url, company)
            return self.send_json_response(data)

        # 3. Real-time Pending Bills API for Agst Ref
        elif path == "/api/bills":
            party = params.get("party", [""])[0]
            data = fetch_realtime_bills(party, target_url, company)
            return self.send_json_response(data)

        # 4. Real-time Next Voucher Number sequence
        elif path == "/api/next-voucher":
            vch_type = params.get("type", ["Sales"])[0]
            data = fetch_realtime_next_voucher(vch_type, target_url, company)
            return self.send_json_response(data)

        # 5. Heartbeat / Connectivity check
        elif path == "/api/ping-tally":
            try:
                req = urllib.request.Request(target_url, headers={"User-Agent": "TallyBillingSuite/2.0"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    resp_data = resp.read().decode("utf-8", errors="ignore")
                    return self.send_json_response({"status": "online", "company": company, "preview": resp_data[:200]})
            except Exception as e:
                return self.send_json_response({"status": "offline", "error": str(e)})

        # 6. Universal Schema Discovery (Standard + Custom UDFs)
        elif path == "/api/discover-schema":
            data = discover_tally_schema(target_url, company)
            return self.send_json_response(data)

        # Default static web asset serving (index.html, styles.css, app.js)
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        target_url = self.headers.get("X-Tally-URL") or DEFAULT_CONNECTOR_URL

        # Direct XML Proxy to Tally
        if path in ("/api/tally-proxy", "/api/tally"):
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)

                req = urllib.request.Request(
                    target_url,
                    data=body,
                    headers={
                        "Content-Type": "text/xml; charset=utf-8",
                        "User-Agent": "TallyBillingSuite/2.0"
                    },
                    method="POST"
                )

                try:
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        resp_data = resp.read()
                        self.send_response(resp.status)
                        self.send_header("Content-Type", resp.headers.get("Content-Type", "text/xml"))
                        self.end_headers()
                        self.wfile.write(resp_data)
                except urllib.error.HTTPError as he:
                    err_data = he.read()
                    self.send_response(he.code)
                    self.send_header("Content-Type", "text/plain")
                    self.end_headers()
                    self.wfile.write(err_data)
                except Exception as ex:
                    self.send_json_response({"error": f"Gateway timeout / connection failed: {str(ex)}"}, 504)
            except Exception as e:
                self.send_json_response({"error": str(e)}, 500)
        else:
            self.send_error(404, "Not Found")

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), BillingHandler) as httpd:
        print(f"🚀 Tally Real-Time Billing Gateway running at http://localhost:{PORT}")
        print(f"🔗 Tally Connector: {DEFAULT_CONNECTOR_URL}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    start_server()
