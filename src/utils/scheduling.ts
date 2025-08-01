import { Machine, Product, PurchaseOrder, ScheduleItem, Shift, Alert } from '../types';

export const calculateMachineCapacity = (machine: Machine, date: string, shifts: Shift[]): number => {
  const activeShifts = shifts.filter(shift => shift.isActive);
  let totalCapacity = 0;

  activeShifts.forEach(shift => {
    const shiftDuration = calculateShiftDuration(shift);
    const breakTime = shift.breakTimes.reduce((total, breakTime) => total + breakTime.duration, 0);
    const effectiveTime = shiftDuration - breakTime;
    totalCapacity += effectiveTime * (machine.efficiency / 100);
  });

  return totalCapacity;
};

export const calculateShiftDuration = (shift: Shift): number => {
  const start = new Date(`2000-01-01 ${shift.startTime}`);
  let end = new Date(`2000-01-01 ${shift.endTime}`);
  
  // Handle overnight shifts
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  return (end.getTime() - start.getTime()) / (1000 * 60); // Return in minutes
};

export const calculateProductionTime = (product: Product, quantity: number): number => {
  return product.processFlow.reduce((total, step) => {
    const setupTime = step.setupTime || 0;
    const cycleTime = step.cycleTimePerPart * quantity;
    return total + setupTime + cycleTime;
  }, 0);
};

export const calculateEstimatedCost = (product: Product, quantity: number): number => {
  const baseCost = product.estimatedCost * quantity;
  const setupCosts = product.processFlow.reduce((total, step) => {
    return total + (step.setupTime * 2); // $2 per minute setup cost
  }, 0);
  return baseCost + setupCosts;
};

export const checkDeliveryFeasibility = (
  po: PurchaseOrder,
  product: Product,
  machines: Machine[],
  shifts: Shift[],
  holidays: string[],
  existingSchedule: ScheduleItem[] = []
): { feasible: boolean; suggestedDate?: string; message: string; confidence: number; alternatives: string[] } => {
  if (!po.poDate || isNaN(new Date(po.poDate).getTime()) || !po.deliveryDate || isNaN(new Date(po.deliveryDate).getTime())) {
    return {
      feasible: false,
      message: 'Please enter a valid PO Date and Delivery Date.',
      confidence: 0,
      alternatives: []
    };
  }
  const poDate = new Date(po.poDate);
  const deliveryDate = new Date(po.deliveryDate);
  if (deliveryDate <= poDate) {
    return {
      feasible: false,
      message: 'Delivery Date must be after PO Date.',
      confidence: 0,
      alternatives: []
    };
  }
  const productionTime = calculateProductionTime(product, po.quantity);
  const timeDiff = deliveryDate.getTime() - poDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const workingDays = calculateWorkingDays(poDate, deliveryDate, holidays);
  if (workingDays === 0) {
    return {
      feasible: false,
      message: 'No available working days between PO Date and Delivery Date (all are holidays or weekends).',
      confidence: 0,
      alternatives: []
    };
  }
  // Calculate total available machine time considering existing schedule
  let totalAvailableTime = 0;
  const machineUtilization: { [key: string]: number } = {};
  const debugMachines: any[] = [];
  product.processFlow.forEach(step => {
    const machine = machines.find(m => m.id === step.machineId);
    if (machine && (machine.status === 'active' || machine.status === 'idle')) {
      // If no active shifts, treat as available for the whole day (1440 min)
      const activeShifts = shifts.filter(shift => shift.isActive);
      const dailyCapacity = activeShifts.length > 0 ? calculateMachineCapacity(machine, po.poDate, shifts) : 1440;
      const totalCapacity = dailyCapacity * workingDays;
      // Calculate existing utilization
      const existingUtilization = existingSchedule
        .filter(item => item.machineId === machine.id)
        .reduce((total, item) => total + item.allocatedTime, 0);
      const availableTime = Math.max(0, totalCapacity - existingUtilization);
      totalAvailableTime += availableTime;
      machineUtilization[machine.id] = (existingUtilization / totalCapacity) * 100;
      debugMachines.push({
        machineId: machine.id,
        status: machine.status,
        dailyCapacity,
        totalCapacity,
        existingUtilization,
        availableTime
      });
    }
  });
  if (totalAvailableTime === 0) {
    // Debug log
    // eslint-disable-next-line no-console
    console.log('[Feasibility Debug] No available machine time:', debugMachines);
    return {
      feasible: false,
      message: 'No available machine time for the selected period. All machines may be fully booked or inactive.',
      confidence: 0,
      alternatives: []
    };
  }
  const utilizationPercentage = totalAvailableTime > 0 ? (productionTime / totalAvailableTime) * 100 : 100;
  const confidence = Math.max(0, 100 - utilizationPercentage);

  const alternatives: string[] = [];
  
  if (productionTime <= totalAvailableTime) {
    if (utilizationPercentage > 80) {
      alternatives.push('Consider overtime shifts to ensure on-time delivery');
      alternatives.push('Monitor progress closely due to high capacity utilization');
    }
    
    return {
      feasible: true,
      message: `Delivery date is achievable with ${confidence.toFixed(1)}% confidence. Machine utilization: ${utilizationPercentage.toFixed(1)}%`,
      confidence,
      alternatives
    };
  } else {
    const requiredDays = Math.ceil(productionTime / (totalAvailableTime / workingDays));
    const suggestedDate = new Date(poDate);
    suggestedDate.setDate(suggestedDate.getDate() + requiredDays + holidays.length);
    if (isNaN(suggestedDate.getTime())) {
      return {
        feasible: false,
        message: 'Delivery date not feasible and could not calculate a suggested date due to invalid input.',
        confidence: 0,
        alternatives
      };
    }
    alternatives.push('Add overtime shifts or weekend work');
    alternatives.push('Outsource some operations to external vendors');
    alternatives.push('Negotiate with customer for extended delivery date');
    alternatives.push('Prioritize this order over lower priority orders');
    return {
      feasible: false,
      suggestedDate: suggestedDate.toISOString().split('T')[0],
      message: `Delivery date not feasible. Required capacity: ${productionTime.toFixed(0)} min, Available: ${totalAvailableTime.toFixed(0)} min. Suggested date: ${suggestedDate.toDateString()}`,
      confidence: 0,
      alternatives
    };
  }
};

