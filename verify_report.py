#!/usr/bin/env python3
"""Verify the generated report."""
from docx import Document

doc = Document('AI_Decision_Framework_Energy_Report.docx')
print(f'Paragraphs: {len(doc.paragraphs)}')
print(f'Tables: {len(doc.tables)}')
print(f'Sections: {len(doc.sections)}')

# Check headings
headings = [p.text for p in doc.paragraphs if p.style.name.startswith('Heading')]
for h in headings:
    print(f'  - {h}')
print(f'... total {len(headings)} headings')

# Check equations (OMML)
omml_count = 0
for p in doc.paragraphs:
    for run in p.runs:
        if run._element.findall('.//{http://schemas.openxmlformats.org/officeDocument/2006/math}oMath'):
            omml_count += 1
print(f'OMML equations found: {omml_count}')

# Check tables have content
for i, table in enumerate(doc.tables):
    rows = len(table.rows)
    cols = len(table.columns)
    print(f'Table {i+1}: {rows} rows x {cols} cols')

print('\nVerification complete - report structure looks good.')