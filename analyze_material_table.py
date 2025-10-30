import pandas as pd
import os

# Path to the Excel file
excel_file = r"c:\pwa\qshe10\qshe\docs\inventory\material_table.xlsx"

print(f"Analyzing: {excel_file}")
print(f"File exists: {os.path.exists(excel_file)}\n")

if os.path.exists(excel_file):
    # Read all sheets
    xls = pd.ExcelFile(excel_file)
    print(f"Number of sheets: {len(xls.sheet_names)}")
    print(f"Sheet names: {xls.sheet_names}\n")
    
    # Analyze each sheet
    for sheet_name in xls.sheet_names:
        print(f"\n{'='*80}")
        print(f"SHEET: {sheet_name}")
        print(f"{'='*80}")
        
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        
        print(f"\nShape: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"\nColumns:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        
        print(f"\nColumn Details:")
        print(df.dtypes)
        
        print(f"\nFirst 10 rows:")
        print(df.head(10).to_string())
        
        print(f"\nData Summary:")
        print(df.describe(include='all').to_string())
        
        print(f"\nNull Values:")
        print(df.isnull().sum())
        
        print(f"\n" + "-"*80)
else:
    print("File not found!")
