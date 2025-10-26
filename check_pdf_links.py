"""
Check if PDF has built-in TOC links (bookmarks/destinations)
"""

import fitz

doc = fitz.open(r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf")

print("=== PDF Outline (Bookmarks) ===")
outline = doc.get_toc()
if outline:
    for item in outline:
        level, title, page_num = item
        print(f"{'  ' * (level-1)}{title} → Page {page_num}")
else:
    print("No outline/bookmarks found")

print("\n=== Checking TOC page for links ===")
page = doc[2]  # Page 3 (TOC)

links = page.get_links()
print(f"Found {len(links)} links on page 3")

for i, link in enumerate(links[:15]):  # Show first 15
    if 'page' in link:
        dest_page = link['page'] + 1  # 0-indexed to 1-indexed
        
        # Get text at link position
        rect = fitz.Rect(link['from'])
        text = page.get_textbox(rect).strip()
        
        print(f"Link {i}: '{text[:40]}' → Page {dest_page}")
        print(f"  BBox: {link['from']}")

doc.close()
