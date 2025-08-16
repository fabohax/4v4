-- Waitlist table for storing email subscriptions
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'joined')),
  source VARCHAR(100) DEFAULT 'website',
  notes TEXT,
  
  -- Indexes for better performance
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Enable Row Level Security (RLS)
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

-- Function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_waitlist_updated_at 
  BEFORE UPDATE ON waitlist 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for public statistics (without exposing emails)
CREATE VIEW waitlist_stats AS 
SELECT 
  COUNT(*) as total_subscribers,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_subscribers,
  COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_subscribers,
  COUNT(CASE WHEN status = 'joined' THEN 1 END) as joined_subscribers,
  DATE_TRUNC('day', created_at) as signup_date,
  COUNT(*) as daily_signups
FROM waitlist 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY signup_date DESC;
