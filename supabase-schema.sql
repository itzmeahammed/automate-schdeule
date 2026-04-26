-- ManufacturingPro Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  profile_image TEXT,
  company_name TEXT,
  company_address TEXT,
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create machines table
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  capacity TEXT NOT NULL,
  working_hours DECIMAL,
  shift_timing TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  location TEXT NOT NULL,
  efficiency DECIMAL NOT NULL DEFAULT 100,
  last_maintenance DATE NOT NULL,
  next_maintenance DATE NOT NULL,
  operator_id UUID REFERENCES public.users(id),
  specifications JSONB DEFAULT '{}'::jsonb,
  problems TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  part_number TEXT NOT NULL UNIQUE,
  drawing_number TEXT NOT NULL,
  process_flow JSONB DEFAULT '[]'::jsonb,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  specifications JSONB DEFAULT '{}'::jsonb,
  quality_standards TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_cost DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT NOT NULL UNIQUE,
  po_date DATE NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  delivery_date DATE NOT NULL,
  remarks TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL,
  urgency_level TEXT NOT NULL DEFAULT 'normal',
  special_instructions TEXT DEFAULT '',
  estimated_value DECIMAL NOT NULL DEFAULT 0,
  actual_start_date DATE,
  actual_completion_date DATE,
  quality_approved BOOLEAN DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule_items table
CREATE TABLE IF NOT EXISTS public.schedule_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  process_step INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT NOT NULL DEFAULT 'medium',
  quantity INTEGER NOT NULL,
  allocated_time DECIMAL NOT NULL,
  efficiency DECIMAL NOT NULL DEFAULT 100,
  quality_score DECIMAL NOT NULL DEFAULT 0,
  progress DECIMAL DEFAULT 0,
  notes TEXT,
  dependencies TEXT[],
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  pause_times JSONB DEFAULT '[]'::jsonb,
  action_history JSONB DEFAULT '[]'::jsonb,
  overtime_records JSONB DEFAULT '[]'::jsonb,
  planned_overtime_hours DECIMAL DEFAULT 0,
  actual_overtime_hours DECIMAL DEFAULT 0,
  scheduling_mode TEXT DEFAULT 'auto',
  manual_override BOOLEAN DEFAULT false,
  last_auto_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_name TEXT NOT NULL,
  timing JSONB NOT NULL,
  break_times JSONB DEFAULT '[]'::jsonb,
  working_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::TEXT[],
  is_active BOOLEAN DEFAULT true,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  action_required BOOLEAN DEFAULT false,
  related_entity JSONB,
  completed BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  suggested_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  affected_entities TEXT[] DEFAULT ARRAY[]::TEXT[],
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_operator ON public.machines(operator_id);
CREATE INDEX IF NOT EXISTS idx_products_part_number ON public.products(part_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_product ON public.purchase_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_po ON public.schedule_items(po_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_machine ON public.schedule_items(machine_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_status ON public.schedule_items(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_shifts_is_active ON public.shifts(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_items_updated_at BEFORE UPDATE ON public.schedule_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for machines (all authenticated users can read, admins can modify)
CREATE POLICY "All authenticated users can view machines" ON public.machines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert machines" ON public.machines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update machines" ON public.machines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can delete machines" ON public.machines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Similar RLS policies for other tables (products, purchase_orders, etc.)
CREATE POLICY "All authenticated users can view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "All authenticated users can view purchase orders" ON public.purchase_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage purchase orders" ON public.purchase_orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view schedule items" ON public.schedule_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage schedule items" ON public.schedule_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view shifts" ON public.shifts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage shifts" ON public.shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "All authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can manage alerts" ON public.alerts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view holidays" ON public.holidays
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage holidays" ON public.holidays
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
