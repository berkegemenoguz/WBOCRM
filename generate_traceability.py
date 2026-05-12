# -*- coding: utf-8 -*-
"""Generate traceability_matrix.pdf with 8 sections linking requirements to code, tests, and UI."""

import os
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether
)

PAGE = landscape(A4)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='MT', parent=styles['Title'], fontSize=20, spaceAfter=6, textColor=HexColor('#0f172a')))
styles.add(ParagraphStyle(name='MS', parent=styles['Normal'], fontSize=11, spaceAfter=14, textColor=HexColor('#475569')))
styles.add(ParagraphStyle(name='SH', parent=styles['Heading1'], fontSize=15, spaceBefore=18, spaceAfter=10, textColor=HexColor('#1e293b')))
styles.add(ParagraphStyle(name='SH2', parent=styles['Heading2'], fontSize=12, spaceBefore=12, spaceAfter=6, textColor=HexColor('#334155')))
styles.add(ParagraphStyle(name='BP', parent=styles['Normal'], fontSize=8.5, leading=11, spaceAfter=3))
styles.add(ParagraphStyle(name='TH', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='TC', parent=styles['Normal'], fontSize=7.5, leading=10))
styles.add(ParagraphStyle(name='TCc', parent=styles['Normal'], fontSize=7.5, leading=10, alignment=TA_CENTER))

HDR_BG = HexColor('#1e293b')
ROW_ALT = [HexColor('#ffffff'), HexColor('#f8fafc')]
GRID_CLR = HexColor('#cbd5e1')
GREEN = HexColor('#16a34a')
PASS_BG = HexColor('#dcfce7')

def s(t):
    return t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def make_table(headers, rows, col_widths=None):
    aw = PAGE[0] - 3*cm
    if col_widths is None:
        col_widths = [aw / len(headers)] * len(headers)
    data = [[Paragraph(s(h), styles['TH']) for h in headers]]
    for row in rows:
        data.append([Paragraph(s(str(c)), styles['TC']) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HDR_BG),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('GRID', (0,0), (-1,-1), 0.5, GRID_CLR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), ROW_ALT),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    return t

