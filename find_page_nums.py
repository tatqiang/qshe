import fitz

doc = fitz.open(r'c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf')
page = doc[2]
text = page.get_text()

print("=== Lines with single digits (likely page numbers) ===\n")

for line in text.split('\n'):
    line_clean = line.strip()
    if line_clean and line_clean.isdigit() and len(line_clean) < 3:
        print(f"Found: '{line_clean}'")

print("\n=== All short lines with digits ===\n")

for line in text.split('\n'):
    line_clean = line.strip()
    has_digit = any(c.isdigit() for c in line_clean)
    if line_clean and has_digit and len(line_clean) < 15 and ('Contents' not in line):
        print(f"Line: '{line_clean}'")

doc.close()
