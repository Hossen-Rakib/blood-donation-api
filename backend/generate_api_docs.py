"""
Blood Donation Platform — API Documentation PDF Generator
Run: python generate_api_docs.py
Output: API_Documentation.pdf  (same folder)
"""

import os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Colours ────────────────────────────────────────────────────────────
RED        = colors.HexColor("#C0392B")
DARK_RED   = colors.HexColor("#922B21")
LIGHT_RED  = colors.HexColor("#FDEDEC")
WHITE      = colors.white
BLACK      = colors.HexColor("#1A1A1A")
DARK_GRAY  = colors.HexColor("#555555")
BORDER_COL = colors.HexColor("#D5D8DC")
CODE_BG    = colors.HexColor("#2C3E50")
CODE_FG    = colors.HexColor("#ECF0F1")
NOTE_BG    = colors.HexColor("#EBF5FB")
WARN_BG    = colors.HexColor("#FEF9E7")
CAUTION_BG = colors.HexColor("#FDEDEC")
GOOD_BG    = colors.HexColor("#EAFAF1")
TABLE_HDR  = colors.HexColor("#2C3E50")
TABLE_ALT  = colors.HexColor("#F8F9FA")

OUTPUT_PDF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "API_Documentation.pdf")

# ── Styles ─────────────────────────────────────────────────────────────
def styles():
    return {
        "title": ParagraphStyle("T", fontName="Helvetica-Bold", fontSize=28,
                                textColor=RED, alignment=TA_CENTER, spaceAfter=4, leading=34),
        "sub":   ParagraphStyle("S", fontName="Helvetica", fontSize=12,
                                textColor=DARK_GRAY, alignment=TA_CENTER, spaceAfter=18),
        "h1":    ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=17,
                                textColor=DARK_RED, spaceBefore=18, spaceAfter=6, leading=22),
        "h2":    ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=13,
                                textColor=RED, spaceBefore=14, spaceAfter=5, leading=17),
        "h3":    ParagraphStyle("H3", fontName="Helvetica-Bold", fontSize=11,
                                textColor=BLACK, spaceBefore=10, spaceAfter=4, leading=15),
        "body":  ParagraphStyle("B", fontName="Helvetica", fontSize=10,
                                textColor=BLACK, spaceAfter=4, leading=15),
        "note":  ParagraphStyle("N", fontName="Helvetica", fontSize=9,
                                textColor=colors.HexColor("#1A5276"),
                                backColor=NOTE_BG, borderPad=6, spaceAfter=5, leading=14),
        "warn":  ParagraphStyle("W", fontName="Helvetica", fontSize=9,
                                textColor=colors.HexColor("#7D6608"),
                                backColor=WARN_BG, borderPad=6, spaceAfter=5, leading=14),
        "caut":  ParagraphStyle("C", fontName="Helvetica", fontSize=9,
                                textColor=colors.HexColor("#922B21"),
                                backColor=CAUTION_BG, borderPad=6, spaceAfter=5, leading=14),
        "imp":   ParagraphStyle("I", fontName="Helvetica-Bold", fontSize=9,
                                textColor=colors.HexColor("#145A32"),
                                backColor=GOOD_BG, borderPad=6, spaceAfter=5, leading=14),
        "toc1":  ParagraphStyle("TC1", fontName="Helvetica-Bold", fontSize=11,
                                textColor=DARK_RED, spaceAfter=2),
        "toc2":  ParagraphStyle("TC2", fontName="Helvetica", fontSize=10,
                                textColor=BLACK, spaceAfter=1, leftIndent=14),
        "bullet":ParagraphStyle("BL", fontName="Helvetica", fontSize=10,
                                textColor=BLACK, spaceAfter=2, leftIndent=14, leading=14),
    }

# ── Page callbacks ──────────────────────────────────────────────────────
def first_page(canv, doc):
    canv.saveState()
    canv.setFillColor(RED); canv.rect(0, A4[1]-56, A4[0], 56, fill=1, stroke=0)
    canv.setFillColor(WHITE); canv.setFont("Helvetica-Bold", 15)
    canv.drawCentredString(A4[0]/2, A4[1]-36, "🩸  Blood Donation Platform — API Documentation")
    _footer(canv, doc); canv.restoreState()