export const calculateWorkingDays = (startDate: Date, endDate: Date, holidays: string[]): number => {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Skip weekends (Saturday = 6, Sunday = 0) and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateString)) {
      workingDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

export function getAutoStatus(item: ScheduleItem): ScheduleItem['status'] {
  const now = new Date();
  const start = new Date(item.actualStartTime || item.startDate);
  const end = new Date(item.actualEndTime || item.endDate);
  if (item.status === 'completed' && item.actualEndTime) return 'completed';
  if (now < start) return 'scheduled';
  if (now >= start && now <= end) return 'in-progress';
  if (now > end) return 'delayed';
  return 'scheduled';
}

/**
 * Returns the progress percentage (0-100) for a given PurchaseOrder based on its related ScheduleItems.
 * Progress is the percentage of completed schedule items for that PO out of total schedule items for that PO.
 * If there are no schedule items, returns 0.
 */
export function getPOProgress(poId: string, scheduleItems: ScheduleItem[]): number {
  const items = scheduleItems.filter(item => item.poId === poId);
  if (items.length === 0) return 0;
  const completed = items.filter(item => item.status === 'completed').length;
  return Math.round((completed / items.length) * 100);
}

/**
 * Returns the time-based progress percentage (0-100) for a given PurchaseOrder based on its related ScheduleItems.
 * Progress is the percentage of time elapsed from earliest start to latest end among all schedule items for that PO.
 * If there are no schedule items, returns 0.
 */
export function getPOTimeProgress(poId: string, scheduleItems: ScheduleItem[]): number {
  const items = scheduleItems.filter(item => item.poId === poId);
  if (items.length === 0) return 0;
  // Use actualStartTime/actualEndTime if present, else startDate/endDate
  const starts = items.map(item => new Date(item.actualStartTime || item.startDate).getTime());
  const ends = items.map(item => new Date(item.actualEndTime || item.endDate).getTime());
  const minStart = Math.min(...starts);
  const maxEnd = Math.max(...ends);
  const now = Date.now();
  if (now <= minStart) return 0;
  if (now >= maxEnd) return 100;
  return Math.round(((now - minStart) / (maxEnd - minStart)) * 100);
}

/**
 * Returns the automatic status for a PurchaseOrder based on its related ScheduleItems.
 * - If all items are completed: 'completed'
 * - If any item is delayed: 'delayed'
 * - If any item is in-progress: 'in-progress'
 * - If any item is scheduled: 'scheduled'
 * - Otherwise: 'pending'
 */
export function getAutoPOStatus(po: PurchaseOrder, scheduleItems: ScheduleItem[]): PurchaseOrder['status'] {
  const items = scheduleItems.filter(item => item.poId === po.id);
  if (items.length === 0) return po.status; // fallback to current status
  if (items.every(item => item.status === 'completed' && item.actualEndTime)) return 'completed';
  if (items.some(item => getAutoStatus(item) === 'delayed')) return 'delayed';
  if (items.some(item => getAutoStatus(item) === 'in-progress')) return 'in-progress';
  return 'pending';
}

export interface ScheduleConflict {
  machineId: string;
  conflictingPO: PurchaseOrder;
  newPO: PurchaseOrder;
  conflictingScheduleItem: ScheduleItem;
  newScheduleItem: Omit<ScheduleItem, 'id'>;
  userMessage: string; // Added for UI
  suggestedEndDate: string; // Added for UI
}

export const generateScheduleWithConflicts = (
  purchaseOrders: PurchaseOrder[],
  products: Product[],
  machines: Machine[],
  shifts: Shift[],
  holidays: string[]
): { schedule: ScheduleItem[]; conflicts: ScheduleConflict[] } => {
  const schedule: ScheduleItem[] = [];
  const conflicts: ScheduleConflict[] = [];
  // Priority: urgent > high > medium > low
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  // Sort POs by priority and delivery date
  const sortedPOs = [...purchaseOrders]
    .filter(po => po.status !== 'completed' && po.status !== 'cancelled')
    .sort((a, b) => {
      // Priority: urgent > high > medium > low
      const prioDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (prioDiff !== 0) return prioDiff;
      // Then by delivery date
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
    });

  // Machine availability tracking
  const machineAvailability: { [machineId: string]: Date } = {};
  const machineAssignments: { [machineId: string]: ScheduleItem[] } = {};
  machines.forEach(machine => {
    if (machine.status === 'active') {
      machineAvailability[machine.id] = new Date();
      machineAssignments[machine.id] = [];
    }
  });

  sortedPOs.forEach(po => {
    const product = products.find(p => p.id === po.productId);
    if (!product) return;
    let currentStartTime = new Date();
    product.processFlow
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((step, index) => {
        const machine = machines.find(m => m.id === step.machineId);
        if (!machine || machine.status !== 'active') return;
        const setupTime = step.setupTime || 0;
        const cycleTime = step.cycleTimePerPart * po.quantity;
        const totalTime = setupTime + cycleTime;
        // Ensure strict sequential processing: next step starts after previous ends
        const prevStepEnd = currentStartTime;
        const startDate = findNextAvailableSlot(
          prevStepEnd,
          totalTime,
          shifts,
          holidays
        );
        const endDate = new Date(startDate.getTime() + totalTime * 60000);
        // Update currentStartTime for next step
        currentStartTime = new Date(endDate);
        // Check for conflicts: is this machine already assigned to a lower-priority PO in this time window?
        const conflictsForMachine = (machineAssignments[step.machineId] || []).filter(item => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
          // Overlap check
          return (
            (startDate < itemEnd && endDate > itemStart) &&
            priorityOrder[po.priority] > priorityOrder[purchaseOrders.find(p => p.id === item.poId)?.priority || 'low']
          );
        });
        if (conflictsForMachine.length > 0) {
          conflictsForMachine.forEach(conflictingItem => {
            const conflictingPO = purchaseOrders.find(p => p.id === conflictingItem.poId);
            if (conflictingPO) {
              conflicts.push({
                machineId: step.machineId,
                conflictingPO,
                newPO: po,
                conflictingScheduleItem: conflictingItem,
                newScheduleItem: {
                  poId: po.id,
                  machineId: step.machineId,
                  productId: po.productId,
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  quantity: po.quantity,
                  processStep: step.sequence,
                  allocatedTime: totalTime,
                  status: 'scheduled',
                  efficiency: machine.efficiency,
                  qualityScore: 0,
                  notes: step.isOutsourced ? 'Outsourced operation' : ''
                },
                userMessage: '', // Initialize
                suggestedEndDate: '' // Initialize
              });
            }
          });
        }
        const baseScheduleItem: ScheduleItem = {
          id: `${po.id}-${step.machineId}-${step.sequence}`,
          poId: po.id,
          machineId: step.machineId,
          productId: po.productId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          quantity: po.quantity,
          processStep: step.sequence,
          allocatedTime: totalTime,
          status: 'scheduled',
          efficiency: machine.efficiency,
          qualityScore: 0,
          notes: step.isOutsourced ? 'Outsourced operation' : ''
        };
        const scheduleItem = {
          ...baseScheduleItem,
          status: getAutoStatus(baseScheduleItem)
        };
        schedule.push(scheduleItem);
        machineAssignments[step.machineId].push(scheduleItem);
        machineAvailability[step.machineId] = endDate;
        // currentStartTime = endDate; // This line is removed as per the new_code
      });
  });

  // === FEASIBILITY CONFLICT CHECK (Refactored) ===
  purchaseOrders.forEach(po => {
    if (po.status === 'completed' || po.status === 'cancelled') return;
    const scheduledItems = schedule.filter(item => item.poId === po.id);
    if (scheduledItems.length === 0) return;
    const scheduledEndDate = new Date(Math.max(...scheduledItems.map(item => new Date(item.endDate).getTime())));
    const deliveryDate = new Date(po.deliveryDate);
    const qtyByDelivery = scheduledItems
      .filter(item => new Date(item.endDate) <= deliveryDate)
      .reduce((sum, item) => sum + item.quantity, 0);

    let userMessage = '';
    if (qtyByDelivery < po.quantity) {
      userMessage = `PO ${po.poNumber} cannot be completed by the requested delivery date (${po.deliveryDate}). Only ${qtyByDelivery} out of ${po.quantity} units will be ready.`;
    } else if (scheduledEndDate > deliveryDate) {
      userMessage = `PO ${po.poNumber} is scheduled to complete after the requested delivery date (${po.deliveryDate}). Please adjust the end date or reschedule lower-priority orders.`;
    } else {
      return; // No conflict
    }

    conflicts.push({
      machineId: scheduledItems[0].machineId,
      conflictingPO: po,
      newPO: po,
      conflictingScheduleItem: scheduledItems[scheduledItems.length - 1],
      newScheduleItem: {
        poId: po.id,
        machineId: scheduledItems[0].machineId,
        productId: po.productId,
        startDate: scheduledItems[0].startDate,
        endDate: scheduledItems[scheduledItems.length - 1].endDate,
        quantity: qtyByDelivery,
        processStep: scheduledItems[scheduledItems.length - 1].processStep,
        allocatedTime: scheduledItems.reduce((sum, item) => sum + item.allocatedTime, 0),
        status: 'scheduled',
        efficiency: scheduledItems[0].efficiency,
        qualityScore: 0,
        notes: userMessage
      },
      userMessage, // for UI
      suggestedEndDate: scheduledItems[scheduledItems.length - 1].endDate // for UI
    });
  });

  return { schedule, conflicts };
};

