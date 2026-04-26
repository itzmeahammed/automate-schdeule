import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  User, Machine, Product, PurchaseOrder, ScheduleItem, 
  Shift, Notification, Alert 
} from '../types';

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

// Helper to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

// Machine Service
export const machineService = {
  async getAll(): Promise<Machine[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getById(id: string): Promise<Machine | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async create(machine: Omit<Machine, 'id'>): Promise<Machine> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('machines')
      .insert([toSnakeCase(machine)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: Partial<Machine>): Promise<Machine> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('machines')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Product Service
export const productService = {
  async getAll(): Promise<Product[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('products')
      .insert([toSnakeCase(product)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('products')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error} = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Purchase Order Service
export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getById(id: string): Promise<PurchaseOrder | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async create(po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([toSnakeCase(po)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Schedule Item Service
export const scheduleItemService = {
  async getAll(): Promise<ScheduleItem[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getByPoId(poId: string): Promise<ScheduleItem[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('po_id', poId)
      .order('process_step', { ascending: true });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('schedule_items')
      .insert([toSnakeCase(item)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('schedule_items')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async bulkCreate(items: Omit<ScheduleItem, 'id'>[]): Promise<ScheduleItem[]> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('schedule_items')
      .insert(items.map(item => toSnakeCase(item)))
      .select();
    
    if (error) throw error;
    return toCamelCase(data || []);
  }
};

// Shift Service
export const shiftService = {
  async getAll(): Promise<Shift[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(shift: Omit<Shift, 'id'>): Promise<Shift> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('shifts')
      .insert([toSnakeCase(shift)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: Partial<Shift>): Promise<Shift> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('shifts')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Notification Service
export const notificationService = {
  async getAll(userId?: string): Promise<Notification[]> {
    if (!isSupabaseConfigured()) return [];
    
    let query = supabase
      .from('notifications')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(notification: Omit<Notification, 'id'>): Promise<Notification> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([toSnakeCase(notification)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async markAsRead(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Alert Service
export const alertService = {
  async getAll(): Promise<Alert[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async create(alert: Omit<Alert, 'id'>): Promise<Alert> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('alerts')
      .insert([toSnakeCase(alert)])
      .select()
      .single();
    
    if (error) throw error;
    return toCamelCase(data);
  },

  async resolve(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('alerts')
      .update({ is_resolved: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Holiday Service
export const holidayService = {
  async getAll(): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];
    
    const { data, error } = await supabase
      .from('holidays')
      .select('date, reason')
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(h => h.reason ? `${h.date}|${h.reason}` : h.date);
  },

  async addHoliday(date: string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('holidays')
      .insert([{ date, reason }]);
    
    if (error) throw error;
  },

  async removeHoliday(date: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('date', date);
    
    if (error) throw error;
  }
};

// User Service
export const userService = {
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      userName: data.name,
      companyName: data.company_name || '',
      companyAddress: data.company_address || '',
      role: data.role as 'admin' | 'manager' | 'operator',
      department: data.department || '',
      contactInfo: {
        email: data.email,
        phone: data.phone || ''
      },
      profileImage: data.profile_image || undefined
    };
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    const dbUpdates: any = {};
    
    if (updates.userName) dbUpdates.name = updates.userName;
    if (updates.companyName) dbUpdates.company_name = updates.companyName;
    if (updates.companyAddress) dbUpdates.company_address = updates.companyAddress;
    if (updates.department) dbUpdates.department = updates.department;
    if (updates.contactInfo?.phone) dbUpdates.phone = updates.contactInfo.phone;
    if (updates.profileImage) dbUpdates.profile_image = updates.profileImage;
    
    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId);
    
    if (error) throw error;
  }
};
