import fitz

doc = fitz.open(r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf")
page = doc[2]
links = page.get_links()

for i, link in enumerate(links[:6]):
    link_rect = fitz.Rect(link['from'])
    text = page.get_textbox(link_rect).strip()
    print(f"Link {i}:")
    print(f"  Rect: {link_rect}")
    print(f"  Text: {repr(text)}")
    print(f"  Destination page: {link['page'] + 1}")
    print()

doc.close()