export const findNextAvailableSlot = (
  startTime: Date,
  durationMinutes: number,
  shifts: Shift[],
  holidays: string[]
): Date => {
  const activeShifts = shifts.filter(shift => shift.isActive);
  if (activeShifts.length === 0) return startTime;

  let currentTime = new Date(startTime);
  let remainingDuration = durationMinutes;

  while (remainingDuration > 0) {
    const dateString = currentTime.toISOString().split('T')[0];
    const dayOfWeek = currentTime.getDay();

    // Skip weekends and holidays
    if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateString)) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(0, 0, 0, 0);
      continue;
    }

    // Find applicable shift for current time
    const currentShift = findCurrentShift(currentTime, activeShifts);
    if (!currentShift) {
      // Move to next shift start
      const nextShift = getNextShiftStart(currentTime, activeShifts);
      currentTime = nextShift;
      continue;
    }

    // Calculate available time in current shift
    const shiftEnd = getShiftEndTime(currentTime, currentShift);
    const availableTime = Math.min(
      remainingDuration,
      (shiftEnd.getTime() - currentTime.getTime()) / (1000 * 60)
    );

    remainingDuration -= availableTime;
    
    if (remainingDuration > 0) {
      // Move to next shift
      const nextShift = getNextShiftStart(shiftEnd, activeShifts);
      currentTime = nextShift;
    }
  }

  return new Date(startTime);
};