def later_page(canv, doc):
    canv.saveState()
    canv.setFillColor(RED); canv.rect(0, A4[1]-22, A4[0], 22, fill=1, stroke=0)
    canv.setFillColor(WHITE); canv.setFont("Helvetica-Bold", 8)
    canv.drawString(cm, A4[1]-14, "Blood Donation Platform API  v2.0.0")
    canv.drawRightString(A4[0]-cm, A4[1]-14, "For Frontend Developers")
    _footer(canv, doc); canv.restoreState()

def _footer(canv, doc):
    canv.setStrokeColor(BORDER_COL); canv.line(cm, 1.4*cm, A4[0]-cm, 1.4*cm)
    canv.setFont("Helvetica", 8); canv.setFillColor(DARK_GRAY)
    canv.drawString(cm, cm, "Blood Donation Platform  ·  Dhaka, Bangladesh")
    canv.drawCentredString(A4[0]/2, cm, "BASE URL: http://localhost:8000")
    canv.drawRightString(A4[0]-cm, cm, f"Page {doc.page}")

# ── Helpers ─────────────────────────────────────────────────────────────
def code_block(text):
    esc = text.strip().replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    s = ParagraphStyle("CB", fontName="Courier", fontSize=8, textColor=CODE_FG,
                       backColor=CODE_BG, leftIndent=10, rightIndent=10,
                       leading=12, spaceAfter=8, spaceBefore=4, borderPad=8)
    return Paragraph(esc.replace("\n","<br/>").replace(" ","&nbsp;"), s)

def data_table(headers, rows):
    cw = [17*cm / len(headers)] * len(headers)
    p  = lambda t, fn="Helvetica", sz=9, fg=BLACK: Paragraph(
        str(t), ParagraphStyle("x", fontName=fn, fontSize=sz, textColor=fg, leading=12))
    data = [[p(h,"Helvetica-Bold",9,WHITE) for h in headers]]
    for r in rows:
        data.append([p(c) for c in r])
    tbl = Table(data, colWidths=cw, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,0), TABLE_HDR),
        ("FONTSIZE",   (0,0),(-1,-1), 9),
        ("VALIGN",     (0,0),(-1,-1), "TOP"),
        ("TOPPADDING", (0,0),(-1,-1), 5), ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING",(0,0),(-1,-1), 8),
        ("GRID",       (0,0),(-1,-1), 0.5, BORDER_COL),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, TABLE_ALT]),
    ]))
    return tbl

def endpoint_banner(method, path, auth):
    mc = {"GET":colors.HexColor("#27AE60"),"POST":colors.HexColor("#2980B9"),
          "PUT":colors.HexColor("#D35400"),"DELETE":colors.HexColor("#C0392B")}
    ac = colors.HexColor("#C0392B") if "Yes" in auth else colors.HexColor("#27AE60")
    p  = lambda t, fn, bg: Paragraph(
        f"<font color='white'><b>{t}</b></font>",
        ParagraphStyle("ep", fontName=fn, fontSize=10, textColor=WHITE,
                       backColor=bg, borderPad=8, alignment=TA_CENTER))
    tbl = Table([[p(method,"Helvetica-Bold",mc.get(method,DARK_GRAY)),
                  p(path,"Courier",CODE_BG),
                  p("🔒 Auth Required" if "Yes" in auth else "🔓 Public","Helvetica-Bold",ac)]],
                colWidths=[2.5*cm, 10.5*cm, 4*cm])
    tbl.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
    ]))
    return tbl

def alert(text, kind, st):
    icons = {"NOTE":("ℹ️  NOTE","note"),"IMPORTANT":("✅  IMPORTANT","imp"),
             "WARNING":("⚠️  WARNING","warn"),"CAUTION":("🚨  CAUTION","caut")}
    lbl, k = icons.get(kind, ("ℹ️  NOTE","note"))
    return Paragraph(f"<b>{lbl}</b><br/>{text}", st[k])

