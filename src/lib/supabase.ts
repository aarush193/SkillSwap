import { createClient } from '@supabase/supabase-js';

// Use hardcoded values instead of environment variables
const supabaseUrl = 'https://jlapqyyfkecnvgmuuygt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYXBxeXlma2VjbnZnbXV1eWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDYzMDIsImV4cCI6MjEwMTQyMjMwMn0.DkDNCJM-KvOVfpNt-AU-tVB-cGnwM7wKsHJSFKD0jVs';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
); 