export const findCurrentShift = (time: Date, shifts: Shift[]): Shift | null => {
  const timeString = time.toTimeString().substring(0, 5);
  
  return shifts.find(shift => {
    const startTime = shift.startTime;
    const endTime = shift.endTime;
    
    if (startTime <= endTime) {
      return timeString >= startTime && timeString < endTime;
    } else {
      // Overnight shift
      return timeString >= startTime || timeString < endTime;
    }
  }) || null;
};

export const getShiftEndTime = (currentTime: Date, shift: Shift): Date => {
  const endTime = new Date(currentTime);
  const [hours, minutes] = shift.endTime.split(':').map(Number);
  endTime.setHours(hours, minutes, 0, 0);
  
  // Handle overnight shifts
  if (shift.startTime > shift.endTime && endTime <= currentTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  return endTime;
};

export const getNextShiftStart = (currentTime: Date, shifts: Shift[]): Date => {
  const nextDay = new Date(currentTime);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const earliestShift = shifts.reduce((earliest, shift) => {
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    const shiftStart = new Date(nextDay);
    shiftStart.setHours(hours, minutes, 0, 0);
    
    return !earliest || shiftStart < earliest ? shiftStart : earliest;
  }, null as Date | null);
  
  return earliestShift || nextDay;
};

export const generateAlerts = (
  purchaseOrders: PurchaseOrder[],
  products: Product[],
  machines: Machine[],
  scheduleItems: ScheduleItem[]
): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();

  // Check for delivery risks
  purchaseOrders.forEach(po => {
    const deliveryDate = new Date(po.deliveryDate);
    const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilDelivery <= 3 && po.status !== 'completed') {
      alerts.push({
        id: `delivery-risk-${po.id}`,
        type: 'delivery_risk',
        severity: daysUntilDelivery <= 1 ? 'critical' : 'high',
        message: `PO ${po.poNumber} delivery risk: ${daysUntilDelivery} days remaining`,
        suggestedActions: [
          'Expedite production',
          'Add overtime shifts',
          'Contact customer about potential delay'
        ],
        affectedEntities: [po.id],
        timestamp: now.toISOString(),
        isResolved: false
      });
    }
  });

  // Check for machine maintenance
  machines.forEach(machine => {
    const nextMaintenance = new Date(machine.nextMaintenance);
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilMaintenance <= 7) {
      alerts.push({
        id: `maintenance-${machine.id}`,
        type: 'machine_breakdown',
        severity: daysUntilMaintenance <= 2 ? 'high' : 'medium',
        message: `${machine.machineName} maintenance due in ${daysUntilMaintenance} days`,
        suggestedActions: [
          'Schedule maintenance during off-hours',
          'Prepare backup machine if available',
          'Adjust production schedule'
        ],
        affectedEntities: [machine.id],
        timestamp: now.toISOString(),
        isResolved: false
      });
    }
  });

  // Check for capacity overload
  const machineUtilization: { [key: string]: number } = {};
  scheduleItems.forEach(item => {
    if (!machineUtilization[item.machineId]) {
      machineUtilization[item.machineId] = 0;
    }
    machineUtilization[item.machineId] += item.allocatedTime;
  });

  Object.entries(machineUtilization).forEach(([machineId, utilization]) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      const dailyCapacity = machine.workingHours * 60;
      const utilizationPercentage = (utilization / (dailyCapacity * 7)) * 100; // Weekly utilization
      
      if (utilizationPercentage > 90) {
        alerts.push({
          id: `capacity-${machineId}`,
          type: 'capacity_overload',
          severity: utilizationPercentage > 100 ? 'critical' : 'high',
          message: `${machine.machineName} capacity overload: ${utilizationPercentage.toFixed(1)}%`,
          suggestedActions: [
            'Add overtime shifts',
            'Redistribute work to other machines',
            'Consider outsourcing some operations'
          ],
          affectedEntities: [machineId],
          timestamp: now.toISOString(),
          isResolved: false
        });
      }
    }
  });

  return alerts;
};

