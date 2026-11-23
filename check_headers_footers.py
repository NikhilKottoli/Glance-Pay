#!/usr/bin/env python3
"""Check headers and footers are empty."""
from docx import Document

doc = Document('AI_Decision_Framework_Energy_Report.docx')

for i, section in enumerate(doc.sections):
    print(f"=== Section {i+1} ===")
    print(f"Header paragraphs: {len(section.header.paragraphs)}")
    for p in section.header.paragraphs:
        print(f"  Header: '{p.text}'")
    
    print(f"Footer paragraphs: {len(section.footer.paragraphs)}")
    for p in section.footer.paragraphs:
        print(f"  Footer: '{p.text}'")
    
    # Check for any runs in header/footer
    for p in section.header.paragraphs:
        for run in p.runs:
            if run.text.strip():
                print(f"  Header run: '{run.text}'")
    for p in section.footer.paragraphs:
        for run in p.runs:
            if run.text.strip():
                print(f"  Footer run: '{run.text}'")

print("\nDone - headers and footers should be empty.")