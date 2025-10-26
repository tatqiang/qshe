# PDF Page Number Replacement Tool

This tool automatically replaces page number placeholders in PDF files and fixes Table of Contents page numbers.

## Features

1. **Replace page number placeholders** with actual page numbers (e.g., "1 of 28", "2 of 28")
2. **Fix Table of Contents** page numbers that became incorrect after merging PDFs
3. **Center-aligned text** in table cells
4. **Multiple format support** - see formats below

## Supported Formats

| Syntax | Display Example |
|--------|-----------------|
| `{{p-x}}` | 1 |
| `{{p-x/y}}` | 1 / 28 |
| `{{p-xofy}}` | 1 of 28 |
| `{{pg-x}}` | Page 1 |
| `{{pg-x/y}}` | Page 1/28 |
| `{{pg-xofy}}` | Page 1 of 28 |

**Note:** Thai formats (`{{pt-x}}`, `{{pt-x/y}}`, `{{pt-xofy}}`) are also supported but may not display correctly.

## How to Use

### Method 1: Drag and Drop (Easiest)
1. Drag your PDF file onto `replace_pdf_pages.bat`
2. Wait for processing to complete
3. Find the output file with `_complete.pdf` suffix in the same directory

### Method 2: Double-click Batch File
1. Double-click `replace_pdf_pages.bat`
2. Enter the full path to your PDF file when prompted
3. Press Enter and wait for processing
4. Find the output file with `_complete.pdf` suffix

### Method 3: Command Line
```cmd
replace_pdf_pages.bat "C:\path\to\your\file.pdf"
```

### Method 4: Python Directly
```cmd
python pdf_complete_fixer.py "C:\path\to\your\file.pdf"
```

## Requirements

- **Python 3.x** (automatically checked by batch file)
- **PyMuPDF library** (automatically installed if missing)

## Output

The tool creates a new PDF file with `_complete.pdf` suffix in the same directory as the input file.

**Example:**
- Input: `MST_FRP_Support.pdf`
- Output: `MST_FRP_Support_complete.pdf`

## Workflow

1. Create your document in Word with page number placeholders (e.g., `{{p-xofy}}`)
2. Export to PDF from Word
3. Merge with other PDFs/images as needed
4. Run this tool to:
   - Replace all placeholders with correct page numbers
   - Fix TOC page numbers that changed due to merged content

## Troubleshooting

**"Python is not installed"**
- Install Python from https://www.python.org/
- Make sure to check "Add Python to PATH" during installation

**"File not found"**
- Make sure the file path is correct
- Use quotes around paths with spaces

**"Permission denied"**
- Close the PDF file if it's open in a viewer
- Make sure you have write permissions to the directory

## Files

- `pdf_complete_fixer.py` - Main Python script
- `replace_pdf_pages.bat` - Windows batch launcher
- `MST_page_test.pdf` - Test file with various formats

## Version

Last updated: October 25, 2025