export const getDashboardMetrics = (
  purchaseOrders: PurchaseOrder[] = [],
  scheduleItems: ScheduleItem[] = [],
  machines: Machine[] = []
): {
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
} => {
  
  const totalOrders = purchaseOrders.length;
  const onTimeOrders = purchaseOrders.filter(po => po.status === 'completed' && !isDelayed(po)).length;
  const delayedOrders = purchaseOrders.filter(po => po.status === 'delayed' || isDelayed(po)).length;
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending').length;
  
  const today = new Date().toISOString().split('T')[0];
  const completedToday = scheduleItems.filter(item => 
    item.status === 'completed' && 
    item.actualEndTime?.startsWith(today)
  ).length;

  // Calculate machine utilization
  const totalCapacity = machines.reduce((total, machine) => {
    return total + (machine.workingHours * 60 * (machine.status === 'active' ? 1 : 0));
  }, 0);

  const totalUtilized = scheduleItems.reduce((total, item) => {
    return total + item.allocatedTime;
  }, 0);

  const machineUtilization = totalCapacity > 0 ? (totalUtilized / totalCapacity) * 100 : 0;

  // Calculate efficiency and quality
  const completedItems = scheduleItems.filter(item => item.status === 'completed');
  const efficiency = completedItems.length > 0 
    ? completedItems.reduce((sum, item) => sum + item.efficiency, 0) / completedItems.length 
    : 0;

  const qualityScore = completedItems.length > 0
    ? completedItems.reduce((sum, item) => sum + item.qualityScore, 0) / completedItems.length
    : 0;

  // Calculate revenue and costs (simplified)
  const revenue = purchaseOrders
    .filter(po => po.status === 'completed')
    .reduce((sum, po) => sum + po.estimatedValue, 0);

  const costs = revenue * 0.7; // Simplified cost calculation

  return {
    totalOrders,
    onTimeOrders,
    delayedOrders,
    machineUtilization: Math.min(100, machineUtilization),
    pendingOrders,
    completedToday,
    efficiency,
    qualityScore,
    revenue,
    costs
  };
};

