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
  workingHours: number;
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

export interface ScheduleItem {
  id: string;
  poId: string;
  machineId: string;
  productId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  processStep: number;
  allocatedTime: number;
  operatorId?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed' | 'paused';
  actualStartTime?: string;
  actualEndTime?: string;
  // New fields for enhanced action tracking
  pauseTimes?: { start: string; end?: string }[]; // Array of pause/resume times
  actionHistory?: { action: 'start' | 'pause' | 'resume' | 'complete'; timestamp: string; user?: string }[];
  efficiency: number;
  qualityScore: number;
  notes: string;
}

export interface Shift {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakTimes: {
    start: string;
    end: string;
    duration: number;
    type: 'break' | 'lunch' | 'maintenance';
  }[];
  isActive: boolean;
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