def txt(t, st):
    t = re.sub(r"`([^`]+)`", r'<font name="Courier" color="#C0392B">\1</font>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    return Paragraph(t, st["body"])

# ── Cover page ──────────────────────────────────────────────────────────
def cover(st):
    el = [Spacer(1, 2*cm)]
    el.append(Paragraph("🩸", ParagraphStyle("em", fontName="Helvetica", fontSize=48, alignment=TA_CENTER, spaceAfter=8)))
    el.append(Paragraph("Blood Donation Platform", ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=30, textColor=RED, alignment=TA_CENTER, spaceAfter=6)))
    el.append(Paragraph("REST API Documentation  ·  v2.0.0", ParagraphStyle("cs", fontName="Helvetica", fontSize=16, textColor=DARK_GRAY, alignment=TA_CENTER, spaceAfter=4)))
    el.append(Spacer(1,0.4*cm))
    el.append(HRFlowable(width="55%", thickness=2, color=RED, spaceAfter=16))
    meta = [["Version","2.0.0"],["Base URL","http://localhost:8000"],
            ["Auth Type","Bearer Token (JWT)"],["Token Expiry","24 Hours (1440 min)"],
            ["Content-Type","application/json"],["Date","November 2026"]]
    tbl = Table(meta, colWidths=[5*cm, 10*cm])
    tbl.setStyle(TableStyle([
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTNAME",(1,0),(1,-1),"Courier"),
        ("FONTSIZE",(0,0),(-1,-1),11),("TEXTCOLOR",(0,0),(0,-1),RED),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT_RED,WHITE]),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),12),
        ("GRID",(0,0),(-1,-1),0.5,BORDER_COL),
    ]))
    el.append(tbl)
    el.append(Spacer(1,cm))
    el.append(Paragraph(
        "Complete REST API reference for the Blood Donation Platform backend. "
        "Covers Authentication, Donor management, Blood Requests, Notifications, "
        "and Admin operations — with request/response examples and integration code.",
        ParagraphStyle("cd", fontName="Helvetica", fontSize=11, textColor=DARK_GRAY,
                       alignment=TA_CENTER, leading=18)))
    el.append(Spacer(1,cm))
    el.append(Paragraph("🔒  For Frontend Developers",
        ParagraphStyle("cf", fontName="Helvetica-Bold", fontSize=11, textColor=DARK_RED, alignment=TA_CENTER)))
    el.append(PageBreak())
    return el

# ── TOC ─────────────────────────────────────────────────────────────────
def toc(st):
    el = [Paragraph("📋  Table of Contents", st["h1"]),
          HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=8)]
    sections = [
        ("1","Authentication APIs",
         ["1.1 Register (New User)","1.2 Login","1.3 Forgot Password",
          "1.4 Verify Reset Token","1.5 Reset Password"]),
        ("2","User APIs",["2.1 Get Current User Profile"]),
        ("3","Donor APIs",
         ["3.1 Get My Donor Dashboard","3.2 Update My Donor Profile",
          "3.3 Delete My Donor Profile","3.4 Get Matching Blood Requests",
          "3.5 Accept a Blood Request","3.6 Reject a Blood Request"]),
        ("4","Blood Request & Public APIs",
         ["4.1 Search Donors (Public)","4.2 Get Donor Full Profile (Public)",
          "4.3 Create Blood Request","4.4 Get My Blood Requests",
          "4.5 Get Open Blood Requests (Public)","4.6 Get Request by ID",
          "4.7 Update Blood Request","4.8 Mark Request Completed",
          "4.9 Cancel Blood Request"]),
        ("5","Notification APIs",
         ["5.1 Get My Notifications","5.2 Mark Single as Read","5.3 Mark All as Read"]),
        ("6","Admin APIs",
         ["6.1 Dashboard Stats","6.2 List All Users","6.3 Toggle User Active",
          "6.4 Delete User","6.5 Toggle Donor Verification","6.6 All Blood Requests",
          "6.7 Update Request Status","6.8 Delete Request",
          "6.9 Promote to Admin","6.10 Demote from Admin"]),
        ("7","Data Models & Enums",[]),
        ("8","Error Reference",[]),
        ("9","Frontend Integration Examples",[]),
    ]
    for num, title, subs in sections:
        el.append(Paragraph(f"{num}.  {title}", st["toc1"]))
        for s in subs:
            el.append(Paragraph(f"      {s}", st["toc2"]))
        el.append(Spacer(1,2))
    el.append(PageBreak())
    return el

