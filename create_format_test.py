"""
Test all page number formats
Creates a test PDF with all format examples
Tests the new feature: adding page numbers to pages without {{tag}}
"""

import fitz

# Create a new PDF
doc = fitz.open()

# Add a page
page = doc.new_page(width=595, height=842)  # A4 size

# Add title
page.insert_text((50, 50), "Page Number Format Test", fontsize=16, color=(0, 0, 1))

# Add all format examples
y = 100
formats = [
    ("{{pages}}", "Legacy format"),
    ("{{p-x}}", "Simple: just page number"),
    ("{{p-x/y}}", "Simple: page / total"),
    ("{{p-xofy}}", "Simple: page of total"),
    ("{{pg-x}}", "With 'Page' prefix: Page x"),
    ("{{pg-x/y}}", "With 'Page' prefix: Page x/y"),
    ("{{pg-xofy}}", "With 'Page' prefix: Page x of y"),
    ("{{pt-x}}", "Thai format: หน้า x"),
    ("{{pt-x/y}}", "Thai format: หน้า x / y"),
    ("{{pt-xofy}}", "Thai format: หน้า x ของ y"),
]

for pattern, description in formats:
    # Draw format
    page.insert_text((50, y), f"{pattern}", fontsize=12, color=(0, 0, 0))
    page.insert_text((200, y), f"→ {description}", fontsize=10, color=(0.5, 0.5, 0.5))
    y += 25

# Add a second page to test actual replacements
page2 = doc.new_page(width=595, height=842)
page2.insert_text((50, 50), "Test Page 2 - With Placeholders", fontsize=16, color=(0, 0, 1))

y = 100
page2.insert_text((50, y), "Header with {{p-x}}", fontsize=12)
y += 25
page2.insert_text((50, y), "Header with {{pg-xofy}}", fontsize=12)
y += 25
page2.insert_text((50, y), "Thai header: {{pt-x/y}}", fontsize=12)

# Add a third page
page3 = doc.new_page(width=595, height=842)
page3.insert_text((50, 50), "Test Page 3 - With Placeholders", fontsize=16, color=(0, 0, 1))
page3.insert_text((50, 100), "Footer: {{pages}}", fontsize=12)
page3.insert_text((50, 125), "Thai: {{pt-xofy}}", fontsize=12)

# Add pages 4 and 5 WITHOUT placeholders (to test the new feature)
page4 = doc.new_page(width=595, height=842)
page4.insert_text((50, 50), "Test Page 4 - NO Placeholders", fontsize=16, color=(1, 0, 0))
page4.insert_text((50, 100), "This page has NO {{tag}} placeholders.", fontsize=12)
page4.insert_text((50, 125), "The tool should ask if you want to add page numbers here.", fontsize=10, color=(0.5, 0.5, 0.5))

page5 = doc.new_page(width=595, height=842)
page5.insert_text((50, 50), "Test Page 5 - NO Placeholders", fontsize=16, color=(1, 0, 0))
page5.insert_text((50, 100), "This page also has NO {{tag}} placeholders.", fontsize=12)
page5.insert_text((50, 125), "You can choose format (a-f) and position (a-f) for page numbers.", fontsize=10, color=(0.5, 0.5, 0.5))

# Save
output_file = r"c:\Users\snith\OneDrive\Desktop\format_test.pdf"
doc.save(output_file)
doc.close()

print(f"✅ Created test PDF: {output_file}")
print("\nNow run:")
print(f'  python pdf_pages.py "{output_file}"')
print("\nExpected results:")
print("  • Pages 1-3: Placeholders will be replaced")
print("  • Pages 4-5: NO placeholders - choose format and position")
print("\nExpected on page 2:")
print("  • {{p-x}} → 2")
print("  • {{pg-xofy}} → Page 2 of 5")
print("  • {{pt-x/y}} → หน้า 2 / 5")
print("\nNew Feature Test:")
print("  • Choose format option (0-6)")
print("  • If not 0: Choose position (1-6)")
print("  • Pages 4-5 will get page numbers added automatically!")
