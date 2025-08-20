-- Migration script to normalize addresses to lowercase in the profiles table
-- This fixes the issue where addresses were saved in mixed case

-- Update all addresses to lowercase
UPDATE profiles 
SET address = LOWER(address)
WHERE address != LOWER(address);

-- Check for duplicates after normalization
SELECT address, COUNT(*) as count
FROM profiles 
GROUP BY address 
HAVING COUNT(*) > 1;

-- If duplicates exist, you may need to manually merge them
-- This query shows profiles with potential duplicates:
SELECT p1.id, p1.address, p1.username, p1.display_name, p1.created_at
FROM profiles p1
WHERE EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE LOWER(p1.address) = LOWER(p2.address) 
    AND p1.id != p2.id
)
ORDER BY LOWER(p1.address), p1.created_at;
