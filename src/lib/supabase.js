import { createClient } from '@supabase/supabase-js';

// Reusing same project credentials from the mobile app
const SUPABASE_URL = 'https://ofwrnypqhmvocvozantn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3JueXBxaG12b2N2b3phbnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NTUyMTUsImV4cCI6MjA3MzQzMTIxNX0.aDX-nFt1eScLFbMeLJkhytNpnF9xotqYDNgcvIxjUwM';

// Initialize the Supabase client for the web
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
