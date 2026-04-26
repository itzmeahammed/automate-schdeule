import { getDb } from '../lib/mongodb';
import { Machine, Product, PurchaseOrder, ScheduleItem, Shift, Notification, Alert } from '../types';

// Strip MongoDB's internal _id field so returned objects match our TypeScript types
const clean = <T>(doc: any): T => {
  if (!doc) return doc;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as T;
};
const cleanAll = <T>(docs: any[]): T[] => docs.map(d => clean<T>(d));

// ─── Machine Service ──────────────────────────────────────────────────────────

export const machineService = {
  async getAll(): Promise<Machine[]> {
    const docs = await getDb().collection('machines').find({});
    return cleanAll<Machine>(docs);
  },
  async getById(id: string): Promise<Machine | null> {
    const doc = await getDb().collection('machines').findOne({ id });
    return doc ? clean<Machine>(doc) : null;
  },
  async create(machine: Machine): Promise<Machine> {
    await getDb().collection('machines').insertOne(machine);
    return machine;
  },
  async update(id: string, updates: Partial<Machine>): Promise<Machine> {
    const db = getDb();
    await db.collection('machines').updateOne({ id }, { $set: updates });
    const doc = await db.collection('machines').findOne({ id });
    if (!doc) throw new Error(`Machine ${id} not found`);
    return clean<Machine>(doc);
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('machines').deleteOne({ id });
  },
};

// ─── Product Service ──────────────────────────────────────────────────────────

export const productService = {
  async getAll(): Promise<Product[]> {
    const docs = await getDb().collection('products').find({});
    return cleanAll<Product>(docs);
  },
  async getById(id: string): Promise<Product | null> {
    const doc = await getDb().collection('products').findOne({ id });
    return doc ? clean<Product>(doc) : null;
  },
  async create(product: Product): Promise<Product> {
    await getDb().collection('products').insertOne(product);
    return product;
  },
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const db = getDb();
    await db.collection('products').updateOne({ id }, { $set: updates });
    const doc = await db.collection('products').findOne({ id });
    if (!doc) throw new Error(`Product ${id} not found`);
    return clean<Product>(doc);
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('products').deleteOne({ id });
  },
};

// ─── Purchase Order Service ───────────────────────────────────────────────────

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    const docs = await getDb().collection('purchase_orders').find({});
    return cleanAll<PurchaseOrder>(docs);
  },
  async getById(id: string): Promise<PurchaseOrder | null> {
    const doc = await getDb().collection('purchase_orders').findOne({ id });
    return doc ? clean<PurchaseOrder>(doc) : null;
  },
  async create(po: PurchaseOrder): Promise<PurchaseOrder> {
    await getDb().collection('purchase_orders').insertOne(po);
    return po;
  },
  async update(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const db = getDb();
    await db.collection('purchase_orders').updateOne({ id }, { $set: updates });
    const doc = await db.collection('purchase_orders').findOne({ id });
    if (!doc) throw new Error(`Purchase order ${id} not found`);
    return clean<PurchaseOrder>(doc);
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('purchase_orders').deleteOne({ id });
  },
};

// ─── Schedule Item Service ────────────────────────────────────────────────────

export const scheduleItemService = {
  async getAll(): Promise<ScheduleItem[]> {
    const docs = await getDb().collection('schedule_items').find({});
    return cleanAll<ScheduleItem>(docs);
  },
  async getByPoId(poId: string): Promise<ScheduleItem[]> {
    const docs = await getDb().collection('schedule_items').find({ poId });
    return cleanAll<ScheduleItem>(docs);
  },
  async create(item: ScheduleItem): Promise<ScheduleItem> {
    await getDb().collection('schedule_items').insertOne(item);
    return item;
  },
  async update(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const db = getDb();
    await db.collection('schedule_items').updateOne({ id }, { $set: updates });
    const doc = await db.collection('schedule_items').findOne({ id });
    if (!doc) throw new Error(`Schedule item ${id} not found`);
    return clean<ScheduleItem>(doc);
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('schedule_items').deleteOne({ id });
  },
  async bulkCreate(items: ScheduleItem[]): Promise<ScheduleItem[]> {
    if (items.length === 0) return [];
    await getDb().collection('schedule_items').insertMany(items);
    return items;
  },
  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await getDb().collection('schedule_items').deleteMany({ id: { $in: ids } });
  },
  async replaceAll(items: ScheduleItem[]): Promise<ScheduleItem[]> {
    const db = getDb();
    await db.collection('schedule_items').deleteMany({});
    if (items.length > 0) await db.collection('schedule_items').insertMany(items);
    return items;
  },
};

// ─── Shift Service ────────────────────────────────────────────────────────────

export const shiftService = {
  async getAll(): Promise<Shift[]> {
    const docs = await getDb().collection('shifts').find({});
    return cleanAll<Shift>(docs);
  },
  async create(shift: Shift): Promise<Shift> {
    await getDb().collection('shifts').insertOne(shift);
    return shift;
  },
  async update(id: string, updates: Partial<Shift>): Promise<Shift> {
    const db = getDb();
    await db.collection('shifts').updateOne({ id }, { $set: updates });
    const doc = await db.collection('shifts').findOne({ id });
    if (!doc) throw new Error(`Shift ${id} not found`);
    return clean<Shift>(doc);
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('shifts').deleteOne({ id });
  },
};

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const docs = await getDb().collection('notifications').find({});
    return cleanAll<Notification>(docs);
  },
  async create(notification: Notification): Promise<Notification> {
    await getDb().collection('notifications').insertOne(notification);
    return notification;
  },
  async markAsRead(id: string): Promise<void> {
    await getDb().collection('notifications').updateOne({ id }, { $set: { isRead: true } });
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('notifications').deleteOne({ id });
  },
};

// ─── Alert Service ────────────────────────────────────────────────────────────

export const alertService = {
  async getAll(): Promise<Alert[]> {
    const docs = await getDb().collection('alerts').find({});
    return cleanAll<Alert>(docs);
  },
  async create(alert: Alert): Promise<Alert> {
    await getDb().collection('alerts').insertOne(alert);
    return alert;
  },
  async resolve(id: string): Promise<void> {
    await getDb().collection('alerts').updateOne({ id }, { $set: { isResolved: true } });
  },
  async delete(id: string): Promise<void> {
    await getDb().collection('alerts').deleteOne({ id });
  },
};

// ─── Holiday Service ──────────────────────────────────────────────────────────
// Holidays are stored as a single document: { key: 'holidays', dates: string[] }

export const holidayService = {
  async getAll(): Promise<string[]> {
    const doc = await getDb().collection('settings').findOne({ key: 'holidays' });
    return (doc?.dates as string[]) || [];
  },
  async saveAll(dates: string[]): Promise<void> {
    await getDb().collection('settings').updateOne(
      { key: 'holidays' },
      { $set: { key: 'holidays', dates } },
      { upsert: true }
    );
  },
};

// ─── User Profile Service ─────────────────────────────────────────────────────

export interface UserProfile {
  realmUserId: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

export const userProfileService = {
  async get(realmUserId: string): Promise<UserProfile | null> {
    const doc = await getDb().collection('userProfiles').findOne({ realmUserId });
    return doc ? clean<UserProfile>(doc) : null;
  },
  async upsert(profile: UserProfile): Promise<UserProfile> {
    await getDb().collection('userProfiles').updateOne(
      { realmUserId: profile.realmUserId },
      { $set: profile },
      { upsert: true }
    );
    return profile;
  },
};
