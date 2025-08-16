# Quick Fix for 500 Error - Waitlist Table Missing

The 500 error is likely because the `waitlist` table doesn't exist in your Supabase database yet.

## Quick Solution:

### Option 1: Create Table via Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Click on "SQL Editor"  
3. Copy and paste this SQL:

```sql
-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'joined')),
  source VARCHAR(100) DEFAULT 'website',
  notes TEXT,
  
  -- Email validation constraint
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert access (anyone can join waitlist)
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT 
  TO public
  WITH CHECK (true);

-- Create policy for authenticated users to read (optional - for admin access)
CREATE POLICY "Authenticated users can read waitlist" ON waitlist
  FOR SELECT 
  TO authenticated
  USING (true);
```

4. Click "Run" to execute the SQL

### Option 2: Temporary Fix (Skip Database)
If you want to test without the database first, I can modify the API to just send emails without storing in database temporarily.

### Option 3: Check Environment Variables
Make sure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key  
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

## Test the Fix:
1. After creating the table, try submitting the waitlist form again
2. Check the Network tab in browser dev tools for the API response
3. If you see the table in Supabase dashboard, the fix worked!

## Common Issues:
- **42P01 error**: Table doesn't exist (run the SQL above)
- **Missing environment variables**: Check your .env.local file
- **Permission denied**: Make sure RLS policies are set correctly (included in SQL above)
