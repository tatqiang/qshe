# Company Logo Instructions

## Where to Place Your Logo

Replace the logo file in this `/public` folder:

### Option 1: SVG Format (Recommended)
- File: `logo.svg`
- Best for: Scalable, sharp printing
- Size: Any size (SVG is vector)

### Option 2: PNG Format
- File: `logo.png`
- Recommended size: 200x200 pixels or larger
- Best for: Photos or complex designs

## The Material Receive Report will use:
1. First try to load `/logo.svg`
2. If SVG fails, fallback to `/logo.png`

## Logo Display Settings:
- Print size: 80mm x 80mm (20x20 in CSS)
- Position: Top left corner of report
- Style: Object-contain (maintains aspect ratio)

## To Update:
Simply replace `logo.svg` or `logo.png` in this folder with your company logo.
The system will automatically use the new logo on all Material Receive Reports.