# ── Full content ────────────────────────────────────────────────────────
def content(st):
    el = []
    sp = lambda n=6: Spacer(1,n)
    hr = lambda: HRFlowable(width="100%", thickness=0.5, color=BORDER_COL, spaceBefore=6, spaceAfter=6)

    # ═══════════════════════════════════════════
    # SECTION 1 — AUTH
    # ═══════════════════════════════════════════
    el += [Paragraph("1.  Authentication APIs", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6),
           alert("All protected endpoints need: Authorization: Bearer <access_token>  ·  Token expires in 24 hours","IMPORTANT",st), sp()]

    # 1.1 Register
    el += [Paragraph("1.1  Register — New User", st["h2"]),
           endpoint_banner("POST","/auth/register","❌ No"), sp(4),
           txt("Register a new user. If `blood_group` is provided, a donor profile is created automatically. Returns `access_token` immediately.", st), sp(),
           data_table(["Field","Type","Required","Description"],[
               ["email","string","✅ Yes","Email address (used as login ID)"],
               ["password","string","✅ Yes","Password — min 4 characters"],
               ["name","string","❌ No","Full name"],
               ["phone","string","❌ No","Mobile phone number"],
               ["blood_group","string","❌ No","A+, A−, B+, B−, AB+, AB−, O+, O−"],
               ["location","string","❌ No","Dhaka area (default: Dhaka)"],
               ["username","string","❌ No","Custom username (default: email)"],
               ["age","integer","❌ No","Age in years"],
               ["gender","string","❌ No","Male, Female, Other"],
           ]), sp(),
           txt("**Example Request:**", st),
           code_block('{\n  "email": "rakib@example.com",\n  "password": "pass1234",\n  "name": "Rakib Hasan",\n  "phone": "01712345678",\n  "blood_group": "A+",\n  "location": "Mirpur",\n  "age": 25,\n  "gender": "Male"\n}'),
           txt("**Success Response (201):**", st),
           code_block('{\n  "message": "Registration successful!",\n  "access_token": "eyJhbGci...",\n  "token_type": "bearer",\n  "user_id": 1,\n  "donor_id": 1,\n  "name": "Rakib Hasan",\n  "email": "rakib@example.com",\n  "blood_group": "A+",\n  "location": "Mirpur",\n  "role": "user",\n  "can_donate": true,\n  "can_request": true\n}'),
           data_table(["Status","Detail"],[["400","Email or username already registered"]]), hr()]

    # 1.2 Login
    el += [Paragraph("1.2  Login — Get Bearer Token", st["h2"]),
           endpoint_banner("POST","/auth/login","❌ No"), sp(4),
           alert("Uses form-data (application/x-www-form-urlencoded) — NOT JSON. Fields: username (email or username) and password.","WARNING",st),
           txt("**JavaScript Example:**", st),
           code_block('const form = new FormData();\nform.append("username", "rakib@example.com");\nform.append("password", "pass1234");\nfetch("/auth/login", { method: "POST", body: form });'),
           txt("**Success Response (200):**", st),
           code_block('{ "access_token": "eyJhbGci...", "token_type": "bearer" }'),
           data_table(["Status","Detail"],[["401","Failed Authentication"]]), hr()]

    # 1.3 Forgot Password
    el += [Paragraph("1.3  Forgot Password", st["h2"]),
           endpoint_banner("POST","/auth/forgot-password","❌ No"), sp(4),
           txt("Send registered email to receive a password reset token (valid **15 minutes**).", st), sp(),
           code_block('{ "email": "rakib@example.com" }'),
           txt("**Success Response (200):**", st),
           code_block('{\n  "message": "Password reset token generated.",\n  "token": "abc123xyz...",\n  "expires_in_minutes": 15\n}'), hr()]

    # 1.4 Verify Reset Token
    el += [Paragraph("1.4  Verify Reset Token", st["h2"]),
           endpoint_banner("POST","/auth/verify-reset-token","❌ No"), sp(4),
           txt("Check if a reset token is valid without consuming it.", st), sp(),
           code_block('{ "token": "abc123xyz..." }'),
           txt("**Success Response (200):** `{ \"valid\": true }`", st),
           data_table(["Status","Detail"],[
               ["400","Invalid or already used token"],["400","Token has expired"]]), hr()]

    # 1.5 Reset Password
    el += [Paragraph("1.5  Reset Password", st["h2"]),
           endpoint_banner("POST","/auth/reset-password","❌ No"), sp(4),
           txt("Reset password using the token. Token is consumed after use.", st), sp(),
           code_block('{ "token": "abc123xyz...", "new_password": "newpass1234" }'),
           txt("**Success Response (200):** `{ \"message\": \"Password has been reset successfully.\" }`", st),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 2 — USER
    # ═══════════════════════════════════════════
    el += [Paragraph("2.  User APIs", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6),
           Paragraph("2.1  Get Current User Profile", st["h2"]),
           endpoint_banner("GET","/user","✅ Yes"), sp(4),
           txt("Returns the logged-in user's full profile including donor status.", st), sp(),
           txt("**Success Response (200):**", st),
           code_block('{\n  "id": 1,\n  "name": "Rakib Hasan",\n  "username": "rakib@example.com",\n  "email": "rakib@example.com",\n  "phone": "01712345678",\n  "role": "user",\n  "location": "Mirpur",\n  "is_active": true,\n  "donor_id": 1,\n  "blood_group": "A+",\n  "availability": true,\n  "can_donate": true,\n  "can_request": true\n}'),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 3 — DONOR
    # ═══════════════════════════════════════════
    el += [Paragraph("3.  Donor APIs  (prefix: /donor)", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6)]

    # 3.1
    el += [Paragraph("3.1  Get My Donor Dashboard", st["h2"]),
           endpoint_banner("GET","/donor/me","✅ Yes"), sp(4),
           txt("Returns donor profile, donation stats, and full donation history.", st), sp(),
           code_block('{\n  "id": 1,\n  "name": "Rakib Hasan",\n  "blood_group": "A+",\n  "location": "Mirpur",\n  "availability": true,\n  "total_donations": 3,\n  "total_bags_donated": 3,\n  "recent_history": [ ... ]\n}'), hr()]

    # 3.2
    el += [Paragraph("3.2  Update My Donor Profile", st["h2"]),
           endpoint_banner("PUT","/donor/me","✅ Yes"), sp(4),
           txt("Partial update — only fields you send are changed. Send `blood_group` to auto-create a donor profile.", st), sp(),
           data_table(["Field","Type","Description"],[
               ["name","string","Full name"],["phone","string","Mobile number"],
               ["location","string","Dhaka area"],["blood_group","string","e.g. A+, O−"],
               ["age","integer","Age in years"],["gender","string","Male/Female/Other"],
               ["availability","boolean","true = Available, false = Not Available"],
           ]),
           code_block('{ "availability": false, "location": "Dhanmondi" }'),
           txt("**Response (200):** `{ \"message\": \"Donor profile updated successfully\" }`", st), hr()]

    # 3.3
    el += [Paragraph("3.3  Delete My Donor Profile", st["h2"]),
           endpoint_banner("DELETE","/donor/delete-profile","✅ Yes"), sp(4),
           txt("Permanently deletes the donor profile (user account is kept).", st), sp(),
           txt("**Response (200):** `{ \"message\": \"Donor profile deleted successfully\" }`", st), hr()]

    # 3.4
    el += [Paragraph("3.4  Get Matching Blood Requests  (For Donor)", st["h2"]),
           endpoint_banner("GET","/donor/matching-requests","✅ Yes"), sp(4),
           data_table(["Query Param","Default","Description"],[
               ["filter_by_location","false","true = show only requests from donor's area"],
           ]),
           txt("Returns open `pending`/`donor_found` requests matching the donor's blood group.", st), hr()]

    # 3.5
    el += [Paragraph("3.5  Accept a Blood Request", st["h2"]),
           endpoint_banner("PUT","/donor/requests/{request_id}/accept","✅ Yes"), sp(4),
           txt("Donor accepts a request → status becomes `donor_accepted`. Requester gets notified.", st), sp(),
           code_block('{ "message": "Blood request accepted!", "status": "donor_accepted",\n  "donor_info": { "name": "Rakib", "phone": "01712...", "blood_group": "A+" } }'),
           data_table(["Status","Detail"],[
               ["400","Cannot accept own request"],["400","Request already accepted/completed"],
           ]), hr()]

    # 3.6
    el += [Paragraph("3.6  Reject / Decline a Blood Request", st["h2"]),
           endpoint_banner("PUT","/donor/requests/{request_id}/reject","✅ Yes"), sp(4),
           txt("Donor declines → request goes back to `pending` and opens for other donors.", st),
           txt("**Response (200):** `{ \"message\": \"You have declined this request. It is now open again.\" }`", st),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 4 — BLOOD REQUEST & PUBLIC
    # ═══════════════════════════════════════════
    el += [Paragraph("4.  Blood Request & Public APIs", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6)]

    # 4.1
    el += [Paragraph("4.1  Search Donors  (Public — No Auth)", st["h2"]),
           endpoint_banner("GET","/donors/search","❌ No"), sp(4),
           data_table(["Parameter","Default","Description"],[
               ["blood_group","—","A+, A−, B+, B−, AB+, AB−, O+, O−"],
               ["location","—","Dhaka area e.g. Mirpur, Dhanmondi, Gulshan"],
               ["name","—","Search by donor name"],
               ["available_only","true","Only available donors"],
               ["verified_only","false","Only verified donors"],
               ["sort_by","availability","availability|name|location|blood_group|newest"],
               ["sort_order","desc","asc or desc"],
               ["page","1","Page number"],
               ["page_size","10","Results per page (max 100)"],
           ]), sp(),
           code_block('GET /donors/search?blood_group=A%2B&location=Mirpur&page=1'),
           txt("**Response includes:** `pagination`, `total_found`, `donors[]` array.", st), hr()]

    # 4.2
    el += [Paragraph("4.2  Get Donor Full Profile  (Public)", st["h2"]),
           endpoint_banner("GET","/donors/{donor_id}","❌ No"), sp(4),
           txt("Returns complete donor profile with full donation history.", st), hr()]

    # 4.3
    el += [Paragraph("4.3  Create Blood Request", st["h2"]),
           endpoint_banner("POST","/blood-request","✅ Yes"), sp(4),
           txt("Creates a blood request and auto-notifies matching available donors. Emergency requests also alert admins.", st), sp(),
           data_table(["Field","Required","Description"],[
               ["patient_name","✅ Yes","Patient full name"],
               ["blood_group","✅ Yes","Required blood group"],
               ["hospital_name","✅ Yes","Hospital name"],
               ["hospital_location","✅ Yes","Dhaka area / hospital address"],
               ["required_date","✅ Yes","Date string or 'Immediately'"],
               ["contact_number","✅ Yes","Contact mobile number"],
               ["required_bags","❌ No","Number of bags (default: 1)"],
               ["urgency","❌ No","'normal' (default) or 'emergency'"],
               ["additional_info","❌ No","Extra notes"],
           ]),
           code_block('{\n  "patient_name": "Karim Hossain",\n  "blood_group": "A+",\n  "hospital_name": "Dhaka Medical",\n  "hospital_location": "Mirpur",\n  "required_date": "Immediately",\n  "contact_number": "01811111111",\n  "urgency": "emergency"\n}'),
           txt("**Response (201):** `request_id`, `status: pending`, `notified_donors_count`", st), hr()]

    # 4.4
    el += [Paragraph("4.4  Get My Blood Requests", st["h2"]),
           endpoint_banner("GET","/blood-request/my","✅ Yes"), sp(4),
           data_table(["Parameter","Description"],[
               ["search","Search by title, patient name, hospital, or ID"],
               ["req_status","pending | donor_accepted | donation_completed | cancelled"],
               ["sort_by","newest | patient_name | required_bags | id"],
               ["page / page_size","Pagination (max 50)"],
           ]), hr()]

    # 4.5
    el += [Paragraph("4.5  Get All Open Blood Requests  (Public Feed)", st["h2"]),
           endpoint_banner("GET","/blood-request/open","❌ No"), sp(4),
           txt("Public feed of all `pending`/`donor_found` requests. Supports search, blood group, location, urgency filters, and pagination.", st), hr()]

    # 4.6
    el += [Paragraph("4.6  Get Blood Request by ID", st["h2"]),
           endpoint_banner("GET","/blood-request/{request_id}","❌ No"), sp(4),
           txt("Returns full details of a single blood request. If a donor has accepted it, `accepted_donor` is included.", st), hr()]

    # 4.7
    el += [Paragraph("4.7  Update Blood Request", st["h2"]),
           endpoint_banner("PUT","/blood-request/{request_id}","✅ Yes"), sp(4),
           txt("Update a request — only the **creator** or **admin** can edit. Only `pending` requests can be edited.", st), hr()]

    # 4.8
    el += [Paragraph("4.8  Mark Request Completed", st["h2"]),
           endpoint_banner("PUT","/blood-request/{request_id}/complete","✅ Yes"), sp(4),
           txt("Marks donation as done. Updates donor's `last_donation_date`, adds to `DonationHistory`, and notifies both parties.", st), hr()]

    # 4.9
    el += [Paragraph("4.9  Cancel Blood Request", st["h2"]),
           endpoint_banner("DELETE","/blood-request/{request_id}","✅ Yes"), sp(4),
           txt("Sets status to `cancelled` (soft delete — record is kept). Only creator or admin can cancel.", st),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 5 — NOTIFICATIONS
    # ═══════════════════════════════════════════
    el += [Paragraph("5.  Notification APIs", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6)]

    el += [Paragraph("5.1  Get My Notifications", st["h2"]),
           endpoint_banner("GET","/notifications","✅ Yes"), sp(4),
           txt("Returns the latest 50 notifications with `unread_count`.", st), sp(),
           data_table(["Notification Type","Description"],[
               ["new_request","New blood request matching donor's blood group"],
               ["request_accepted","A donor accepted the requester's blood request"],
               ["request_completed","Donation has been completed"],
               ["admin_alert","Emergency blood request (admin only)"],
           ]), hr()]

    el += [Paragraph("5.2  Mark Single Notification as Read", st["h2"]),
           endpoint_banner("PUT","/notifications/{notif_id}/read","✅ Yes"), sp(4),
           txt("Mark one notification as read by ID.", st), hr()]

    el += [Paragraph("5.3  Mark All Notifications as Read", st["h2"]),
           endpoint_banner("PUT","/notifications/read-all","✅ Yes"), sp(4),
           txt("Mark **all** notifications for the logged-in user as read.", st),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 6 — ADMIN
    # ═══════════════════════════════════════════
    el += [Paragraph("6.  Admin APIs  (prefix: /admin)", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6),
           alert("All admin endpoints require role: 'admin' in the JWT token. Returns 403 Forbidden otherwise.","CAUTION",st), sp()]

    admin_eps = [
        ("6.1","Dashboard Stats","GET","/admin/dashboard",
         "Overview counts + blood group distribution + location charts."),
        ("6.2","List All Users","GET","/admin/users",
         "Paginated user list. Query params: role, name, is_active, sort_by, page, page_size."),
        ("6.3","Toggle User Active","PUT","/admin/users/{user_id}/toggle-active",
         "Activate or deactivate a user. Admin accounts cannot be deactivated."),
        ("6.4","Delete User","DELETE","/admin/users/{user_id}",
         "Permanently delete a user and all their data. Admin accounts cannot be deleted."),
        ("6.5","Toggle Donor Verification","PUT","/admin/donors/{donor_id}/verify",
         "Toggle the verified badge on a donor profile."),
        ("6.6","All Blood Requests","GET","/admin/requests/all",
         "All requests platform-wide. Filter by status and urgency."),
        ("6.7","Update Request Status","PUT","/admin/requests/{request_id}/status",
         "Manually set status: pending | donor_found | donor_accepted | donation_completed | request_closed | cancelled"),
        ("6.8","Delete Blood Request","DELETE","/admin/requests/{request_id}",
         "Hard-delete a fake/spam blood request (irreversible)."),
        ("6.9","Promote to Admin","PUT","/admin/users/{user_id}/promote-admin",
         "Promote a regular user to admin role."),
        ("6.10","Demote from Admin","PUT","/admin/users/{user_id}/demote-admin",
         "Demote an admin back to regular user. Cannot demote yourself."),
    ]
    for num, name, method, path, desc in admin_eps:
        el += [Paragraph(f"{num}  {name}", st["h3"]),
               endpoint_banner(method, path, "✅ Yes"), sp(4),
               txt(desc, st), hr()]

    el.append(PageBreak())

    # ═══════════════════════════════════════════
    # SECTION 7 — DATA MODELS
    # ═══════════════════════════════════════════
    el += [Paragraph("7.  Data Models & Enums", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6),
           Paragraph("Blood Groups", st["h2"]),
           txt("`A+`  `A−`  `B+`  `B−`  `AB+`  `AB−`  `O+`  `O−`", st), sp(),
           Paragraph("Blood Request Status Flow", st["h2"]),
           code_block("pending\n  → donor_found\n    → donor_accepted\n      → donation_completed\n      → request_closed\n  → cancelled  (any time)"),
           Paragraph("Status Values", st["h3"]),
           data_table(["Status","Description"],[
               ["pending","Created — looking for a donor"],
               ["donor_found","A donor was found (admin set)"],
               ["donor_accepted","Donor accepted the request"],
               ["donation_completed","Donation finished"],
               ["request_closed","Closed by admin"],
               ["cancelled","Cancelled by requester or admin"],
           ]), sp(),
           Paragraph("Urgency Levels", st["h2"]),
           data_table(["Value","Description"],[
               ["normal","Regular blood request"],
               ["emergency","Urgent — also notifies all admins"],
           ]), sp(),
           Paragraph("User Roles", st["h2"]),
           data_table(["Role","Description"],[
               ["user","Default — can donate AND request blood"],
               ["admin","Full platform access"],
           ]),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 8 — ERROR REFERENCE
    # ═══════════════════════════════════════════
    el += [Paragraph("8.  Error Reference", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6),
           data_table(["HTTP Code","Meaning","When it occurs"],[
               ["200","OK","Successful request"],
               ["201","Created","New resource created"],
               ["400","Bad Request","Invalid input or validation error"],
               ["401","Unauthorized","Missing or invalid Bearer token"],
               ["403","Forbidden","Not enough permissions (e.g. admin required)"],
               ["404","Not Found","Resource does not exist"],
               ["422","Unprocessable Entity","Missing required field"],
               ["500","Internal Server Error","Server-side error"],
           ]),
           PageBreak()]

    # ═══════════════════════════════════════════
    # SECTION 9 — FRONTEND INTEGRATION
    # ═══════════════════════════════════════════
    el += [Paragraph("9.  Frontend Integration Examples", st["h1"]),
           HRFlowable(width="100%", thickness=1.5, color=RED, spaceAfter=6),
           Paragraph("Axios Setup", st["h2"]),
           code_block('import axios from "axios";\n\nconst api = axios.create({\n  baseURL: "http://localhost:8000",\n  headers: { "Content-Type": "application/json" },\n});\n\n// Attach token automatically\napi.interceptors.request.use(config => {\n  const token = localStorage.getItem("access_token");\n  if (token) config.headers.Authorization = `Bearer ${token}`;\n  return config;\n});\n\nexport default api;'),
           Paragraph("Login", st["h2"]),
           code_block('const login = async (email, password) => {\n  const form = new FormData();\n  form.append("username", email);\n  form.append("password", password);\n  const res = await axios.post("/auth/login", form);\n  localStorage.setItem("access_token", res.data.access_token);\n};'),
           Paragraph("Register", st["h2"]),
           code_block('const register = async (data) => {\n  const res = await api.post("/auth/register", {\n    email: data.email,\n    password: data.password,\n    name: data.name,\n    phone: data.phone,\n    blood_group: data.bloodGroup,\n    location: data.location,\n  });\n  localStorage.setItem("access_token", res.data.access_token);\n  return res.data;\n};'),
           Paragraph("Search Donors", st["h2"]),
           code_block('const searchDonors = async (bloodGroup, location, page = 1) => {\n  const res = await api.get("/donors/search", {\n    params: { blood_group: bloodGroup, location, page, page_size: 10 },\n  });\n  return res.data; // { pagination, donors[] }\n};'),
           Paragraph("Create Blood Request", st["h2"]),
           code_block('const createRequest = async (form) => {\n  const res = await api.post("/blood-request", {\n    patient_name: form.patientName,\n    blood_group: form.bloodGroup,\n    hospital_name: form.hospital,\n    hospital_location: form.location,\n    required_date: form.date || "Immediately",\n    contact_number: form.phone,\n    urgency: form.urgency || "normal",\n    required_bags: form.bags || 1,\n  });\n  return res.data; // { request_id, status, notified_donors_count }\n};'),
           Paragraph("Get Notifications", st["h2"]),
           code_block('const getNotifications = async () => {\n  const res = await api.get("/notifications");\n  return res.data; // { unread_count, notifications[] }\n};\n\nconst markAllRead = () => api.put("/notifications/read-all");'),
    ]

    return el

# ── Main ────────────────────────────────────────────────────────────────
def main():
    st = styles()
    doc = SimpleDocTemplate(
        OUTPUT_PDF, pagesize=A4,
        topMargin=1.8*cm, bottomMargin=1.8*cm,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        title="Blood Donation Platform API Documentation v2.0.0",
        author="Blood Donation Platform Dev Team",
        subject="REST API Reference for Frontend Developers",
    )
    elements = cover(st) + toc(st) + content(st)
    doc.build(elements, onFirstPage=first_page, onLaterPages=later_page)
    print(f"[OK] PDF created: {OUTPUT_PDF}")

if __name__ == "__main__":
    main()
