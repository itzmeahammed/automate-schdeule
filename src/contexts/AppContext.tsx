import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Machine, Product, PurchaseOrder, ScheduleItem, Shift, Notification, Alert } from '../types';
import { getAutoPOStatus } from '../utils/scheduling';

interface AppContextType {
  signUp: (user: Omit<DemoUser, 'id'>) => { success: boolean; message: string };
  signIn: (email: string, password: string) => { success: boolean; message: string; user?: DemoUser };
  signOut: () => void;
  user: DemoUser | null; // <-- Add this line
  setUser: React.Dispatch<React.SetStateAction<DemoUser | null>>; // <-- Add this
  users: DemoUser[];     // <-- Add this line
  machines: Machine[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  scheduleItems: ScheduleItem[];
  shifts: Shift[];
  notifications: Notification[];
  alerts: Alert[];
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  holidays: string[];
  authToken: string | null;
  setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Setters
  setMachines: (machines: Machine[]) => void;
  setProducts: (products: Product[]) => void;
  setPurchaseOrders: (pos: PurchaseOrder[]) => void;
  setScheduleItems: (items: ScheduleItem[]) => void;
  setShifts: (shifts: Shift[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setHolidays: (holidays: string[]) => void;
  
  // CRUD operations
  addMachine: (machine: Machine) => void;
  addProduct: (product: Product) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  addShift: (shift: Shift) => void;
  addNotification: (notification: Notification) => void;
  addAlert: (alert: Alert) => void;
  
  updateMachine: (id: string, machine: Partial<Machine>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  updatePurchaseOrder: (id: string, po: Partial<PurchaseOrder>) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  updateShift: (id: string, shift: Partial<Shift>) => void;
  
  deleteMachine: (id: string) => void;
  deleteProduct: (id: string) => void;
  deletePurchaseOrder: (id: string) => void;
  deleteShift: (id: string) => void;
  
  // Utility functions
  markNotificationAsRead: (id: string) => void;
  resolveAlert: (id: string) => void;
  getUnreadNotificationsCount: () => number;
  getCriticalAlertsCount: () => number;
  resetToSampleData: () => void; // Expose for demo/testing
  addSystemNotification: (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => void;
  playNotificationSound: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    electronAPI?: {
      getItem: (key: string) => Promise<any>;
      setItem: (key: string, value: any) => Promise<void>;
    };
  }
}

type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  profileImage?: string;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // --- Auth State ---
  const [user, setUser] = useState<DemoUser | null>(null);
  const [users, setUsers] = useState<DemoUser[]>([]);
  
  // Notification sound functionality
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback: create a simple beep sound
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
      });
    } catch (error) {
      console.log('Notification sound not supported');
    }
  };
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Load users and current user from localStorage on mount
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Persist users and current user to localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  // Load token from storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) setAuthToken(storedToken);
  }, []);

  // Save token to storage when it changes
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('authToken', authToken);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [authToken]);

  // Sign up method
  const signUp = (newUser: Omit<DemoUser, 'id'>) => {
    if (users.some(u => u.email === newUser.email)) {
      return { success: false, message: 'Email already registered.' };
    }
    const userObj: DemoUser = {
      ...newUser,
      id: crypto.randomUUID(),
    };
    setUsers([...users, userObj]);
    return { success: true, message: 'Account created! You can now sign in.' };
  };

  // Update signIn to generate token
  const signIn = (email: string, password: string) => {
    const found = users.find(
      (u: any) =>
        u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );
    if (!found) {
      return { success: false, message: 'Invalid email or password.' };
    }
    setUser(found);
    const token = crypto.randomUUID();
    setAuthToken(token);
    return { success: true, message: 'Signed in!', user: found, token };
  };

  // Update signOut to clear token
  const signOut = () => {
    setUser(null);
    setAuthToken(null);
  };

  // --- Existing App State ---
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);
  const [holidays, setHolidays] = useState<string[]>([]);

  // Sample user, machines, products, POs, shifts, notifications, alerts
      const sampleUser: User = {
        id: '1',
        userName: 'Werner Schmidt',
        companyName: 'Advanced Manufacturing Solutions',
        companyAddress: '123 Industrial Park, Manufacturing District, City 12345',
        role: 'admin',
        department: 'Production',
        contactInfo: {
          email: 'werner.schmidt@ams.com',
          phone: '+1-555-0123'
        }
      };
      const sampleMachines: Machine[] = [
        {
          id: '1',
          machineName: 'VMC-001',
          machineType: 'Vertical Machining Center',
          capacity: '500x1000',
          workingHours: 8,
          shiftTiming: '08:00-16:00',
          status: 'active',
          location: 'Bay A-1',
          efficiency: 85,
          lastMaintenance: '2025-01-01',
          nextMaintenance: '2025-02-01',
          specifications: {
            power: '15kW',
            dimensions: '2.5m x 1.8m x 2.2m',
            weight: '3500kg'
          },
          problems: []
        },
        {
          id: '2',
          machineName: 'VTL-002',
          machineType: 'Vertical Turning Lathe',
          capacity: '800x600',
          workingHours: 8,
          shiftTiming: '16:00-00:00',
          status: 'active',
          location: 'Bay B-2',
          efficiency: 92,
          lastMaintenance: '2024-12-15',
          nextMaintenance: '2025-01-15',
          specifications: {
            power: '20kW',
            dimensions: '3.0m x 2.0m x 2.5m',
            weight: '4200kg'
          },
          problems: []
        },
        {
          id: '3',
          machineName: 'Press-003',
          machineType: 'Press Brake',
          capacity: '200T',
          workingHours: 8,
          shiftTiming: '00:00-08:00',
          status: 'maintenance',
          location: 'Bay C-3',
          efficiency: 78,
          lastMaintenance: '2025-01-10',
          nextMaintenance: '2025-01-12',
          specifications: {
            power: '25kW',
            dimensions: '4.0m x 1.5m x 3.0m',
            weight: '5800kg'
          },
          problems: ['Hydraulic pressure low', 'Tool alignment needed']
        }
      ];
      const sampleProducts: Product[] = [
        {
          id: '1',
          productName: 'Value Disc Assembly',
          partNumber: '3GZF28H',
          drawingNumber: 'DWG-001-2025',
          processFlow: [
            {
              id: '1',
              machineId: '1',
              cycleTimePerPart: 20,
              sequence: 1,
              stepName: 'Cutting',
              setupTime: 30,
              isOutsourced: false,
              qualityCheckRequired: true,
              toolsRequired: ['End Mill 10mm', 'Drill 8mm']
            },
            {
              id: '2',
              machineId: '2',
              cycleTimePerPart: 15,
              sequence: 2,
              stepName: 'Turning',
              setupTime: 20,
              isOutsourced: false,
              qualityCheckRequired: true,
              toolsRequired: ['Turning Tool', 'Boring Bar']
            },
            {
              id: '3',
              machineId: '1',
              cycleTimePerPart: 10,
              sequence: 3,
              stepName: 'Drilling',
              setupTime: 15,
              isOutsourced: true,
              qualityCheckRequired: false,
              toolsRequired: ['Drill 6mm', 'Tap M8']
            }
          ],
          priority: 'high',
          category: 'Automotive Parts',
          description: 'High-precision valve disc for automotive applications',
          specifications: {
            material: 'Stainless Steel 316',
            dimensions: '50mm x 25mm x 10mm',
            weight: '0.2kg',
            tolerance: '±0.05mm'
          },
          qualityStandards: ['ISO 9001', 'TS 16949'],
          estimatedCost: 45.50
        },
        {
          id: '2',
          productName: 'Modular Wire Connector',
          partNumber: 'MWC-2025-A',
          drawingNumber: 'DWG-002-2025',
          processFlow: [
            {
              id: '4',
              machineId: '3',
              cycleTimePerPart: 8,
              sequence: 1,
              stepName: 'Forming',
              setupTime: 25,
              isOutsourced: false,
              qualityCheckRequired: true,
              toolsRequired: ['Forming Die', 'Punch Set']
            },
            {
              id: '5',
              machineId: '1',
              cycleTimePerPart: 12,
              sequence: 2,
              stepName: 'Machining',
              setupTime: 20,
              isOutsourced: false,
              qualityCheckRequired: true,
              toolsRequired: ['End Mill 6mm', 'Reamer 8mm']
            }
          ],
          priority: 'medium',
          category: 'Electrical Components',
          description: 'Modular connector for industrial wiring systems',
          specifications: {
            material: 'Brass C360',
            dimensions: '30mm x 15mm x 8mm',
            weight: '0.1kg',
            tolerance: '±0.02mm'
          },
          qualityStandards: ['IEC 60947', 'UL Listed'],
          estimatedCost: 28.75
        }
      ];
      const samplePOs: PurchaseOrder[] = [
        {
          id: '1',
          poNumber: '562311',
          poDate: '2025-01-10',
          productId: '1',
          quantity: 180,
          deliveryDate: '2025-01-25',
          remarks: 'Urgent delivery required for automotive client',
          status: 'in-progress',
          customerName: 'AutoTech Industries',
          customerContact: 'john.doe@autotech.com',
          urgencyLevel: 'urgent',
          specialInstructions: 'Quality inspection required before shipment',
          estimatedValue: 8190,
      qualityApproved: false,
      priority: 'high',
        },
        {
          id: '2',
          poNumber: '562312',
          poDate: '2025-01-11',
          productId: '2',
          quantity: 250,
          deliveryDate: '2025-01-30',
          remarks: 'Standard production run',
          status: 'pending',
          customerName: 'ElectroSystems Corp',
          customerContact: 'sarah.wilson@electro.com',
          urgencyLevel: 'normal',
          specialInstructions: 'Package in anti-static bags',
          estimatedValue: 7187.50,
      qualityApproved: false,
      priority: 'medium',
        }
      ];
      const sampleShifts: Shift[] = [
        {
          id: '1',
          shiftName: '1st Shift',
          startTime: '08:00',
          endTime: '16:00',
          timing: {
            startTime: '08:00',
            endTime: '16:00',
            allowFlexibleTiming: false,
            overtimeAllowed: true,
            maxOvertimeHours: 4
          },
          breakTimes: [
            { id: '1-1', name: 'Morning Break', start: '10:00', end: '10:15', duration: 15, type: 'short_break', isPaid: true, isFlexible: false },
            { id: '1-2', name: 'Lunch Break', start: '12:00', end: '13:00', duration: 60, type: 'lunch', isPaid: true, isFlexible: false },
            { id: '1-3', name: 'Afternoon Break', start: '14:30', end: '14:45', duration: 15, type: 'short_break', isPaid: true, isFlexible: false }
          ],
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          isActive: true,
          color: '#3B82F6'
        },
        {
          id: '2',
          shiftName: '2nd Shift',
          startTime: '16:00',
          endTime: '00:00',
          timing: {
            startTime: '16:00',
            endTime: '00:00',
            allowFlexibleTiming: false,
            overtimeAllowed: true,
            maxOvertimeHours: 4
          },
          breakTimes: [
            { id: '2-1', name: 'Evening Break', start: '18:00', end: '18:15', duration: 15, type: 'short_break', isPaid: true, isFlexible: false },
            { id: '2-2', name: 'Dinner Break', start: '20:00', end: '21:00', duration: 60, type: 'lunch', isPaid: true, isFlexible: false },
            { id: '2-3', name: 'Night Break', start: '22:30', end: '22:45', duration: 15, type: 'short_break', isPaid: true, isFlexible: false }
          ],
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          isActive: true,
          color: '#F59E0B'
        },
        {
          id: '3',
          shiftName: '3rd Shift',
          startTime: '00:00',
          endTime: '08:00',
          timing: {
            startTime: '00:00',
            endTime: '08:00',
            allowFlexibleTiming: false,
            overtimeAllowed: true,
            maxOvertimeHours: 4
          },
          breakTimes: [
            { id: '3-1', name: 'Midnight Break', start: '02:00', end: '02:15', duration: 15, type: 'short_break', isPaid: true, isFlexible: false },
            { id: '3-2', name: 'Late Night Meal', start: '04:00', end: '05:00', duration: 60, type: 'lunch', isPaid: true, isFlexible: false },
            { id: '3-3', name: 'Early Morning Break', start: '06:30', end: '06:45', duration: 15, type: 'short_break', isPaid: true, isFlexible: false }
          ],
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          isActive: false,
          color: '#EF4444'
        }
      ];
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Machine Maintenance Due',
          message: 'Press-003 requires scheduled maintenance within 2 days',
          timestamp: new Date().toISOString(),
          isRead: false,
          actionRequired: true,
          relatedEntity: { type: 'machine', id: '3' }
        },
        {
          id: '2',
          type: 'info',
          title: 'Production Update',
          message: 'PO 562311 is 65% complete and on schedule',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
          actionRequired: false,
          relatedEntity: { type: 'po', id: '1' }
        }
      ];
      const sampleAlerts: Alert[] = [
        {
          id: '1',
          type: 'delivery_risk',
          severity: 'medium',
          message: 'PO 562311 may face delivery delays due to machine maintenance',
          suggestedActions: [
            'Reschedule maintenance to off-hours',
            'Use alternative machine if available',
            'Negotiate delivery date extension'
          ],
          affectedEntities: ['562311', 'Press-003'],
          timestamp: new Date().toISOString(),
          isResolved: false
        }
      ];

  // Helper to add a notification
  const addSystemNotification = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => {
    setNotifications(prev => [
      {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        isRead: false,
        timestamp: new Date().toISOString(),
        actionRequired: false
      },
      ...prev
    ]);
    
    // Play notification sound (always play for system notifications)
    playNotificationSound();
  };

  // Helper to get all Sundays in a year
  const getAllSundays = (year: number): string[] => {
    const sundays: string[] = [];
    const date = new Date(year, 0, 1);
    while (date.getFullYear() === year) {
      if (date.getDay() === 0) {
        sundays.push(date.toISOString().split('T')[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    return sundays;
  };

  useEffect(() => {
    const initializeData = async () => {
      let savedUser, savedMachines, savedProducts, savedPOs, savedSchedule, savedShifts, savedNotifications, savedAlerts, savedTheme, savedHolidays;
      if (window.electronAPI) {
        savedUser = await window.electronAPI.getItem('manufacturing-user');
        savedMachines = await window.electronAPI.getItem('manufacturing-machines');
        savedProducts = await window.electronAPI.getItem('manufacturing-products');
        savedPOs = await window.electronAPI.getItem('manufacturing-purchase-orders');
        savedSchedule = await window.electronAPI.getItem('manufacturing-schedule');
        savedShifts = await window.electronAPI.getItem('manufacturing-shifts');
        savedNotifications = await window.electronAPI.getItem('manufacturing-notifications');
        savedAlerts = await window.electronAPI.getItem('manufacturing-alerts');
        savedTheme = await window.electronAPI.getItem('manufacturing-theme');
        savedHolidays = await window.electronAPI.getItem('manufacturing-holidays');
      } else {
        savedUser = localStorage.getItem('manufacturing-user');
        savedMachines = localStorage.getItem('manufacturing-machines');
        savedProducts = localStorage.getItem('manufacturing-products');
        savedPOs = localStorage.getItem('manufacturing-purchase-orders');
        savedSchedule = localStorage.getItem('manufacturing-schedule');
        savedShifts = localStorage.getItem('manufacturing-shifts');
        savedNotifications = localStorage.getItem('manufacturing-notifications');
        savedAlerts = localStorage.getItem('manufacturing-alerts');
        savedTheme = localStorage.getItem('manufacturing-theme');
        savedHolidays = localStorage.getItem('manufacturing-holidays');
      }
      setUser(savedUser ? JSON.parse(savedUser) : sampleUser);
      setMachines(savedMachines ? JSON.parse(savedMachines) : sampleMachines);
      setProducts(savedProducts ? JSON.parse(savedProducts) : sampleProducts);
      setPurchaseOrders(savedPOs ? JSON.parse(savedPOs) : samplePOs);
      setScheduleItems(savedSchedule ? JSON.parse(savedSchedule) : []);
      setShifts(savedShifts ? JSON.parse(savedShifts) : sampleShifts);
      setNotifications(savedNotifications ? JSON.parse(savedNotifications) : sampleNotifications);
      setAlerts(savedAlerts ? JSON.parse(savedAlerts) : sampleAlerts);
      setTheme(savedTheme ? JSON.parse(savedTheme) : 'light');
      setHolidays(savedHolidays ? Array.from(new Set([...JSON.parse(savedHolidays), ...getAllSundays(new Date().getFullYear())])) : getAllSundays(new Date().getFullYear()));
      setLoading(false);
      didInit.current = true;
    };

    initializeData();
  }, []);

  useEffect(() => {
    purchaseOrders.forEach(po => {
      const dynamicStatus = getAutoPOStatus(po, scheduleItems);
      if (po.status !== dynamicStatus) {
        setPurchaseOrders(prev => prev.map(p =>
          p.id === po.id ? { ...p, status: dynamicStatus } : p
        ));
        // Notifications for PO status changes
        if (dynamicStatus === 'completed') {
          addSystemNotification('success', 'PO Completed', `PO #${po.poNumber} has been completed.`);
        } else if (dynamicStatus === 'delayed') {
          addSystemNotification('warning', 'PO Delayed', `PO #${po.poNumber} is delayed.`);
        } else if (dynamicStatus === 'in-progress') {
          addSystemNotification('info', 'PO In Progress', `PO #${po.poNumber} is now in progress.`);
        } else if (dynamicStatus === 'pending') {
          addSystemNotification('info', 'PO Pending', `PO #${po.poNumber} is pending.`);
        }
      }
    });
  }, [purchaseOrders, scheduleItems]);

  // Watch for force-complete (manual completion of delayed PO)
  useEffect(() => {
    scheduleItems.forEach(item => {
      if (item.status === 'completed' && item.actualEndTime) {
        const po = purchaseOrders.find(po => po.id === item.poId);
        if (po) {
          addSystemNotification('success', 'Schedule Item Completed', `Schedule item for PO #${po.poNumber} was marked as completed.`);
        }
      }
    });
  }, [scheduleItems]);

  // Utility: Reset to sample data (for demo/testing)
  const resetToSampleData = () => {
    setUser({
      id: 'superadmin-1',
      name: 'Super Admin',
      email: 'superAdmin@gmail.com',
      password: '123456',
      role: 'superadmin',
    });
    setMachines(sampleMachines);
    setProducts(sampleProducts);
    setPurchaseOrders(samplePOs);
    setScheduleItems([]);
    setShifts(sampleShifts);
    setNotifications(sampleNotifications);
    setAlerts(sampleAlerts);
    setTheme('light');
    setHolidays(getAllSundays(new Date().getFullYear()));
  };

  // Save to storage whenever state changes, but only after initial load
  useEffect(() => {
    if (!loading && didInit.current) {
      if (user) {
        if (window.electronAPI) {
          window.electronAPI.setItem('manufacturing-user', JSON.stringify(user));
          console.log('[ElectronStorage] Saved user');
        } else {
          localStorage.setItem('manufacturing-user', JSON.stringify(user));
        }
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-machines', JSON.stringify(machines));
        console.log('[ElectronStorage] Saved machines');
      } else {
    localStorage.setItem('manufacturing-machines', JSON.stringify(machines));
      }
    }
  }, [machines, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-products', JSON.stringify(products));
        console.log('[ElectronStorage] Saved products');
      } else {
    localStorage.setItem('manufacturing-products', JSON.stringify(products));
      }
    }
  }, [products, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-purchase-orders', JSON.stringify(purchaseOrders));
        console.log('[ElectronStorage] Saved purchase orders');
      } else {
    localStorage.setItem('manufacturing-purchase-orders', JSON.stringify(purchaseOrders));
      }
    }
  }, [purchaseOrders, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-schedule', JSON.stringify(scheduleItems));
        console.log('[ElectronStorage] Saved schedule');
      } else {
    localStorage.setItem('manufacturing-schedule', JSON.stringify(scheduleItems));
      }
    }
  }, [scheduleItems, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-shifts', JSON.stringify(shifts));
        console.log('[ElectronStorage] Saved shifts');
      } else {
    localStorage.setItem('manufacturing-shifts', JSON.stringify(shifts));
      }
    }
  }, [shifts, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-notifications', JSON.stringify(notifications));
        console.log('[ElectronStorage] Saved notifications');
      } else {
    localStorage.setItem('manufacturing-notifications', JSON.stringify(notifications));
      }
    }
  }, [notifications, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-alerts', JSON.stringify(alerts));
        console.log('[ElectronStorage] Saved alerts');
      } else {
    localStorage.setItem('manufacturing-alerts', JSON.stringify(alerts));
      }
    }
  }, [alerts, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-theme', JSON.stringify(theme));
        console.log('[ElectronStorage] Saved theme');
      } else {
    localStorage.setItem('manufacturing-theme', JSON.stringify(theme));
      }
    }
  }, [theme, loading]);

  useEffect(() => {
    if (!loading && didInit.current) {
      if (window.electronAPI) {
        window.electronAPI.setItem('manufacturing-holidays', JSON.stringify(holidays));
      } else {
        localStorage.setItem('manufacturing-holidays', JSON.stringify(holidays));
      }
    }
  }, [holidays, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // CRUD operations
  const addMachine = (machine: Machine) => {
    setMachines(prev => [...prev, machine]);
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const addPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, po]);
  };

  const addShift = (shift: Shift) => {
    setShifts(prev => [...prev, shift]);
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    setMachines(prev => prev.map(machine => 
      machine.id === id ? { ...machine, ...updates } : machine
    ));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, ...updates } : product
    ));
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(po => 
      po.id === id ? { ...po, ...updates } : po
    ));
  };

  const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
    setScheduleItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const updateShift = (id: string, updates: Partial<Shift>) => {
    setShifts(prev => prev.map(shift => 
      shift.id === id ? { ...shift, ...updates } : shift
    ));
  };

  const deleteMachine = (id: string) => {
    setMachines(prev => prev.filter(machine => machine.id !== id));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  };

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === id ? { ...alert, isResolved: true } : alert
    ));
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const getCriticalAlertsCount = () => {
    return alerts.filter(a => !a.isResolved && (a.severity === 'high' || a.severity === 'critical')).length;
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user, // <-- Add this line
    setUser, // <-- Add this
    users, // <-- Add this line
    machines,
    products,
    purchaseOrders,
    scheduleItems,
    shifts,
    notifications,
    alerts,
    theme,
    sidebarCollapsed,
    setMachines,
    setProducts,
    setPurchaseOrders,
    setScheduleItems,
    setShifts,
    setNotifications,
    setAlerts,
    setTheme,
    setSidebarCollapsed,
    addMachine,
    addProduct,
    addPurchaseOrder,
    addShift,
    addNotification,
    addAlert,
    updateMachine,
    updateProduct,
    updatePurchaseOrder,
    updateScheduleItem,
    updateShift,
    deleteMachine,
    deleteProduct,
    deletePurchaseOrder,
    deleteShift,
    markNotificationAsRead,
    resolveAlert,
    getUnreadNotificationsCount,
    getCriticalAlertsCount,
    resetToSampleData, // Expose for demo/testing
    addSystemNotification,
    playNotificationSound,
    holidays,
    setHolidays,
    authToken,
    setAuthToken,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};