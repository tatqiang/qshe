"""
Debug: See which instance of "9" is being matched for each heading
"""

import fitz
import re

doc = fitz.open(r"c:\Users\snith\OneDrive\Desktop\MST_FRP_Support.pdf")
page = doc[2]

# Get headings and old page numbers
text = page.get_text()
lines = text.split('\n')

displayed_pages = {}
for line in lines:
    line_strip = line.strip()
    match = re.search(r'^(.+?)([.\s]{3,})(\d+)\s*$', line_strip)
    
    if match and len(match.group(1)) > 3:
        heading = match.group(1).strip()
        old_page = int(match.group(3))
        displayed_pages[heading] = old_page

print("=== Displayed pages ===")
for h, p in displayed_pages.items():
    print(f"{h}: {p}")

print("\n=== Matching process ===")

# Simulate the update process
updates = [
    {'heading': 'Resources', 'old_page': 8, 'actual_page': 9},
    {'heading': 'Procedures of Installation', 'old_page': 9, 'actual_page': 10},
    {'heading': 'Preparation', 'old_page': 9, 'actual_page': 10}
]

for update in updates:
    print(f"\nProcessing: {update['heading']}")
    old_str = str(update['old_page'])
    
    # Find old page number instances
    instances = page.search_for(old_str)
    print(f"  Found {len(instances)} instances of '{old_str}'")
    for i, inst in enumerate(instances):
        print(f"    Instance {i}: y={inst[1]:.1f}-{inst[3]:.1f}")
    
    # Find heading instances
    heading_instances = page.search_for(update['heading'][:15])
    print(f"  Found {len(heading_instances)} instances of heading '{update['heading'][:15]}'")
    for i, inst in enumerate(heading_instances):
        print(f"    Instance {i}: y={inst[1]:.1f}-{inst[3]:.1f}")
    
    # Find match
    if instances and heading_instances:
        h_y = heading_instances[0][1]
        print(f"  Heading Y position: {h_y:.1f}")
        
        for inst in instances:
            distance = abs(inst[1] - h_y)
            print(f"    Distance from inst at y={inst[1]:.1f}: {distance:.1f}")
            if distance < 20:
                print(f"    ✓ MATCH! Would replace at y={inst[1]:.1f}")
                break

doc.close()
