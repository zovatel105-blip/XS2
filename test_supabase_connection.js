// Test Supabase connection
const { createClient } = require('./frontend/node_modules/@supabase/supabase-js')

const supabaseUrl = 'https://ixpxjfgnkjanltukhvvz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cHhqZmdua2phbmx0dWtoZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDc3NTMsImV4cCI6MjA3MzI4Mzc1M30.eUYpYcIffqQIW3eabJoswnR_RGf0-UctYsB-nTsXBIY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed (expected if tables don\'t exist yet):', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Data:', data);
    return true;
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    return false;
  }
}

testConnection();