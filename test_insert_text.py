"""
TOC Fixer - Test without redaction, just add numbers in different color
"""

import fitz

doc = fitz.open(r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf")
page = doc[2]

# Just try inserting text at a known position
page.insert_text(
    (560, 270),
    "TEST",
    fontsize=14,
    color=(1, 0, 0)  # RED
)

doc.save(r"c:\Users\snith\OneDrive\Desktop\test_insert.pdf")
doc.close()

print("✓ Saved test_insert.pdf - check if 'TEST' appears in red near Resources line")
