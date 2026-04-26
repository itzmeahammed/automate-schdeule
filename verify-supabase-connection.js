/**
 * Supabase Connection Verification Script
 * Run this to verify your Supabase connection is working
 * 
 * Usage: node verify-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpapixvizqxwivwocfyr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYXBpeHZpenF4d2l2d29jZnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzA1NDAsImV4cCI6MjA4MDQwNjU0MH0.Mck5hkgSXlkxKCBjs-6_ggEKVLLRBEyPn3vIfvjBHMc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testing Supabase Connection...\n');

async function verifyConnection() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1️⃣ Testing database connection...');
    const { data, error } = await supabase.from('machines').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('\n📝 Next Steps:');
      console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL script from: supabase-schema.sql');
      console.log('4. This will create all required tables\n');
      return false;
    }
    
    console.log('✅ Connection successful!\n');
    
    // Test 2: Check if tables exist
    console.log('2️⃣ Checking database tables...');
    const tables = ['users', 'machines', 'products', 'purchase_orders', 'schedule_items', 'shifts', 'notifications', 'alerts', 'holidays'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (tableError) {
          console.log(`❌ Table '${table}' not found`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}'`);
      }
    }
    
    console.log('\n3️⃣ Connection Summary:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Status: ✅ Connected`);
    console.log(`   Ready: ${error ? '❌ No' : '✅ Yes'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verifyConnection().then((success) => {
  if (success) {
    console.log('\n🎉 Supabase is ready to use!');
    console.log('Your ManufacturingPro app is now connected to the cloud!\n');
  } else {
    console.log('\n⚠️  Setup required - please run the database schema SQL file.\n');
  }
  process.exit(success ? 0 : 1);
});
