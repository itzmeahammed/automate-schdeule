# ManufacturingPro - Supabase Integration Guide

This guide will help you set up and configure Supabase backend for the ManufacturingPro application.

## 📋 Prerequisites

- A Supabase account (create one at [https://supabase.com](https://supabase.com))
- Node.js 16+ installed
- Git installed

## 🚀 Quick Setup

### Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: ManufacturingPro (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (this may take a few minutes)

### Step 2: Set Up Database Schema

1. In your Supabase project dashboard, go to the **SQL Editor** section
2. Open the `supabase-schema.sql` file from the root of this project
3. Copy the entire content of the file
4. Paste it into the SQL Editor
5. Click **Run** to execute the SQL script

This will create all necessary tables, indexes, Row Level Security policies, and triggers.

### Step 3: Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. Create a `.env` file in the root of your project (or copy `.env.example` to `.env`):

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Example:**
```bash
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Install Dependencies

```bash
npm install
```

This will install the `@supabase/supabase-js` package along with other dependencies.

### Step 5: Run the Application

```bash
npm run dev
```

The application will now use Supabase for authentication and data storage!

## 🔧 Database Schema Overview

The Supabase database includes the following tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles extending Supabase Auth |
| `machines` | Manufacturing machines and equipment |
| `products` | Product definitions with process flows |
| `purchase_orders` | Customer purchase orders |
| `schedule_items` | Production schedule items |
| `shifts` | Work shift configurations |
| `notifications` | User notifications |
| `alerts` | System alerts and warnings |
| `holidays` | Company holiday calendar |

## 🔐 Authentication Flow

### Sign Up
```typescript
// The app automatically creates a user record when signing up
const result = await signUp({
  email: 'user@example.com',
  password: 'secure_password',
  name: 'John Doe',
  role: 'operator'
});
```

### Sign In
```typescript
const result = await signIn('user@example.com', 'secure_password');
```

### Sign Out
```typescript
await signOut();
```

## 📊 Data Operations

All CRUD operations are automatically synced with Supabase:

### Machines
- `addMachine(machine)` - Create a new machine
- `updateMachine(id, updates)` - Update machine details
- `deleteMachine(id)` - Delete a machine

### Products
- `addProduct(product)` - Create a new product
- `updateProduct(id, updates)` - Update product details
- `deleteProduct(id)` - Delete a product

### Purchase Orders
- `addPurchaseOrder(po)` - Create a new purchase order
- `updatePurchaseOrder(id, updates)` - Update PO details
- `deletePurchaseOrder(id)` - Delete a purchase order

### Schedule Items
- `setScheduleItems(items)` - Bulk update schedule
- `updateScheduleItem(id, updates)` - Update individual item

### Shifts
- `addShift(shift)` - Create a new shift
- `updateShift(id, updates)` - Update shift details
- `deleteShift(id)` - Delete a shift

## 🔒 Row Level Security (RLS)

The database is protected with Row Level Security policies:

### User Roles
- **Superadmin**: Full access to all features
- **Admin/Manager**: Can manage all data except user roles
- **Operator**: Can view data and manage their assigned tasks

### Policy Examples
- Users can only view their own user data
- Authenticated users can view all machines, products, and orders
- Only admins can create/modify machines and shifts
- Users can manage their own notifications

## 🎯 Offline Mode

The application supports offline mode with localStorage fallback:

- If Supabase credentials are not configured, the app runs in **offline mode**
- Data is stored in localStorage/Electron storage
- Perfect for development and testing without a backend
- To switch to Supabase, simply add your credentials to `.env`

## 🧪 Testing the Integration

### 1. Create a Test Account
```typescript
// Sign up through the UI
Email: test@example.com
Password: TestPassword123
Name: Test User
Role: admin
```

### 2. Verify Database
1. Go to Supabase Dashboard → **Table Editor**
2. Check the `users` table for your new user
3. Verify the `auth.users` table also has the entry

### 3. Test CRUD Operations
- Create a machine, product, or purchase order
- Check the database tables to verify data is saved
- Refresh the page - data should persist
- Try updating and deleting items

## 🐛 Troubleshooting

### Issue: "Supabase not configured" warning

**Solution**: Make sure you have:
1. Created a `.env` file in the project root
2. Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restarted the development server

### Issue: "Failed to fetch" errors

**Solution**: 
1. Check your internet connection
2. Verify Supabase project URL is correct
3. Ensure your Supabase project is active (not paused)

### Issue: "Row Level Security" errors

**Solution**:
1. Ensure you've run the complete `supabase-schema.sql` script
2. Verify RLS policies are enabled in Supabase Dashboard
3. Check that you're signed in with appropriate permissions

### Issue: Data not saving to database

**Solution**:
1. Open browser DevTools → Console
2. Look for error messages
3. Verify your auth token is valid (sign out and sign in again)
4. Check Supabase Dashboard → Logs for database errors

## 📚 API Reference

### Supabase Client
```typescript
import { supabase } from './lib/supabase';
```

### Database Services
```typescript
import { 
  machineService,
  productService,
  purchaseOrderService,
  scheduleItemService,
  shiftService,
  notificationService,
  alertService,
  holidayService,
  userService
} from './services/database';
```

### Auth Service
```typescript
import { authService } from './services/auth';
```

## 🔄 Data Migration

To migrate existing localStorage data to Supabase:

1. Export your current data (use browser DevTools → Application → Local Storage)
2. Create a migration script to insert data into Supabase
3. Or manually recreate your data in the new system

## 🌐 Deployment

### Vercel/Netlify
1. Add environment variables in your hosting dashboard
2. Deploy as usual - Vite will bundle the environment variables

### Electron App
The Electron app uses the same `.env` file. No additional configuration needed.

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong passwords** for Supabase database
3. **Rotate API keys** periodically
4. **Enable Multi-Factor Authentication** on your Supabase account
5. **Review RLS policies** regularly
6. **Monitor Supabase logs** for suspicious activity

## 📞 Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

For application issues:
- Check the browser console for errors
- Review Supabase Dashboard → Logs
- Verify your database schema matches the SQL file

## 🎉 Success!

Your ManufacturingPro application is now fully integrated with Supabase backend! 

All data is:
- ✅ Securely stored in PostgreSQL
- ✅ Protected with Row Level Security
- ✅ Automatically backed up
- ✅ Accessible from anywhere
- ✅ Real-time synchronized
