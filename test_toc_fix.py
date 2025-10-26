"""
PDF Table of Contents Fixer - Debug Version
Tests if redactions and text insertions are actually working
"""

import sys
import fitz  # PyMuPDF
import os
import re

def test_simple_replacement(input_pdf, output_pdf):
    """
    Simple test - just try to replace one page number
    """
    try:
        doc = fitz.open(input_pdf)
        
        print("Opening PDF...")
        print(f"Total pages: {len(doc)}")
        
        # Go to page 3 (TOC page)
        page = doc[2]  # 0-indexed
        
        print("\n=== Original Page 3 Text ===")
        text = page.get_text()
        print(text[:500])
        
        # Get detailed text with positions
        print("\n=== Looking for page numbers in TOC ===")
        text_dict = page.get_text("dict")
        
        for block in text_dict["blocks"]:
            if "lines" not in block:
                continue
            
            for line in block["lines"]:
                for span in line["spans"]:
                    span_text = span["text"]
                    
                    # Look for "Resources" line
                    if "Resources" in span_text and re.search(r'\d+', span_text):
                        print(f"\nFound: {span_text}")
                        print(f"BBox: {span['bbox']}")
                        print(f"Font: {span['font']}, Size: {span['size']}")
                        
                        # Try to replace the number
                        bbox = span['bbox']
                        x0, y0, x1, y1 = bbox
                        
                        # Find just the number at the end
                        match = re.search(r'(\d+)\s*$', span_text)
                        if match:
                            old_num = match.group(1)
                            print(f"Old number: {old_num}")
                            
                            # Calculate position of just the number
                            char_width = span['size'] * 0.6
                            prefix = span_text[:match.start()]
                            prefix_width = len(prefix) * char_width
                            
                            num_x0 = x0 + prefix_width
                            
                            print(f"Number position: x={num_x0}, y={y1}")
                            
                            # Create redaction rectangle
                            redact_rect = fitz.Rect(num_x0 - 5, y0 - 1, x1 + 2, y1 + 1)
                            print(f"Redact rect: {redact_rect}")
                            
                            # Add redaction
                            page.add_redact_annot(redact_rect, fill=(1, 1, 1))
                            print("Added redaction annotation")
        
        # Apply all redactions
        print("\n=== Applying redactions ===")
        page.apply_redactions()
        print("Redactions applied")
        
        # Now add new text
        print("\n=== Adding new text ===")
        for block in text_dict["blocks"]:
            if "lines" not in block:
                continue
            
            for line in block["lines"]:
                for span in line["spans"]:
                    span_text = span["text"]
                    
                    if "Resources" in span_text and re.search(r'\d+', span_text):
                        bbox = span['bbox']
                        x0, y0, x1, y1 = bbox
                        
                        match = re.search(r'(\d+)\s*$', span_text)
                        if match:
                            char_width = span['size'] * 0.6
                            prefix = span_text[:match.start()]
                            prefix_width = len(prefix) * char_width
                            num_x0 = x0 + prefix_width
                            
                            # Insert "9" instead of "8"
                            page.insert_text(
                                (num_x0, y1 - 2),
                                "9",
                                fontsize=span['size'],
                                color=(0, 0, 0),
                                fontname="helv"
                            )
                            print(f"Inserted '9' at ({num_x0}, {y1 - 2})")
        
        # Save
        print("\n=== Saving ===")
        doc.save(output_pdf, garbage=4, deflate=True)
        doc.close()
        print(f"Saved to: {output_pdf}")
        
        # Read back and verify
        print("\n=== Verification ===")
        doc2 = fitz.open(output_pdf)
        page2 = doc2[2]
        text2 = page2.get_text()
        
        if "Resources" in text2:
            # Find the Resources line
            for line in text2.split('\n'):
                if "Resources" in line:
                    print(f"Resources line in output: {line}")
        
        doc2.close()
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    input_file = r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf"
    output_file = r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support_test.pdf"
    
    test_simple_replacement(input_file, output_file)
