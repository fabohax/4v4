// Simple script to create the waitlist table in Supabase
// Run this once to set up the database

import { supabaseAdmin } from '../lib/supabaseClient.js';

async function createWaitlistTable() {
  console.log('Creating waitlist table...');
  
  try {
    // Create the table with SQL
    const { data, error } = await supabaseAdmin.rpc('sql', {
      query: `
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
          CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
        CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

        -- Enable RLS
        ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
        CREATE POLICY "Anyone can join waitlist" ON waitlist
          FOR INSERT 
          TO public
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Authenticated users can read waitlist" ON waitlist;
        CREATE POLICY "Authenticated users can read waitlist" ON waitlist
          FOR SELECT 
          TO authenticated
          USING (true);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('✅ Waitlist table created successfully!');
      console.log('Data:', data);
    }

    // Test the table by inserting a test record
    console.log('\nTesting table insertion...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('waitlist')
      .insert({ email: 'test@example.com', source: 'setup-script' })
      .select();

    if (testError) {
      console.error('Test insertion failed:', testError);
    } else {
      console.log('✅ Test insertion successful:', testData);

      // Clean up test record
      await supabaseAdmin
        .from('waitlist')
        .delete()
        .eq('email', 'test@example.com');
      console.log('Test record cleaned up');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup
createWaitlistTable();
