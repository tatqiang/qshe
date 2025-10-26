@echo off
echo ============================================
echo Add Street/Road Field to Member Form
echo ============================================
echo.

echo Adding "ถนน" field after "เลขที่"...
psql %DATABASE_URL% -f database\add_address_street_field.sql

if errorlevel 1 (
    echo.
    echo ❌ ERROR: Failed to add field
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ Field added successfully!
echo ============================================
echo.
echo New field order:
echo 1. เลขที่ (address_house_number)
echo 2. ถนน (address_street) <- NEW!
echo 3. หมู่ (address_moo)
echo 4. ซอย (address_soi)
echo 5. ตำบล (address_tambon)
echo 6. อำเภอ (address_amphoe)
echo 7. จังหวัด (address_province)
echo.
pause
