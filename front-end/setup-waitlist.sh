#!/bin/bash

# Setup script for 4V4 Waitlist Table in Supabase
# This script creates the waitlist table with proper constraints and RLS policies

echo "Setting up 4V4 Waitlist table in Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Not in a Supabase project directory."
    echo "Run 'supabase init' first or navigate to your Supabase project folder."
    exit 1
fi

# Apply the migration
echo "Creating waitlist table migration..."
supabase db diff --file waitlist_table --schema public

# Apply the SQL directly
echo "Applying waitlist table schema..."
supabase db reset --db-url "$DATABASE_URL" --migrations-path ./sql/waitlist.sql

echo "✅ Waitlist table setup complete!"
echo ""
echo "Features enabled:"
echo "- Email validation with regex constraint"
echo "- Duplicate email prevention"
echo "- Row Level Security (RLS)"
echo "- Auto-updating timestamps"
echo "- Public insert access (for website)"
echo "- Admin read access (for authenticated users)"
echo ""
echo "Next steps:"
echo "1. Make sure your SUPABASE_SECRET_KEY is set in .env.local"
echo "2. Test the waitlist form on your website"
echo "3. Check the Supabase dashboard to verify the table was created"
