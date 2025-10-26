-- Populate position_title field based on existing position data
-- This maps the positions that should exist based on the application logic

UPDATE positions SET position_title = 'Managing Director' WHERE level = 1 AND code = 'MD' AND type = 'internal';
UPDATE positions SET position_title = 'General Manager' WHERE level = 2 AND code = 'GM' AND type = 'internal';
UPDATE positions SET position_title = 'Head of Business Unit' WHERE level = 2 AND code = 'BU' AND type = 'internal';
UPDATE positions SET position_title = 'Project Director' WHERE level = 3 AND code = 'PD' AND type = 'internal';
UPDATE positions SET position_title = 'Project Manager' WHERE level = 4 AND code = 'PM' AND type = 'internal';
UPDATE positions SET position_title = 'Assistant Project Manager' WHERE level = 5 AND code = 'APM' AND type = 'internal';
UPDATE positions SET position_title = 'QSHE Manager' WHERE level = 4 AND code = 'QSHEM' AND type = 'internal';
UPDATE positions SET position_title = 'Project Engineer' WHERE level = 6 AND code = 'PE' AND type = 'internal';
UPDATE positions SET position_title = 'Site Engineer' WHERE level = 7 AND code = 'SE' AND type = 'internal';
UPDATE positions SET position_title = 'Supervisor' WHERE level = 8 AND code = 'SUP' AND type = 'internal';
UPDATE positions SET position_title = 'Foreman' WHERE level = 9 AND code = 'FM' AND type = 'internal';
UPDATE positions SET position_title = 'Team Head' WHERE level = 1 AND code = 'H' AND type = 'external';
UPDATE positions SET position_title = 'Worker' WHERE level = 2 AND code = 'W' AND type = 'external';

-- Check the results
SELECT id, level, position_title, code, type FROM positions ORDER BY type, level;
