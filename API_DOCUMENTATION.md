# ManufacturingPro - Backend Integration API Documentation

## Overview

This document describes the complete backend integration architecture for ManufacturingPro using Supabase.

## Architecture

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │
       ├── Auth Service
       ├── Database Services
       └── Supabase Client
              │
              ▼
       ┌────────────┐
       │  Supabase  │
       │   Cloud    │
       └────────────┘
              │
              ├── PostgreSQL Database
              ├── Authentication
              ├── Row Level Security
              └── Real-time Subscriptions
```

## Core Services

### 1. Authentication Service (`src/services/auth.ts`)

Handles all user authentication operations using Supabase Auth.

#### Methods

##### `authService.signUp(data: SignUpData)`
Creates a new user account with email verification.

**Parameters:**
```typescript
{
  email: string;
  password: string;
  name: string;
  role?: string; // 'admin' | 'manager' | 'operator'
}
```

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  user?: AuthUser;
}
```

**Example:**
```typescript
const result = await authService.signUp({
  email: 'john.doe@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  role: 'admin'
});

if (result.success) {
  console.log('User created:', result.user);
}
```

---

##### `authService.signIn(data: SignInData)`
Authenticates an existing user.

**Parameters:**
```typescript
{
  email: string;
  password: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}
```

**Example:**
```typescript
const result = await authService.signIn({
  email: 'john.doe@example.com',
  password: 'SecurePass123!'
});

if (result.success) {
  // Store token for API calls
  localStorage.setItem('token', result.token);
}
```

---

##### `authService.signOut()`
Signs out the current user and clears the session.

**Example:**
```typescript
await authService.signOut();
// User is now logged out
```

---

### 2. Database Services (`src/services/database.ts`)

Provides CRUD operations for all data entities with automatic Supabase sync.

#### Machine Service

##### `machineService.getAll()`
Retrieves all machines from the database.

**Returns:** `Promise<Machine[]>`

**Example:**
```typescript
const machines = await machineService.getAll();
console.log(`Found ${machines.length} machines`);
```

---

##### `machineService.getById(id: string)`
Retrieves a specific machine by ID.

**Example:**
```typescript
const machine = await machineService.getById('machine-uuid');
if (machine) {
  console.log('Machine:', machine.machineName);
}
```

---

##### `machineService.create(machine: Omit<Machine, 'id'>)`
Creates a new machine in the database.

**Example:**
```typescript
const newMachine = await machineService.create({
  machineName: 'CNC-004',
  machineType: 'CNC Lathe',
  capacity: '1000x500',
  status: 'active',
  location: 'Shop Floor A',
  efficiency: 95,
  // ... other fields
});
```

---

##### `machineService.update(id: string, updates: Partial<Machine>)`
Updates an existing machine.

**Example:**
```typescript
await machineService.update('machine-uuid', {
  status: 'maintenance',
  efficiency: 0
});
```

---

##### `machineService.delete(id: string)`
Deletes a machine from the database.

**Example:**
```typescript
await machineService.delete('machine-uuid');
```

---

#### Product Service

Similar pattern to Machine Service:
- `productService.getAll()`
- `productService.getById(id)`
- `productService.create(product)`
- `productService.update(id, updates)`
- `productService.delete(id)`

**Example - Create Product:**
```typescript
const product = await productService.create({
  productName: 'Precision Gear',
  partNumber: 'PG-2024-001',
  drawingNumber: 'DWG-PG-001',
  category: 'Mechanical Parts',
  processFlow: [
    {
      id: crypto.randomUUID(),
      machineId: 'machine-uuid',
      cycleTimePerPart: 30,
      sequence: 1,
      stepName: 'Roughing',
      setupTime: 45,
      isOutsourced: false,
      qualityCheckRequired: true,
      toolsRequired: ['End Mill 12mm']
    }
  ],
  // ... other fields
});
```

---

#### Purchase Order Service

- `purchaseOrderService.getAll()`
- `purchaseOrderService.getById(id)`
- `purchaseOrderService.create(po)`
- `purchaseOrderService.update(id, updates)`
- `purchaseOrderService.delete(id)`

**Example - Create Purchase Order:**
```typescript
const po = await purchaseOrderService.create({
  poNumber: 'PO-2024-001',
  poDate: '2024-01-15',
  productId: 'product-uuid',
  quantity: 500,
  deliveryDate: '2024-02-15',
  customerName: 'Acme Corporation',
  customerContact: 'buyer@acme.com',
  status: 'pending',
  priority: 'high',
  estimatedValue: 25000,
  // ... other fields
});
```

---

#### Schedule Item Service

