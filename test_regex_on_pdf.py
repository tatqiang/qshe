import fitz
import re

doc = fitz.open(r'c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf')
page = doc[2]
text = page.get_text()
lines = text.split('\n')

print("=== Testing regex on actual PDF lines ===\n")

for i, line in enumerate(lines):
    line_strip = line.strip()
    
    # Test regex
    match = re.search(r'^(.+?)([.\s]{3,})(\d+)\s*$', line_strip)
    
    if match and len(match.group(1)) > 3:
        heading = match.group(1).strip()
        dots = match.group(2)
        page_num = int(match.group(3))
        
        print(f"Line {i}: MATCH!")
        print(f"  Full line: {repr(line[:80])}")
        print(f"  Heading: {repr(heading)}")
        print(f"  Page num: {page_num}")
        print()

doc.close()