def build():
    out = os.path.join(r'C:\Users\HP\Desktop\SREgereksinim\FirstSaaSPrototype', 'traceability_matrix.pdf')
    doc = SimpleDocTemplate(out, pagesize=PAGE, topMargin=1.2*cm, bottomMargin=1.2*cm, leftMargin=1.5*cm, rightMargin=1.5*cm)
    story = []
    aw = PAGE[0] - 3*cm

    # ── TITLE ──
    story.append(Paragraph('WBOCRM - Requirement Traceability Matrix', styles['MT']))
    story.append(Paragraph('Istanbul Arel University - Software Requirements Engineering HW5 | May 2026', styles['MS']))
    story.append(Paragraph('This document traces every requirement from the READ specification through architecture, implementation, testing, and UI verification.', styles['BP']))
    story.append(Spacer(1, 10))

    # ═══════════════════════════════════════════════════════════════
    # SECTION 1: High-Level Requirements
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('1. High-Level Requirement Coverage', styles['SH']))
    story.append(Paragraph('Maps each high-level requirement from the READ specification to functional/non-functional sub-requirements and implementation status.', styles['BP']))

    hl_rows = [
        ['FR-ST-01','Centralized lead management module','FR-LM-01..06, FR-SC-01..06','Lead CRUD + scoring + assignment','PASS'],
        ['FR-ST-02','Customized Lead Scoring Algorithm','FR-SC-01, NFR-ST-10','scoringService.js (5-metric 0-100)','PASS'],
        ['FR-ST-03','Sales Force Automation (SFA) tools','FR-LM-03..06, FR-ST-04','Pipeline stages + interaction logs','PASS'],
        ['FR-ST-04','Marketing Automation modules','FR-SC-13','campaign_id field on Lead','PASS'],
        ['FR-ST-05','Centralized Customer Support module','FR-ST-01..02, FR-ST-09..10','Ticket CRUD + optimistic locking','PASS'],
        ['FR-ST-06','Real-time data visualization dashboards','FR-ST-11, FR-UC-12, FR-ST-14','DashboardPage + 2s auto-refresh','PASS'],
        ['NFR-ST-01','GDPR and KVKK data protection','NFR-ST-07','PII masking + erasure endpoints','PASS'],
        ['NFR-ST-02','Role-Based Access Control (RBAC)','FR-AUTH-01..04','authMiddleware + rbacMiddleware','PASS'],
        ['NFR-ST-03','Cross-platform web-based frontend','Section 3.8','React SPA, min 360px viewport','PASS'],
        ['NFR-ST-04','Low-latency RESTful API performance','All FR-* endpoints','Express REST API, parameterised SQL','PASS'],
        ['NFR-ST-05','High usability for SME staff','Section 3.8','Responsive UI + NavBar + forms','PASS'],
    ]
    story.append(make_table(
        ['Req ID','Description','Sub-Requirements','Implementation','Status'],
        hl_rows,
        [aw*0.09, aw*0.28, aw*0.22, aw*0.30, aw*0.06]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 2: Functional Requirements to Code
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('2. Functional Requirement to Source Code Traceability', styles['SH']))
    story.append(Paragraph('Maps each functional requirement to the specific source file(s) and function(s) that implement it.', styles['BP']))

    fr_rows = [
        ['FR-AUTH-01','JWT login','authController.js','login()','POST /api/auth/login'],
        ['FR-AUTH-02','401 on invalid credentials','authController.js','login() - 401 branch','POST /api/auth/login'],
        ['FR-AUTH-03','401 without token','authMiddleware.js','verifyToken()','All protected routes'],
        ['FR-AUTH-04','403 insufficient role','rbacMiddleware.js','allowRoles()','Role-gated routes'],
        ['FR-LM-01','Create lead','leadController.js','createLead()','POST /api/leads'],
        ['FR-LM-02','Duplicate email check','leadController.js','createLead() - dup check','POST /api/leads'],
        ['FR-LM-03','List leads sorted by score','leadController.js','getLeads()','GET /api/leads'],
        ['FR-LM-04','Update lead','leadController.js','updateLead()','PUT /api/leads/:id'],
        ['FR-LM-05','Delete lead','leadController.js','deleteLead()','DELETE /api/leads/:id'],
        ['FR-LM-06','Interaction log notes','leadController.js','addLog(), getLogs()','POST/GET /api/leads/:id/logs'],
        ['FR-SC-01','Priority score 0-100','scoringService.js','calculateScore()','Called at lead creation'],
        ['FR-SC-06','Lead assignment','leadController.js','updateLead() - user_id','PUT /api/leads/:id'],
        ['FR-SC-13','Campaign linking','leadController.js','createLead() - campaign_id','POST /api/leads'],
        ['FR-ST-01','Create ticket','ticketController.js','createTicket()','POST /api/tickets'],
        ['FR-ST-02','Update ticket status','ticketController.js','updateTicket()','PUT /api/tickets/:id'],
        ['FR-ST-04','Interaction logging','leadController.js','addLog(), getLogs()','POST/GET /api/leads/:id/logs'],
        ['FR-ST-09','Ticket list','ticketController.js','getTickets()','GET /api/tickets'],
        ['FR-ST-10','Ticket priority tagging','ticketController.js','createTicket() - priority','POST /api/tickets'],
        ['FR-ST-11','Active leads KPI','dashboardController.js','getDashboard()','GET /api/dashboard'],
        ['FR-UC-02','Dynamic scoring','scoringService.js','calculateScore()','5-metric weighted'],
        ['FR-UC-05','Pipeline stage update','leadController.js','updateLead() - pipeline_stage','PUT /api/leads/:id'],
        ['FR-UC-12','Open tickets KPI','dashboardController.js','getDashboard()','GET /api/dashboard'],
        ['FR-ST-14','Monthly revenue KPI','dashboardController.js','getDashboard()','GET /api/dashboard'],
        ['FR-DOC-15','CSV export','leadController.js','exportCsv()','GET /api/leads/export/csv'],
    ]
    story.append(make_table(
        ['Req ID','Description','Source File','Function','API Endpoint'],
        fr_rows,
        [aw*0.09, aw*0.20, aw*0.20, aw*0.25, aw*0.26]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 3: Non-Functional Requirements to Code
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('3. Non-Functional Requirement to Source Code Traceability', styles['SH']))

    nfr_rows = [
        ['NFR-ST-01','Rapid lead entry (<3 clicks)','LeadForm.jsx','Modal form with auto-score','UI verified'],
        ['NFR-ST-02','Cross-platform consistency','index.css + responsive layout','min-width: 360px','All pages'],
        ['NFR-ST-03','Initiative Support Dashboard','DashboardPage.jsx','<5s load, 2s auto-refresh','GET /api/dashboard'],
        ['NFR-ST-04','Core business uptime 99.5%','Render deployment','render.yaml blueprint','Infrastructure'],
        ['NFR-ST-05','Concurrent data collision','ticketController.js','Optimistic locking (updated_at)','PUT /api/tickets/:id'],
        ['NFR-ST-06','Modular release updates','Monorepo structure','backend/ + frontend/ separation','Architecture'],
        ['NFR-ST-07','GDPR/KVKK PII masking','leadController.js','maskEmail(), maskName()','Support role masking'],
        ['NFR-ST-07','Right-to-erasure','leadController.js, userController.js','erasePersonalData()','DELETE endpoints'],
        ['NFR-ST-08','Bcrypt password hashing','authService.js','hashPassword() saltRounds=12','Registration'],
        ['NFR-ST-09','Idle session timeout','AuthContext.jsx','30-min inactivity listeners','Frontend'],
        ['NFR-ST-10','Algorithmic scoring speed','scoringService.js','calculateScore() <500ms','Lead creation'],
        ['NFR-ST-12','Dashboard 2s auto-refresh','DashboardPage.jsx','setInterval(fetchData, 2000)','Frontend'],
        ['NFR-ST-14','Offline ticket draft','TicketPage.jsx','localStorage crm_pending_ticket','Frontend'],
        ['NFR-ST-15','Ticket archiving 365+ days','archiveService.js','archiveOldTickets() daily cron','POST /api/tickets/archive'],
        ['NFR-SEC-04','Idle session timeout','AuthContext.jsx','30-min auto-logout','Frontend'],
    ]
    story.append(make_table(
        ['Req ID','Description','Source File','Implementation','Scope'],
        nfr_rows,
        [aw*0.09, aw*0.22, aw*0.20, aw*0.28, aw*0.21]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 4: Requirement to User Story Mapping
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('4. Requirement to User Story Mapping', styles['SH']))
    story.append(Paragraph('Maps functional and non-functional requirements to documented user stories (docs/user_stories.md).', styles['BP']))

    us_rows = [
        ['FR-AUTH-01','US-01','Sales user can log in with email and password'],
        ['FR-AUTH-02','US-01','Failed login returns 401 error'],
        ['FR-AUTH-03','US-01','Unauthenticated request returns 401'],
        ['FR-AUTH-04','US-02','Role-based access control enforcement'],
        ['FR-LM-01','US-03','Sales rep creates a new lead'],
        ['FR-LM-02','US-03','Duplicate email prevented at creation'],
        ['FR-LM-03','US-04','Leads listed by priority score'],
        ['FR-LM-04','US-05','Update lead pipeline stage'],
        ['FR-LM-05','US-06','Delete a lead record'],
        ['FR-LM-06','US-09','Add interaction notes to a lead'],
        ['FR-SC-01','US-04','Priority score calculated 0-100'],
        ['FR-SC-06','US-08','Admin assigns lead to sales rep'],
        ['FR-SC-13','US-10','Campaign ID linked to lead'],
        ['FR-ST-01','US-11','Support user creates a ticket'],
        ['FR-ST-02','US-12','Update ticket status'],
        ['FR-ST-04','US-09','Interaction logging for leads'],
        ['FR-ST-11','US-13','Dashboard active leads KPI'],
        ['FR-UC-12','US-13','Dashboard open tickets KPI'],
        ['FR-ST-14','US-13','Dashboard monthly revenue KPI'],
        ['FR-DOC-15','US-07','CSV export of leads'],
        ['NFR-ST-05','US-12','Optimistic locking on tickets'],
        ['NFR-ST-07','US-15, US-16, US-17, US-20','GDPR/KVKK masking and erasure'],
        ['NFR-ST-12','US-13','Dashboard 2-second auto-refresh'],
        ['NFR-ST-14','US-19','Offline ticket draft caching'],
        ['NFR-ST-15','US-15','Ticket archiving (365+ days)'],
        ['NFR-SEC-04','US-18','30-minute idle session timeout'],
    ]
    story.append(make_table(
        ['Req ID','User Story','Description'],
        us_rows,
        [aw*0.12, aw*0.15, aw*0.73]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 5: Requirement to UI Component Mapping
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('5. Requirement to UI Component Traceability', styles['SH']))
    story.append(Paragraph('Maps requirements to frontend React components and pages that implement or display them.', styles['BP']))

    ui_rows = [
        ['FR-AUTH-01/02','LoginPage.jsx','Email/password form, JWT stored in localStorage'],
        ['FR-AUTH-03/04','ProtectedLayout.jsx, RoleRoute.jsx','Route guards redirect to /login or show 403'],
        ['FR-LM-01/02','LeadPage.jsx, LeadForm.jsx','Lead table + create/edit modal form'],
        ['FR-LM-03','LeadPage.jsx','Table sorted by priority_score DESC'],
        ['FR-LM-04/05','LeadPage.jsx','Edit/Delete buttons per row'],
        ['FR-LM-06','LeadProfilePage.jsx','Interaction timeline with add-note form'],
        ['FR-SC-01','LeadPage.jsx, LeadForm.jsx','Score displayed in table, calculated at creation'],
        ['FR-SC-06','LeadProfilePage.jsx','Admin assignment dropdown'],
        ['FR-ST-01/02','TicketPage.jsx, TicketForm.jsx','Ticket list + create/update forms'],
        ['FR-ST-09','TicketPage.jsx','Ticket list table for support users'],
        ['FR-ST-11, FR-UC-12, FR-ST-14','DashboardPage.jsx','4 KPI cards with 2s auto-refresh'],
        ['FR-DOC-15','LeadPage.jsx','CSV Export button'],
        ['NFR-ST-02','index.css','Responsive layout min-width 360px'],
        ['NFR-ST-05','TicketPage.jsx','Conflict detection alert on stale update'],
        ['NFR-ST-07','LeadProfilePage.jsx','PII masked for support role display'],
        ['NFR-ST-12','DashboardPage.jsx','setInterval(fetchData, 2000)'],
        ['NFR-ST-14','TicketPage.jsx','Offline draft banner with Retry/Dismiss'],
        ['NFR-SEC-04','AuthContext.jsx','30-min idle auto-logout with activity listeners'],
    ]
    story.append(make_table(
        ['Req ID','UI Component','Description'],
        ui_rows,
        [aw*0.15, aw*0.22, aw*0.63]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 6: Requirement to Test Case Traceability (UPDATED)
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('6. Requirement to Test Case Traceability Matrix', styles['SH']))
    story.append(Paragraph('Maps each functional/non-functional requirement to specific test cases across unit, functional, and BDD test suites. All 53 tests and 20 BDD scenarios pass.', styles['BP']))

    test_rows = [
        ['FR-AUTH-01','Unit: authService - generateToken returns signed JWT\nFunctional: POST /api/auth/login returns 200\nBDD: auth_login.feature - Successful login','authService.test.js\napi.test.js\nauth_login.feature','PASS'],
        ['FR-AUTH-02','Unit: authService - comparePasswords returns false\nFunctional: POST /api/auth/login returns 401\nBDD: auth_login.feature - Failed login','authService.test.js\napi.test.js\nauth_login.feature','PASS'],
        ['FR-AUTH-03','Functional: GET /api/leads returns 401 without token\nBDD: auth_login.feature - Rejected without token','api.test.js\nauth_login.feature','PASS'],
        ['FR-AUTH-04','Functional: GET /api/leads returns 403 wrong role\nBDD: auth_login.feature - Rejected insufficient role','api.test.js\nauth_login.feature','PASS'],
        ['FR-LM-01','Functional: POST /api/leads returns 201\nBDD: lead_registration.feature - Successfully register','api.test.js\nlead_registration.feature','PASS'],
        ['FR-LM-02','Functional: POST /api/leads duplicate returns 400\nBDD: lead_registration.feature - Reject duplicate\nBDD: duplicate_email.feature - Reject existing email','api.test.js\nlead_registration.feature\nduplicate_email.feature','PASS'],
        ['FR-LM-03','Functional: GET /api/leads sorted DESC\nBDD: lead_scoring.feature - Sorted by score','api.test.js\nlead_scoring.feature','PASS'],
        ['FR-SC-01','Unit: scoringService - caps/rounds scores correctly (6 tests)\nBDD: lead_scoring.feature - High/Low score scenarios','scoringService.test.js\nlead_scoring.feature','PASS'],
        ['FR-ST-01','BDD: ticket_creation.feature - Create support ticket','ticket_creation.feature','PASS'],
        ['FR-ST-02','Unit: ticketService - updates status on valid updated_at\nBDD: ticket_creation.feature - Update ticket status','ticketService.test.js\nticket_creation.feature','PASS'],
        ['FR-ST-04','Unit: leadService - addLog creates note, getLogs returns logs\nFunctional: POST /api/leads/:id/logs returns 201\nFunctional: GET /api/leads/:id/logs returns 200\nBDD: interaction_logging.feature - Add note + Retrieve logs','leadService.test.js\napi.test.js\ninteraction_logging.feature','PASS'],
        ['FR-UC-05','Unit: leadService - accepts valid stages, rejects invalid\nFunctional: PUT /api/leads/:id pipeline_stage returns 200\nBDD: pipeline_stage.feature - Update to Qualified + Reject invalid','leadService.test.js\napi.test.js\npipeline_stage.feature','PASS'],
        ['FR-SC-06','Unit: leadService - updates user_id for assignment\nUnit: leadService - throws LEAD_NOT_FOUND','leadService.test.js','PASS'],
        ['FR-ST-09','Functional: GET /api/tickets returns 200 with array','api.test.js','PASS'],
        ['FR-ST-11','Unit: dashboardService - returns activeLeads count\nFunctional: GET /api/dashboard returns all KPI fields\nBDD: dashboard_kpis.feature - All KPI fields','dashboardService.test.js\napi.test.js\ndashboard_kpis.feature','PASS'],
        ['FR-UC-12','Unit: dashboardService - returns openTickets count\nFunctional: GET /api/dashboard returns all KPI fields\nBDD: dashboard_kpis.feature - All KPI fields','dashboardService.test.js\napi.test.js\ndashboard_kpis.feature','PASS'],
        ['FR-SC-13','Unit: leadService - stores campaign_id\nFunctional: POST /api/leads stores campaign_id','leadService.test.js\napi.test.js','PASS'],
        ['FR-ST-14','Unit: dashboardService - returns monthlyRevenue sum\nFunctional: GET /api/dashboard returns all KPI fields\nBDD: dashboard_kpis.feature - All KPI fields','dashboardService.test.js\napi.test.js\ndashboard_kpis.feature','PASS'],
        ['FR-DOC-15','Functional: GET /api/leads/export/csv returns text/csv\nBDD: csv_export.feature - Export leads as CSV','api.test.js\ncsv_export.feature','PASS'],
        ['NFR-ST-05','Unit: ticketService - CONFLICT on stale updated_at','ticketService.test.js','PASS'],
        ['NFR-ST-07','Unit: leadService - erasePersonalData anonymises PII\nUnit: dashboardService - masks top5 PII for support\nFunctional: GET /api/leads/:id - PII masked (support)\nFunctional: GET /api/leads/:id - unmasked (sales)','leadService.test.js\ndashboardService.test.js\napi.test.js','PASS'],
        ['NFR-ST-10','Unit: scoringService - rounds to integer, <500ms','scoringService.test.js','PASS'],
        ['NFR-SEC-01','Unit: authService - hashPassword returns bcrypt hash','authService.test.js','PASS'],
        ['NFR-SEC-02','Functional: 401 without token','api.test.js','PASS'],
        ['NFR-SEC-03','Functional: 403 for insufficient role','api.test.js','PASS'],
        ['NFR-ST-12','Code review: DashboardPage setInterval(2000)','DashboardPage.jsx','PASS'],
        ['NFR-ST-14','Code review: TicketPage localStorage crm_pending_ticket','TicketPage.jsx','PASS'],
        ['NFR-ST-15','Code review: archiveService.js daily cron + ArchivedTicket table','archiveService.js','PASS'],
        ['NFR-SEC-04','Code review: AuthContext.jsx 30-min idle timeout','AuthContext.jsx','PASS'],
    ]
    story.append(make_table(
        ['Req ID','Test Case(s)','Test File(s)','Status'],
        test_rows,
        [aw*0.08, aw*0.48, aw*0.28, aw*0.06]
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 7: Test Coverage Summary
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('7. Test Coverage Summary', styles['SH']))
    story.append(Paragraph('Aggregated test coverage statistics across all three test tiers.', styles['BP']))

    cov_rows = [
        ['Unit Tests (Jest)','38','5 suites: authService(6), scoringService(6), ticketService(6), leadService(12), dashboardService(6)','38/38 PASS'],
        ['Functional Tests (Supertest)','15','api.test.js: CRUD, auth, CSV, PII, pipeline, dashboard, interaction logs','15/15 PASS'],
        ['BDD Scenarios (Cucumber)','20','9 feature files: auth(4), lead_reg(2), scoring(3), tickets(2), dup_email(2), interaction(2), pipeline(2), dashboard(2), csv(1)','20/20 PASS'],
        ['Total','73','All three tiers cover unit logic, API integration, and acceptance criteria','73/73 PASS'],
    ]
    story.append(make_table(
        ['Test Tier','Count','Scope','Result'],
        cov_rows,
        [aw*0.18, aw*0.06, aw*0.60, aw*0.10]
    ))
    story.append(Spacer(1, 14))

    story.append(Paragraph('Requirements with Automated Test Coverage', styles['SH2']))
    auto_reqs = [
        'FR-AUTH-01','FR-AUTH-02','FR-AUTH-03','FR-AUTH-04',
        'FR-LM-01','FR-LM-02','FR-LM-03',
        'FR-SC-01','FR-SC-06','FR-SC-13',
        'FR-ST-01','FR-ST-02','FR-ST-04','FR-ST-09',
        'FR-ST-11','FR-UC-05','FR-UC-12','FR-ST-14','FR-DOC-15',
        'NFR-ST-05','NFR-ST-07','NFR-ST-10',
        'NFR-SEC-01','NFR-SEC-02','NFR-SEC-03',
    ]
    story.append(Paragraph(f'<b>{len(auto_reqs)} requirements</b> have automated tests (unit, functional, or BDD): {", ".join(auto_reqs)}', styles['BP']))
    story.append(Spacer(1, 6))

    review_reqs = ['NFR-ST-12','NFR-ST-14','NFR-ST-15','NFR-SEC-04']
    story.append(Paragraph('Requirements Verified by Code Review', styles['SH2']))
    story.append(Paragraph(f'<b>{len(review_reqs)} requirements</b> verified by code review and manual testing (frontend-only or infrastructure): {", ".join(review_reqs)}', styles['BP']))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════
    # SECTION 8: Full Cross-Reference Matrix
    # ═══════════════════════════════════════════════════════════════
    story.append(Paragraph('8. Full Cross-Reference Matrix', styles['SH']))
    story.append(Paragraph('Complete traceability from requirement through user story, source code, test, and UI for every tracked requirement.', styles['BP']))

    xref_rows = [
        ['FR-AUTH-01','US-01','authController.js','authService.test.js, api.test.js, auth_login.feature','LoginPage.jsx'],
        ['FR-AUTH-02','US-01','authController.js','authService.test.js, api.test.js, auth_login.feature','LoginPage.jsx'],
        ['FR-AUTH-03','US-01','authMiddleware.js','api.test.js, auth_login.feature','ProtectedLayout.jsx'],
        ['FR-AUTH-04','US-02','rbacMiddleware.js','api.test.js, auth_login.feature','RoleRoute.jsx'],
        ['FR-LM-01','US-03','leadController.js','api.test.js, lead_registration.feature','LeadPage.jsx'],
        ['FR-LM-02','US-03','leadController.js','api.test.js, lead_registration.feature, duplicate_email.feature','LeadPage.jsx'],
        ['FR-LM-03','US-04','leadController.js','api.test.js, lead_scoring.feature','LeadPage.jsx'],
        ['FR-LM-04','US-05','leadController.js','leadService.test.js','LeadPage.jsx'],
        ['FR-LM-05','US-06','leadController.js','—','LeadPage.jsx'],
        ['FR-LM-06','US-09','leadController.js','leadService.test.js, api.test.js, interaction_logging.feature','LeadProfilePage.jsx'],
        ['FR-SC-01','US-04','scoringService.js','scoringService.test.js, lead_scoring.feature','LeadForm.jsx'],
        ['FR-SC-06','US-08','leadController.js','leadService.test.js','LeadProfilePage.jsx'],
        ['FR-SC-13','US-10','leadController.js','leadService.test.js, api.test.js','LeadPage.jsx'],
        ['FR-ST-01','US-11','ticketController.js','ticket_creation.feature','TicketPage.jsx'],
        ['FR-ST-02','US-12','ticketController.js','ticketService.test.js, ticket_creation.feature','TicketPage.jsx'],
        ['FR-ST-04','US-09','leadController.js','leadService.test.js, api.test.js, interaction_logging.feature','LeadProfilePage.jsx'],
        ['FR-ST-09','US-11','ticketController.js','api.test.js','TicketPage.jsx'],
        ['FR-ST-11','US-13','dashboardController.js','dashboardService.test.js, api.test.js, dashboard_kpis.feature','DashboardPage.jsx'],
        ['FR-UC-05','US-05','leadController.js','leadService.test.js, api.test.js, pipeline_stage.feature','LeadProfilePage.jsx'],
        ['FR-UC-12','US-13','dashboardController.js','dashboardService.test.js, api.test.js, dashboard_kpis.feature','DashboardPage.jsx'],
        ['FR-ST-14','US-13','dashboardController.js','dashboardService.test.js, api.test.js, dashboard_kpis.feature','DashboardPage.jsx'],
        ['FR-DOC-15','US-07','leadController.js','api.test.js, csv_export.feature','LeadPage.jsx'],
        ['NFR-ST-05','US-12','ticketController.js','ticketService.test.js','TicketPage.jsx'],
        ['NFR-ST-07','US-16,17,20','leadController.js, userController.js','leadService.test.js, dashboardService.test.js, api.test.js','LeadProfilePage.jsx'],
        ['NFR-ST-10','—','scoringService.js','scoringService.test.js','—'],
        ['NFR-ST-12','US-13','DashboardPage.jsx','Code review','DashboardPage.jsx'],
        ['NFR-ST-14','US-19','TicketPage.jsx','Code review','TicketPage.jsx'],
        ['NFR-ST-15','US-15','archiveService.js','Code review','—'],
        ['NFR-SEC-01','—','authService.js','authService.test.js','—'],
        ['NFR-SEC-02','US-01','authMiddleware.js','api.test.js','—'],
        ['NFR-SEC-03','US-02','rbacMiddleware.js','api.test.js','—'],
        ['NFR-SEC-04','US-18','AuthContext.jsx','Code review','—'],
    ]
    story.append(make_table(
        ['Req ID','User Story','Source Code','Test Coverage','UI Component'],
        xref_rows,
        [aw*0.09, aw*0.08, aw*0.20, aw*0.40, aw*0.18]
    ))

    doc.build(story)
    print(f'Traceability Matrix PDF: {out}')

if __name__ == '__main__':
    build()