- `scheduleItemService.getAll()`
- `scheduleItemService.getByPoId(poId)`
- `scheduleItemService.create(item)`
- `scheduleItemService.update(id, updates)`
- `scheduleItemService.delete(id)`
- `scheduleItemService.bulkCreate(items)` - **Special method for batch creation**

**Example - Bulk Create Schedule:**
```typescript
const scheduleItems = [
  {
    poId: 'po-uuid',
    productId: 'product-uuid',
    machineId: 'machine-uuid',
    processStep: 1,
    startDate: '2024-01-20T08:00:00',
    endDate: '2024-01-20T16:00:00',
    quantity: 100,
    allocatedTime: 480,
    priority: 'high',
    status: 'scheduled',
    // ... other fields
  },
  // ... more items
];

const created = await scheduleItemService.bulkCreate(scheduleItems);
console.log(`Created ${created.length} schedule items`);
```

---

#### Shift Service

- `shiftService.getAll()`
- `shiftService.create(shift)`
- `shiftService.update(id, updates)`
- `shiftService.delete(id)`

**Example - Create Shift:**
```typescript
const shift = await shiftService.create({
  shiftName: 'Morning Shift',
  timing: {
    startTime: '06:00',
    endTime: '14:00',
    allowFlexibleTiming: false,
    overtimeAllowed: true,
    maxOvertimeHours: 4
  },
  breakTimes: [
    {
      id: crypto.randomUUID(),
      name: 'Morning Break',
      start: '09:00',
      end: '09:15',
      duration: 15,
      type: 'short_break',
      isPaid: true,
      isFlexible: false
    }
  ],
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  isActive: true,
  color: '#3B82F6'
});
```

---

#### Notification Service

- `notificationService.getAll(userId?)`
- `notificationService.create(notification)`
- `notificationService.markAsRead(id)`
- `notificationService.delete(id)`

**Example:**
```typescript
// Create notification
await notificationService.create({
  type: 'warning',
  title: 'Maintenance Due',
  message: 'Machine CNC-004 requires maintenance',
  timestamp: new Date().toISOString(),
  isRead: false,
  actionRequired: true,
  relatedEntity: {
    type: 'machine',
    id: 'machine-uuid'
  }
});

// Mark as read
await notificationService.markAsRead('notification-uuid');
```

---

#### Alert Service

- `alertService.getAll()`
- `alertService.create(alert)`
- `alertService.resolve(id)`
- `alertService.delete(id)`

**Example:**
```typescript
await alertService.create({
  type: 'delivery_risk',
  severity: 'high',
  message: 'PO-2024-001 at risk of missing delivery date',
  suggestedActions: [
    'Add overtime hours',
    'Reschedule lower priority orders',
    'Contact customer for extension'
  ],
  affectedEntities: ['PO-2024-001', 'machine-uuid'],
  timestamp: new Date().toISOString(),
  isResolved: false
});
```

---

#### Holiday Service

- `holidayService.getAll()`
- `holidayService.addHoliday(date, reason?)`
- `holidayService.removeHoliday(date)`

**Example:**
```typescript
// Add holiday
await holidayService.addHoliday('2024-12-25', 'Christmas Day');

// Get all holidays
const holidays = await holidayService.getAll();
// Returns: ['2024-12-25|Christmas Day', '2024-01-01|New Year', ...]

// Remove holiday
await holidayService.removeHoliday('2024-12-25');
```

---

#### User Service

- `userService.getCurrentUser()`
- `userService.updateProfile(userId, updates)`

**Example:**
```typescript
// Get current user
const user = await userService.getCurrentUser();

// Update profile
await userService.updateProfile(user.id, {
  userName: 'John Updated',
  companyName: 'New Company Name',
  department: 'Engineering'
});
```

---

## AppContext Integration

The AppContext provides high-level methods that automatically handle both Supabase and offline mode:

### Data State

All data is available through the context:
```typescript
const {
  machines,
  products,
  purchaseOrders,
  scheduleItems,
  shifts,
  notifications,
  alerts,
  holidays,
  user
} = useApp();
```

### CRUD Operations

#### Add Operations
```typescript
const { addMachine, addProduct, addPurchaseOrder, addShift } = useApp();

await addMachine(newMachine);
await addProduct(newProduct);
await addPurchaseOrder(newPO);
await addShift(newShift);
```

#### Update Operations
```typescript
const { 
  updateMachine, 
  updateProduct, 
  updatePurchaseOrder,
  updateScheduleItem,
  updateShift 
} = useApp();

await updateMachine('id', { status: 'maintenance' });
await updateProduct('id', { priority: 'high' });
await updateScheduleItem('id', { status: 'completed' });
```

