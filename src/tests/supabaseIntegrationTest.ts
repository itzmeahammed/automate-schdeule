/**
 * Supabase Integration Test Suite
 * 
 * This script tests the database connectivity and basic CRUD operations.
 * Run this in the browser console to verify your Supabase setup.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  machineService,
  productService,
  purchaseOrderService,
  scheduleItemService,
  shiftService,
  notificationService,
  alertService,
  holidayService
} from '../services/database';
import { authService } from '../services/auth';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

const log = (test: string, passed: boolean, message: string, data?: any) => {
  results.push({ test, passed, message, data });
  console.log(`${passed ? '✅' : '❌'} ${test}: ${message}`);
  if (data) console.log('  Data:', data);
};

export async function testSupabaseIntegration() {
  console.log('🔍 Starting Supabase Integration Tests...\n');

  // Test 1: Configuration Check
  try {
    const configured = isSupabaseConfigured();
    log('Configuration Check', configured, configured ? 'Supabase is configured' : 'Supabase not configured - using offline mode');
    
    if (!configured) {
      console.log('\n⚠️ Supabase is not configured. Tests will be skipped.');
      console.log('To configure Supabase:');
      console.log('1. Create a .env file in the project root');
      console.log('2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      console.log('3. Restart the development server\n');
      return results;
    }
  } catch (error: any) {
    log('Configuration Check', false, error.message);
  }

  // Test 2: Database Connection
  try {
    const { data, error } = await supabase.from('machines').select('count');
    log('Database Connection', !error, error ? error.message : 'Connected to Supabase successfully');
  } catch (error: any) {
    log('Database Connection', false, error.message);
  }

  // Test 3: Authentication - Sign Up
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let testUserId: string = '';

  try {
    const result = await authService.signUp({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      role: 'operator'
    });
    
    testUserId = result.user?.id || '';
    log('Authentication - Sign Up', result.success, result.message, result.user);
  } catch (error: any) {
    log('Authentication - Sign Up', false, error.message);
  }

  // Test 4: Authentication - Sign In
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for user creation
    
    const result = await authService.signIn({
      email: testEmail,
      password: testPassword
    });
    
    log('Authentication - Sign In', result.success, result.message, { token: result.token?.substring(0, 20) + '...' });
  } catch (error: any) {
    log('Authentication - Sign In', false, error.message);
  }

  // Test 5: Machine CRUD
  let testMachineId: string = '';
  
  try {
    // Create
    const machine = await machineService.create({
      machineName: 'Test Machine',
      machineType: 'Test Type',
      capacity: '100',
      shiftTiming: '08:00-16:00',
      status: 'active',
      location: 'Test Location',
      efficiency: 90,
      lastMaintenance: '2024-01-01',
      nextMaintenance: '2024-02-01',
      specifications: {
        power: '10kW',
        dimensions: '1m x 1m x 1m',
        weight: '500kg'
      },
      problems: []
    });
    
    testMachineId = machine.id;
    log('Machine - Create', true, 'Machine created successfully', { id: machine.id, name: machine.machineName });
  } catch (error: any) {
    log('Machine - Create', false, error.message);
  }

  try {
    // Read
    const machines = await machineService.getAll();
    log('Machine - Read All', machines.length > 0, `Retrieved ${machines.length} machines`);
  } catch (error: any) {
    log('Machine - Read All', false, error.message);
  }

  try {
    // Update
    if (testMachineId) {
      const updated = await machineService.update(testMachineId, {
        status: 'maintenance',
        efficiency: 0
      });
      log('Machine - Update', updated.status === 'maintenance', 'Machine updated successfully');
    }
  } catch (error: any) {
    log('Machine - Update', false, error.message);
  }

  try {
    // Delete
    if (testMachineId) {
      await machineService.delete(testMachineId);
      log('Machine - Delete', true, 'Machine deleted successfully');
    }
  } catch (error: any) {
    log('Machine - Delete', false, error.message);
  }

  // Test 6: Product Service
  try {
    const products = await productService.getAll();
    log('Product Service', true, `Retrieved ${products.length} products`);
  } catch (error: any) {
    log('Product Service', false, error.message);
  }

  // Test 7: Purchase Order Service
  try {
    const orders = await purchaseOrderService.getAll();
    log('Purchase Order Service', true, `Retrieved ${orders.length} purchase orders`);
  } catch (error: any) {
    log('Purchase Order Service', false, error.message);
  }

  // Test 8: Schedule Item Service
  try {
    const items = await scheduleItemService.getAll();
    log('Schedule Item Service', true, `Retrieved ${items.length} schedule items`);
  } catch (error: any) {
    log('Schedule Item Service', false, error.message);
  }

  // Test 9: Shift Service
  try {
    const shifts = await shiftService.getAll();
    log('Shift Service', true, `Retrieved ${shifts.length} shifts`);
  } catch (error: any) {
    log('Shift Service', false, error.message);
  }

  // Test 10: Notification Service
  try {
    const notification = await notificationService.create({
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification',
      timestamp: new Date().toISOString(),
      isRead: false,
      actionRequired: false
    });
    
    await notificationService.markAsRead(notification.id);
    await notificationService.delete(notification.id);
    
    log('Notification Service', true, 'Notification CRUD operations successful');
  } catch (error: any) {
    log('Notification Service', false, error.message);
  }

  // Test 11: Alert Service
  try {
    const alert = await alertService.create({
      type: 'delivery_risk',
      severity: 'medium',
      message: 'Test alert',
      suggestedActions: ['Test action'],
      affectedEntities: ['test-entity'],
      timestamp: new Date().toISOString(),
      isResolved: false
    });
    
    await alertService.resolve(alert.id);
    await alertService.delete(alert.id);
    
    log('Alert Service', true, 'Alert CRUD operations successful');
  } catch (error: any) {
    log('Alert Service', false, error.message);
  }

  // Test 12: Holiday Service
  try {
    await holidayService.addHoliday('2024-12-25', 'Christmas Test');
    const holidays = await holidayService.getAll();
    await holidayService.removeHoliday('2024-12-25');
    
    log('Holiday Service', true, `Holiday operations successful, ${holidays.length} total holidays`);
  } catch (error: any) {
    log('Holiday Service', false, error.message);
  }

  // Test 13: Sign Out
  try {
    await authService.signOut();
    log('Authentication - Sign Out', true, 'Signed out successfully');
  } catch (error: any) {
    log('Authentication - Sign Out', false, error.message);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('─'.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${percentage}%)`);
  console.log(`Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Supabase integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above for details.');
  }

  return results;
}

// Auto-run tests if in development mode
if (import.meta.env.DEV) {
  console.log('To run Supabase integration tests, call: testSupabaseIntegration()');
}
