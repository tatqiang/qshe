"""
Debug: Examine exact structure of TOC page
"""

import fitz

pdf = fitz.open(r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf")
page = pdf[2]  # Page 3 (0-indexed)

print("=== Page 3 Structure ===\n")

text_dict = page.get_text("dict")

for block_num, block in enumerate(text_dict["blocks"]):
    if "lines" not in block:
        continue
    
    print(f"\n--- Block {block_num} ---")
    
    for line_num, line in enumerate(block["lines"]):
        print(f"\nLine {line_num}:")
        
        # Collect full line text
        line_text = ""
        for span in line["spans"]:
            line_text += span["text"]
        
        print(f"  Full line: {repr(line_text[:100])}")
        
        # Show individual spans
        for span_num, span in enumerate(line["spans"]):
            print(f"    Span {span_num}: {repr(span['text'][:50])}")
            print(f"      BBox: {span['bbox']}")
            print(f"      Font: {span['font']}, Size: {span['size']:.1f}")
        
        # Check if it looks like TOC entry
        if any(keyword in line_text for keyword in ["Purpose", "Equipment", "Resources", "Procedures", "Preparation"]):
            print(f"  >>> POTENTIAL TOC ENTRY <<<")

pdf.close()
