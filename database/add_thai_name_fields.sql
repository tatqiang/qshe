-- Add Thai name fields to users table
ALTER TABLE users 
ADD COLUMN first_name_thai VARCHAR(255),
ADD COLUMN last_name_thai VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN users.first_name_thai IS 'First name in Thai language';
COMMENT ON COLUMN users.last_name_thai IS 'Last name in Thai language';
