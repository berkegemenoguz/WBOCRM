# -*- coding: utf-8 -*-
"""Regenerate all PDF files: 4 docs + 3 test results + traceability matrix."""

import re, os
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ═══════════════════════════════════════════════════════════════════
# PART 1: Markdown to PDF (4 doc files)
# ═══════════════════════════════════════════════════════════════════

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='DocTitle', parent=styles['Title'], fontSize=18, spaceAfter=20, textColor=HexColor('#1e293b')))
styles.add(ParagraphStyle(name='H2C', parent=styles['Heading2'], fontSize=14, spaceBefore=16, spaceAfter=8, textColor=HexColor('#1e293b')))
styles.add(ParagraphStyle(name='H3C', parent=styles['Heading3'], fontSize=12, spaceBefore=12, spaceAfter=6, textColor=HexColor('#334155')))
styles.add(ParagraphStyle(name='BC', parent=styles['Normal'], fontSize=9, leading=13, spaceAfter=4))
styles.add(ParagraphStyle(name='BulC', parent=styles['Normal'], fontSize=9, leading=13, leftIndent=20, spaceAfter=2))
styles.add(ParagraphStyle(name='CodeC', parent=styles['Code'], fontSize=7.5, leading=10, leftIndent=15, backColor=HexColor('#f1f5f9'), borderColor=HexColor('#e2e8f0'), borderWidth=0.5, borderPadding=4, spaceAfter=8, spaceBefore=4))
styles.add(ParagraphStyle(name='THs', parent=styles['Normal'], fontSize=8, leading=10, textColor=white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='TCs', parent=styles['Normal'], fontSize=8, leading=10))

