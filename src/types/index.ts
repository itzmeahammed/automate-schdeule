export interface User {
  id: string;
  userName: string;
  companyName: string;
  companyAddress: string;
  companyHolidays?: string[];
  profileImage?: string;
  role: 'admin' | 'manager' | 'operator';
  department: string;
  contactInfo: {
    email: string;
    phone: string;
  };
}

export interface Machine {
  id: string;
  machineName: string;
  machineType: string;
  capacity: string;
  workingHours?: number; // Now optional, calculated from shift timing
  shiftTiming: string;
  status: 'active' | 'idle' | 'maintenance' | 'inactive' | 'breakdown';
  location: string;
  efficiency: number;
  lastMaintenance: string;
  nextMaintenance: string;
  operatorId?: string;
  specifications: {
    power: string;
    dimensions: string;
    weight: string;
  };
  problems: string[];
}

export interface ProcessStep {
  id: string;
  machineId: string;
  cycleTimePerPart: number;
  sequence: number;
  stepName: string;
  setupTime: number;
  isOutsourced: boolean;
  qualityCheckRequired: boolean;
  toolsRequired: string[];
  preferredMachines?: string[]; // NEW: list of preferred machine IDs
  nextProcessDelay?: ProcessDelay; // NEW: delay before next process can start
}

export interface ProcessDelay {
  type: 'immediate' | '1day' | '2day' | 'chain_complete';
  description?: string;
  customHours?: number; // For custom delays
}

export interface Product {
  id: string;
  productName: string;
  partNumber: string;
  drawingNumber: string;
  processFlow: ProcessStep[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  description: string;
  specifications: {
    material: string;
    dimensions: string;
    weight: string;
    tolerance: string;
  };
  qualityStandards: string[];
  estimatedCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  productId: string;
  quantity: number;
  deliveryDate: string;
  remarks: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';
  customerName: string;
  customerContact: string;
  urgencyLevel: 'normal' | 'urgent' | 'critical';
  specialInstructions: string;
  estimatedValue: number;
  actualStartDate?: string;
  actualCompletionDate?: string;
  qualityApproved: boolean;
  priority: 'urgent' | 'high' | 'medium' | 'low'; // Added priority field
}

export interface OvertimeRecord {
  id: string;
  scheduleItemId: string;
  shiftId: string;
  date: string;
  plannedOvertimeHours: number;
  actualOvertimeHours?: number;
  reason: string;
  approvedBy?: string;
  status: 'planned' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  costMultiplier: number;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  poId: string;
  productId: string;
  machineId: string;
  processStep: number;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  quantity: number;
  allocatedTime: number; // in minutes
  efficiency: number;
  qualityScore: number; // Quality score for the schedule item
  progress?: number; // Progress percentage (0-100)
  notes?: string;
  dependencies?: string[]; // IDs of other schedule items this depends on
  actualStartTime?: string;
  actualEndTime?: string;
  pauseTimes?: { start: string; end?: string }[];
  actionHistory?: { action: string; timestamp: string; user: string }[];
  overtimeRecords?: OvertimeRecord[];
  plannedOvertimeHours?: number;
  actualOvertimeHours?: number;
  schedulingMode?: 'auto' | 'manual'; // NEW: scheduling update mode
  manualOverride?: boolean; // NEW: if manually overridden
  lastAutoUpdate?: string; // NEW: timestamp of last auto update
}

export interface BreakTime {
  id: string;
  name: string;
  start: string;
  end: string;
  duration: number;
  type: 'short_break' | 'lunch' | 'tea_break' | 'maintenance' | 'custom';
  isPaid: boolean;
  isFlexible: boolean;
  description?: string;
}

export interface ShiftTiming {
  startTime: string;
  endTime: string;
  coreHoursStart?: string; // Flexible start time range
  coreHoursEnd?: string;   // Flexible end time range
  allowFlexibleTiming: boolean;
  overtimeAllowed: boolean;
  maxOvertimeHours: number;
}

export interface Shift {
  id: string;
  shiftName: string;
  timing: ShiftTiming;
  breakTimes: BreakTime[];
  workingDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  isActive: boolean;
  color: string;
  description?: string;
  // Legacy support for existing shift timing format
  startTime?: string;
  endTime?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
  relatedEntity?: {
    type: 'po' | 'machine' | 'schedule';
    id: string;
  };
  completed?: boolean; // Added for marking notification as completed/closed
}

export interface DashboardMetrics {
  totalOrders: number;
  onTimeOrders: number;
  delayedOrders: number;
  machineUtilization: number;
  pendingOrders: number;
  completedToday: number;
  efficiency: number;
  qualityScore: number;
  revenue: number;
  costs: number;
}

export interface GanttItem {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  resource: string;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Alert {
  id: string;
  type: 'delivery_risk' | 'machine_breakdown' | 'quality_issue' | 'capacity_overload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions: string[];
  affectedEntities: string[];
  timestamp: string;
  isResolved: boolean;
}