const isDelayed = (po: PurchaseOrder): boolean => {
  const deliveryDate = new Date(po.deliveryDate);
  
  const now = new Date();
  const delayed = po.status !== 'completed' && deliveryDate < now;
  if (delayed) {
    // Debug log for delayed PO
    // eslint-disable-next-line no-console
    console.log('[isDelayed]', {
      poNumber: po.poNumber,
      status: po.status,
      deliveryDate: po.deliveryDate,
      now: now.toISOString(),
    });
  }
  return delayed;
};

export const optimizeSchedule = (
  scheduleItems: ScheduleItem[],
  machines: Machine[],
  products: Product[]
): ScheduleItem[] => {
  // Advanced scheduling optimization using genetic algorithm concepts
  // This is a simplified version - in production, you'd use more sophisticated algorithms
  
  const optimized = [...scheduleItems];
  
  // Sort by priority and delivery date
  optimized.sort((a, b) => {
    const productA = products.find(p => p.id === a.productId);
    const productB = products.find(p => p.id === b.productId);
    
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[productB?.priority || 'low'] || 0) - (priorityOrder[productA?.priority || 'low'] || 0);
    
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  // Minimize setup times by grouping similar operations
  const machineGroups: { [machineId: string]: ScheduleItem[] } = {};
  optimized.forEach(item => {
    if (!machineGroups[item.machineId]) {
      machineGroups[item.machineId] = [];
    }
    machineGroups[item.machineId].push(item);
  });

  // Optimize each machine's schedule
  Object.values(machineGroups).forEach(items => {
    items.sort((a, b) => {
      const productA = products.find(p => p.id === a.productId);
      const productB = products.find(p => p.id === b.productId);
      
      // Group by product type to minimize setup changes
      if (productA?.category !== productB?.category) {
        return (productA?.category || '').localeCompare(productB?.category || '');
      }
      
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  });

  return optimized;
};

/**
 * Calculates the efficiency of a machine based on its schedule items.
 * Efficiency = (Total Planned Time for completed items) / (Total Actual Time for completed items) * 100
 * If no completed items or no actual times, returns null.
 * Optionally filter by period (startDate, endDate).
 */
export function calculateMachineEfficiency(
  machineId: string,
  scheduleItems: ScheduleItem[],
  period?: { startDate?: Date; endDate?: Date }
): number | null {
  let items = scheduleItems.filter(item => item.machineId === machineId && item.status === 'completed');
  if (period?.startDate) {
    items = items.filter(item => new Date(item.actualEndTime || item.endDate) >= period.startDate!);
  }
  if (period?.endDate) {
    items = items.filter(item => new Date(item.actualStartTime || item.startDate) <= period.endDate!);
  }
  if (items.length === 0) return null;
  const planned = items.reduce((sum, item) => sum + item.allocatedTime, 0);
  const actual = items.reduce((sum, item) => {
    const start = new Date(item.actualStartTime || item.startDate).getTime();
    const end = new Date(item.actualEndTime || item.endDate).getTime();
    return sum + Math.max(0, (end - start) / 60000); // in minutes
  }, 0);
  if (actual === 0) return null;
  return Math.round((planned / actual) * 100);
}