#### Delete Operations
```typescript
const { 
  deleteMachine, 
  deleteProduct, 
  deletePurchaseOrder,
  deleteShift 
} = useApp();

await deleteMachine('id');
await deleteProduct('id');
```

#### Notification Operations
```typescript
const { 
  addSystemNotification,
  markNotificationAsRead,
  getUnreadNotificationsCount
} = useApp();

// Add system notification
addSystemNotification('success', 'Task Complete', 'Production finished');

// Mark as read
await markNotificationAsRead('notification-id');

// Get unread count
const unreadCount = getUnreadNotificationsCount();
```

---

## Data Flow

### 1. User Creates a Purchase Order

```typescript
// Component
const handleCreatePO = async () => {
  const newPO = {
    poNumber: 'PO-001',
    productId: selectedProduct.id,
    quantity: 500,
    deliveryDate: '2024-02-15',
    // ... other fields
  };
  
  // This triggers:
  // 1. AppContext.addPurchaseOrder()
  // 2. purchaseOrderService.create() if Supabase is configured
  // 3. Database INSERT operation
  // 4. Local state update
  // 5. Re-render with new data
  await addPurchaseOrder(newPO);
};
```

### 2. Real-time Data Sync

When data changes in Supabase (from another user or device):
- Currently: Manual refresh required
- Future: Can add real-time subscriptions using Supabase Realtime

**Example of real-time subscription (for future implementation):**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('purchase_orders')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'purchase_orders' },
      (payload) => {
        console.log('Change received!', payload);
        // Update local state
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Error Handling

All service methods include built-in error handling:

```typescript
try {
  const machine = await machineService.create(newMachine);
  console.log('Success:', machine);
} catch (error) {
  console.error('Failed to create machine:', error);
  // Error is also shown as a notification in the UI
}
```

AppContext methods automatically show error notifications:
```typescript
// If this fails, user sees "Failed to add machine" notification
await addMachine(newMachine);
```

---

## Offline Mode

The application automatically detects if Supabase is configured:

```typescript
// In services/database.ts
if (!isSupabaseConfigured()) {
  return []; // Return empty array or default data
}

// Proceed with Supabase operations
```

When offline:
- All data is stored in localStorage or Electron storage
- CRUD operations work normally
- No network calls are made
- Perfect for development and testing

---

## Type Safety

All operations are fully type-safe using TypeScript:

```typescript
// Database types auto-generated from schema
import { Database } from '../types/supabase';

// Application types
import { Machine, Product, PurchaseOrder } from '../types';

// Full autocomplete and type checking
const machine: Machine = await machineService.getById('id');
//    ^-- TypeScript knows all Machine properties
```

---

## Performance Considerations

### 1. Batch Operations
Use `bulkCreate` for multiple schedule items:
```typescript
// ✅ Good - Single database transaction
await scheduleItemService.bulkCreate(items);

// ❌ Bad - Multiple database calls
for (const item of items) {
  await scheduleItemService.create(item);
}
```

### 2. Pagination (Future Enhancement)
For large datasets, implement pagination:
```typescript
const machines = await supabase
  .from('machines')
  .select('*')
  .range(0, 49) // First 50 items
  .order('created_at', { ascending: false });
```

### 3. Selective Loading
Load only required fields:
```typescript
const { data } = await supabase
  .from('machines')
  .select('id, machineName, status') // Only these fields
  .eq('status', 'active');
```

---

## Security

### Row Level Security

All tables have RLS enabled. Policies ensure:
- Users can only see their own data
- Admins have elevated permissions
- Operators have read-only access to most data

### API Key Security

- **Never expose service_role key** in frontend
- Only use `anon/public key` in client-side code
- RLS policies provide security even with public key

---

## Best Practices

1. **Always use Context methods** for CRUD operations (not direct service calls)
2. **Handle async operations** properly with await
3. **Check return values** before using data
4. **Use TypeScript** for type safety
5. **Test offline mode** before deploying
6. **Monitor Supabase logs** for errors
7. **Keep schema in sync** with TypeScript types

---

## Migration Checklist

When migrating from localStorage to Supabase:

- [ ] Create Supabase project
- [ ] Run schema SQL script
- [ ] Configure environment variables
- [ ] Test authentication flow
- [ ] Verify all CRUD operations
- [ ] Test permissions for different roles
- [ ] Export/import existing data if needed
- [ ] Test offline mode fallback
- [ ] Update deployment configuration
- [ ] Train users on new features

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **React Context**: https://react.dev/reference/react/useContext

---

## Version History

- **v1.0.0** (2024-01-15): Initial Supabase integration
  - Full CRUD for all entities
  - Authentication with Supabase Auth
  - Row Level Security policies
  - Offline mode support