def sanitize(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    text = re.sub(r'`(.+?)`', r'<font face="Courier" size="8">\1</font>', text)
    parts = re.split(r'(<font[^>]*>.*?</font>)', text)
    result = []
    for part in parts:
        if part.startswith('<font'):
            result.append(part)
        else:
            part = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', part)
            result.append(part)
    return ''.join(result)

def md_to_story(md_text):
    story = []
    lines = md_text.split('\n')
    i = 0
    in_code = False
    code_lines = []
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith('```'):
            if in_code:
                ct = '\n'.join(code_lines).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
                story.append(Preformatted(ct, styles['CodeC']))
                code_lines = []
                in_code = False
            else:
                in_code = True
                code_lines = []
            i += 1; continue
        if in_code:
            code_lines.append(line); i += 1; continue
        s = line.strip()
        if not s: i += 1; continue
        if s == '---': story.append(Spacer(1, 8)); i += 1; continue
        if s.startswith('# '): story.append(Paragraph(sanitize(s[2:]), styles['DocTitle'])); i += 1; continue
        if s.startswith('## '): story.append(Paragraph(sanitize(s[3:]), styles['H2C'])); i += 1; continue
        if s.startswith('### '): story.append(Paragraph(sanitize(s[4:]), styles['H3C'])); i += 1; continue
        if '|' in s and s.startswith('|'):
            tl = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                tl.append(lines[i].strip()); i += 1
            hc = [c.strip() for c in tl[0].split('|')[1:-1]]
            dr = [[c.strip() for c in r.split('|')[1:-1]] for r in tl[2:]]
            if hc and dr:
                cc = len(hc); aw = A4[0] - 3*cm; cw = aw/cc
                td = [[Paragraph(sanitize(h), styles['THs']) for h in hc]]
                for row in dr:
                    while len(row) < cc: row.append('')
                    td.append([Paragraph(sanitize(c), styles['TCs']) for c in row[:cc]])
                t = Table(td, colWidths=[cw]*cc)
                t.setStyle(TableStyle([
                    ('BACKGROUND',(0,0),(-1,0),HexColor('#1e293b')),('TEXTCOLOR',(0,0),(-1,0),white),
                    ('FONTSIZE',(0,0),(-1,-1),8),('GRID',(0,0),(-1,-1),0.5,HexColor('#cbd5e1')),
                    ('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[HexColor('#fff'),HexColor('#f8fafc')]),
                    ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
                    ('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),
                ]))
                story.append(t); story.append(Spacer(1, 8))
            continue
        if s.startswith('- ') or s.startswith('* '):
            story.append(Paragraph('• ' + sanitize(s[2:]), styles['BulC'])); i += 1; continue
        m = re.match(r'^(\d+)\.\s+(.+)', s)
        if m: story.append(Paragraph(f'{m.group(1)}. {sanitize(m.group(2))}', styles['BulC'])); i += 1; continue
        story.append(Paragraph(sanitize(s), styles['BC'])); i += 1
    return story

def gen_doc_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f: md = f.read()
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm, leftMargin=1.5*cm, rightMargin=1.5*cm)
    doc.build(md_to_story(md))
    print(f'Doc PDF: {pdf_path}')

# ═══════════════════════════════════════════════════════════════════
# PART 2: Test result TXT to PDF
# ═══════════════════════════════════════════════════════════════════

styles.add(ParagraphStyle(name='TTitle', parent=styles['Title'], fontSize=16, spaceAfter=12, textColor=HexColor('#1e293b')))
styles.add(ParagraphStyle(name='TSub', parent=styles['Normal'], fontSize=10, spaceAfter=16, textColor=HexColor('#64748b')))
styles.add(ParagraphStyle(name='TT', fontName='Courier', fontSize=8, leading=11, leftIndent=8, rightIndent=8, backColor=HexColor('#1e293b'), textColor=HexColor('#e2e8f0'), borderColor=HexColor('#334155'), borderWidth=1, borderPadding=8, spaceAfter=6))
styles.add(ParagraphStyle(name='SL', fontName='Courier-Bold', fontSize=9, leading=12, leftIndent=8, spaceBefore=8, spaceAfter=4, textColor=HexColor('#1e293b')))

def esc(t): return t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def gen_test_pdf(txt_path, pdf_path, title):
    with open(txt_path, 'r', encoding='utf-8') as f: content = f.read()
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm, leftMargin=1.5*cm, rightMargin=1.5*cm)
    story = [Paragraph(esc(title), styles['TTitle']), Paragraph('WBOCRM - Test Execution Output', styles['TSub']), Spacer(1, 8)]
    for line in content.split('\n'):
        s = line.strip()
        if not s: story.append(Spacer(1, 4)); continue
        el = esc(line)
        if any(s.startswith(k) for k in ['Test Suites:','Tests:','Snapshots:','Time:','Ran all','20 scenarios','78 steps','0m','---']):
            story.append(Paragraph(el, styles['SL']))
        elif '✓' in s or 'Passed' in s:
            gl = el.replace('✓','<font color="#4ade80">&#10003;</font>').replace('Passed','<font color="#4ade80">Passed</font>')
            story.append(Paragraph(gl, styles['TT']))
        elif s.startswith('Feature:') or s.startswith('Scenario:'):
            story.append(Paragraph(f'<font color="#93c5fd">{el}</font>', styles['TT']))
        else:
            story.append(Paragraph(el, styles['TT']))
    doc.build(story)
    print(f'Test PDF: {pdf_path}')

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    docs = r'C:\Users\HP\Desktop\SREgereksinim\docs'
    proto = r'C:\Users\HP\Desktop\SREgereksinim\FirstSaaSPrototype'
    tr = os.path.join(proto, 'test_results')

    # 4 doc PDFs
    for md, pdf in [('user_stories.md','user_stories.pdf'),('architecture_description.md','architecture_description.pdf'),
                     ('implementation_summary.md','implementation_summary.pdf'),('acceptance_tests.md','acceptance_tests.pdf')]:
        gen_doc_pdf(os.path.join(docs, md), os.path.join(proto, pdf))

    # Copy to docs/ too
    import shutil
    for pdf in ['user_stories.pdf','architecture_description.pdf','implementation_summary.pdf','acceptance_tests.pdf']:
        shutil.copy2(os.path.join(proto, pdf), os.path.join(docs, pdf))

    # 3 test result PDFs
    for txt, pdf, title in [('unit_results.txt','unit_results.pdf','Unit Test Results'),
                             ('functional_results.txt','functional_results.pdf','Functional Test Results'),
                             ('bdd_results.txt','bdd_results.pdf','BDD Acceptance Test Results')]:
        gen_test_pdf(os.path.join(tr, txt), os.path.join(tr, pdf), title)

    print('All PDFs generated.')
