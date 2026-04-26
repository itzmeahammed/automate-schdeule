# Supabase Integration Checklist

## ✅ Pre-Integration (Completed)

- [x] Install @supabase/supabase-js package
- [x] Create Supabase client configuration
- [x] Create database type definitions
- [x] Create authentication service
- [x] Create database services for all entities
- [x] Update AppContext with Supabase integration
- [x] Create database schema SQL file
- [x] Add environment variable template
- [x] Create comprehensive documentation
- [x] Create integration test suite
- [x] Verify build succeeds

## 📋 Your Setup Tasks

### Step 1: Create Supabase Project

- [ ] Go to [https://app.supabase.com](https://app.supabase.com)
- [ ] Sign in or create account
- [ ] Click "New Project"
- [ ] Enter project details:
  - Project name: ManufacturingPro
  - Database password: (choose a strong password)
  - Region: (select closest to you)
- [ ] Click "Create new project"
- [ ] Wait for project to be ready (2-3 minutes)

### Step 2: Set Up Database

- [ ] In Supabase dashboard, go to **SQL Editor**
- [ ] Open file: `supabase-schema.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click **Run** button
- [ ] Verify "Success" message appears
- [ ] Go to **Table Editor** and verify all tables are created:
  - [ ] users
  - [ ] machines
  - [ ] products
  - [ ] purchase_orders
  - [ ] schedule_items
  - [ ] shifts
  - [ ] notifications
  - [ ] alerts
  - [ ] holidays

### Step 3: Configure Application

- [ ] In Supabase dashboard, go to **Settings** → **API**
- [ ] Copy your **Project URL**
- [ ] Copy your **anon/public key** (NOT the service_role key!)
- [ ] Create `.env` file in project root (copy from `.env.example`)
- [ ] Paste credentials into `.env`:
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGci...
  ```
- [ ] Save `.env` file
- [ ] **Important**: Never commit `.env` to git (it's in .gitignore)

### Step 4: Run Application

- [ ] Stop development server if running (Ctrl+C)
- [ ] Restart development server:
  ```bash
  npm run dev
  ```
- [ ] Check console - should NOT see "Supabase not configured" warning
- [ ] Application should start normally

### Step 5: Create First User

- [ ] Open application in browser
- [ ] Click "Sign Up" or navigate to sign up page
- [ ] Enter details:
  - Email: your-email@example.com
  - Password: (min 6 characters)
  - Name: Your Name
  - Role: admin
- [ ] Click "Sign Up"
- [ ] **Note**: You may need to verify email (check Supabase settings)
- [ ] Check Supabase dashboard → **Authentication** → **Users**
- [ ] Verify your user appears in the list

### Step 6: Verify Database Connection

- [ ] Sign in to the application
- [ ] Go to **Master Data** → **Machines**
- [ ] Add a test machine
- [ ] Check Supabase dashboard → **Table Editor** → **machines**
- [ ] Verify the machine appears in database
- [ ] Refresh the application page
- [ ] Verify machine still appears (data persisted!)

### Step 7: Test All Features

Test each section to ensure database sync works:

#### Machines
- [ ] Create new machine
- [ ] Edit machine details
- [ ] Delete machine
- [ ] Verify data persists after refresh

#### Products
- [ ] Create new product with process flow
- [ ] Edit product details
- [ ] Delete product
- [ ] Verify data persists after refresh

#### Purchase Orders
- [ ] Create new purchase order
- [ ] Edit PO details
- [ ] Update PO status
- [ ] Delete purchase order
- [ ] Verify data persists after refresh

#### Scheduling
- [ ] Create purchase order
- [ ] Auto-generate schedule
- [ ] Update schedule item status
- [ ] Mark item as completed
- [ ] Verify schedule persists after refresh

#### Shifts
- [ ] Create new shift
- [ ] Edit shift timing and breaks
- [ ] Delete shift
- [ ] Verify data persists after refresh

#### Notifications
- [ ] Check for notifications
- [ ] Mark notification as read
- [ ] Verify notification status updates

#### Holidays
- [ ] Add holiday date
- [ ] Remove holiday date
- [ ] Verify holidays persist after refresh

### Step 8: Multi-User Testing (Optional)

- [ ] Open application in incognito/private window
- [ ] Sign up with different email
- [ ] Sign in with second user
- [ ] Create some data
- [ ] Check if first user can see the data (refresh required)
- [ ] Verify both users share the same database

### Step 9: Verify Security

- [ ] As operator role:
  - [ ] Verify can view data
  - [ ] Verify cannot create machines (admin only)
  - [ ] Verify cannot create shifts (admin only)
- [ ] As admin role:
  - [ ] Verify can create/edit all data
  - [ ] Verify can manage all features
- [ ] Sign out and verify redirected to login

### Step 10: Production Deployment (When Ready)

- [ ] Add environment variables to hosting platform (Vercel/Netlify):
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- [ ] Build and deploy application
- [ ] Test deployed application
- [ ] Verify all features work in production

## 🧪 Optional: Run Integration Tests

- [ ] Open browser console (F12)
- [ ] Type: `import('./src/tests/supabaseIntegrationTest').then(m => m.testSupabaseIntegration())`
- [ ] Press Enter
- [ ] Review test results
- [ ] Verify all tests pass ✅

## 🔧 Troubleshooting Checklist

If something doesn't work:

- [ ] Check `.env` file exists in project root
- [ ] Verify environment variables are correct (no extra spaces)
- [ ] Restart development server after adding `.env`
- [ ] Check browser console for errors (F12)
- [ ] Check Supabase dashboard → **Logs** for errors
- [ ] Verify SQL schema was run successfully
- [ ] Check internet connection
- [ ] Verify Supabase project is not paused
- [ ] Try signing out and signing back in

## 📚 Documentation Reference

When you need help:

1. **Setup Issues** → Read `SUPABASE_SETUP.md`
2. **API Questions** → Read `API_DOCUMENTATION.md`
3. **Overview** → Read `SUPABASE_INTEGRATION_SUMMARY.md`
4. **Supabase Specific** → Visit [Supabase Docs](https://supabase.com/docs)

## 🎉 Success Criteria

You'll know the integration is successful when:

- [x] Application builds without errors
- [ ] No "Supabase not configured" warnings in console
- [ ] Can sign up and sign in
- [ ] Can create/edit/delete data
- [ ] Data persists after browser refresh
- [ ] Data appears in Supabase Table Editor
- [ ] Multiple users can access same data
- [ ] All features work as expected

## 💾 Backup Your Work

Before making major changes:

- [ ] Export data from Supabase (SQL dump)
- [ ] Backup `.env` file securely
- [ ] Commit code changes to git
- [ ] Test thoroughly before deploying

## 🚀 You're Ready!

Once all checkboxes are complete, your ManufacturingPro application is fully integrated with Supabase and ready for production use!

---

**Need Help?**
- Check the documentation files
- Review Supabase dashboard logs
- Check browser console for errors
- Verify all setup steps were completed

**Pro Tip:** Keep your Supabase dashboard open while testing to see real-time database changes!
