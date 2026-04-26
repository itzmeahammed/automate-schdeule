# Supabase Quick Reference Card

## 🔑 Environment Setup

```bash
# .env file
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🔐 Authentication

### Sign Up
```typescript
const { signUp } = useApp();
await signUp({
  email: 'user@example.com',
  password: 'password',
  name: 'John Doe',
  role: 'admin'
});
```

### Sign In
```typescript
const { signIn } = useApp();
await signIn('user@example.com', 'password');
```

### Sign Out
```typescript
const { signOut } = useApp();
await signOut();
```

## 📊 CRUD Operations

### Get Data
```typescript
const { machines, products, purchaseOrders } = useApp();
// Data is automatically loaded from Supabase
```

### Create
```typescript
const { addMachine, addProduct, addPurchaseOrder } = useApp();

await addMachine(newMachine);
await addProduct(newProduct);
await addPurchaseOrder(newPO);
```

### Update
```typescript
const { updateMachine, updateProduct, updatePurchaseOrder } = useApp();

await updateMachine('id', { status: 'maintenance' });
await updateProduct('id', { priority: 'high' });
await updatePurchaseOrder('id', { status: 'completed' });
```

### Delete
```typescript
const { deleteMachine, deleteProduct, deletePurchaseOrder } = useApp();

await deleteMachine('id');
await deleteProduct('id');
await deletePurchaseOrder('id');
```

## 🔧 Direct Service Usage

### Import Services
```typescript
import { 
  machineService,
  productService,
  authService 
} from './services/database';
```

### Machine Operations
```typescript
// Get all machines
const machines = await machineService.getAll();

// Get by ID
const machine = await machineService.getById('id');

// Create
const created = await machineService.create(machineData);

// Update
const updated = await machineService.update('id', updates);

// Delete
await machineService.delete('id');
```

### Purchase Order Operations
```typescript
const orders = await purchaseOrderService.getAll();
const order = await purchaseOrderService.getById('id');
const created = await purchaseOrderService.create(poData);
```

### Schedule Operations
```typescript
// Get all schedule items
const items = await scheduleItemService.getAll();

// Get by PO ID
const poItems = await scheduleItemService.getByPoId('po-id');

// Bulk create (for auto-scheduling)
const created = await scheduleItemService.bulkCreate([
  scheduleItem1,
  scheduleItem2,
  // ... more items
]);
```

## 🔔 Notifications

### Create Notification
```typescript
const { addSystemNotification } = useApp();

addSystemNotification(
  'success',  // type: 'info' | 'warning' | 'error' | 'success'
  'Title',
  'Message text'
);
```

### Mark as Read
```typescript
const { markNotificationAsRead } = useApp();
await markNotificationAsRead('notification-id');
```

## 🚨 Alerts

### Create Alert
```typescript
import { alertService } from './services/database';

await alertService.create({
  type: 'delivery_risk',
  severity: 'high',
  message: 'PO delayed',
  suggestedActions: ['Action 1', 'Action 2'],
  affectedEntities: ['po-id'],
  timestamp: new Date().toISOString(),
  isResolved: false
});
```

### Resolve Alert
```typescript
const { resolveAlert } = useApp();
await resolveAlert('alert-id');
```

## 📅 Holidays

### Add Holiday
```typescript
import { holidayService } from './services/database';

await holidayService.addHoliday('2024-12-25', 'Christmas');
```

### Get Holidays
```typescript
const holidays = await holidayService.getAll();
// Returns: ['2024-12-25|Christmas', ...]
```

### Remove Holiday
```typescript
await holidayService.removeHoliday('2024-12-25');
```

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles |
| `machines` | Equipment/machines |
| `products` | Product definitions |
| `purchase_orders` | Customer orders |
| `schedule_items` | Production schedule |
| `shifts` | Work shifts |
| `notifications` | User notifications |
| `alerts` | System alerts |
| `holidays` | Holiday calendar |

## 🔒 User Roles & Permissions

| Role | Machines | Products | POs | Schedule | Shifts | Reports |
|------|----------|----------|-----|----------|--------|---------|
| **Superadmin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Operator** | 👁️ View | 👁️ View | ✅ Full | ✅ Full | 👁️ View | ❌ None |

## 🔍 Common SQL Queries

### Check User Count
```sql
SELECT COUNT(*) FROM auth.users;
```

### View Recent Orders
```sql
SELECT * FROM purchase_orders 
ORDER BY created_at DESC 
LIMIT 10;
```

### Find Active Machines
```sql
SELECT * FROM machines 
WHERE status = 'active';
```

### Get Schedule for Today
```sql
SELECT * FROM schedule_items 
WHERE DATE(start_date) = CURRENT_DATE;
```

## 🐛 Debugging

### Check Supabase Connection
```typescript
import { isSupabaseConfigured } from './lib/supabase';

if (isSupabaseConfigured()) {
  console.log('✅ Supabase connected');
} else {
  console.log('❌ Running in offline mode');
}
```

### View Console Logs
```javascript
// Open browser DevTools (F12)
// Look for:
[ElectronStorage] Saved machines  // Offline mode
Success: Machine created          // Supabase mode
Error: ...                        // Any errors
```

### Check Supabase Dashboard
1. Go to **Logs** section
2. Filter by:
   - API requests
   - Database queries
   - Errors
3. Look for failed queries or auth errors

## 📱 API Endpoints (Supabase Auto-Generated)

```
GET    /rest/v1/machines
POST   /rest/v1/machines
PATCH  /rest/v1/machines?id=eq.{id}
DELETE /rest/v1/machines?id=eq.{id}

GET    /rest/v1/products
POST   /rest/v1/products
...

(Similar for all tables)
```

## 🔐 Security Headers

```typescript
// All API calls automatically include:
{
  'apikey': 'your-anon-key',
  'Authorization': 'Bearer your-session-token'
}
```

## 🎯 Best Practices

### ✅ DO
- Use AppContext methods for CRUD operations
- Handle async operations with await
- Check return values before using data
- Sign out when testing different roles
- Keep `.env` file secret
- Monitor Supabase logs

### ❌ DON'T
- Commit `.env` to git
- Use service_role key in frontend
- Make direct Supabase calls without error handling
- Expose sensitive data in console.log
- Share API keys publicly
- Ignore TypeScript errors

## 🚀 Performance Tips

### Batch Operations
```typescript
// ✅ Good - Single call
await scheduleItemService.bulkCreate(items);

// ❌ Bad - Multiple calls
for (const item of items) {
  await scheduleItemService.create(item);
}
```

### Selective Loading
```typescript
// Only load what you need
const { data } = await supabase
  .from('machines')
  .select('id, machineName, status') // Only these fields
  .eq('status', 'active');
```

## 📞 Support Links

- **Supabase Docs**: https://supabase.com/docs
- **API Reference**: See `API_DOCUMENTATION.md`
- **Setup Guide**: See `SUPABASE_SETUP.md`
- **Integration Guide**: See `SUPABASE_INTEGRATION_SUMMARY.md`

---

**Quick Tip**: Keep this card handy for quick reference during development!
