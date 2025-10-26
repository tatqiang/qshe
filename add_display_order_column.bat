@echo off
echo ============================================
echo Add custom_display_order column
echo ============================================
echo.

echo Running migration...
psql %DATABASE_URL% -f database\add_custom_display_order.sql

if errorlevel 1 (
    echo.
    echo ❌ ERROR: Migration failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ Migration complete!
echo ============================================
echo.
echo The custom_display_order column is now available.
echo You can now drag and drop fields to reorder them.
echo.
pause
