import { Machine, Product, PurchaseOrder, ScheduleItem, Shift, Alert, ProcessDelay } from '../types';

// Enhanced helper function to calculate working hours from shift timing
export const calculateWorkingHoursFromShift = (shiftTiming: string | Shift): number => {
  // Handle legacy string format
  if (typeof shiftTiming === 'string') {
    if (shiftTiming === 'Custom') return 8; // Default for custom shifts
    
    const [start, end] = shiftTiming.split('-');
    if (!start || !end) return 8;
    
    const startTime = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    
    // Handle overnight shifts
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
  }
  
  // Handle new Shift object format
  const timing = shiftTiming.timing || {
    startTime: shiftTiming.startTime || '09:00',
    endTime: shiftTiming.endTime || '17:00',
    allowFlexibleTiming: false,
    overtimeAllowed: false,
    maxOvertimeHours: 0
  };
  
  const startTime = new Date(`2000-01-01T${timing.startTime}:00`);
  const endTime = new Date(`2000-01-01T${timing.endTime}:00`);
  
  // Handle overnight shifts
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  let totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  
  // Subtract break times
  if (shiftTiming.breakTimes) {
    const totalBreakMinutes = shiftTiming.breakTimes
      .filter(breakTime => !breakTime.isPaid) // Only subtract unpaid breaks
      .reduce((total, breakTime) => total + breakTime.duration, 0);
    totalHours -= totalBreakMinutes / 60;
  }
  
  return Math.round(totalHours * 10) / 10;
};

// Calculate delay hours based on ProcessDelay type
export const calculateProcessDelay = (delay: ProcessDelay): number => {
  switch (delay.type) {
    case 'immediate':
      return 0;
    case '1day':
      return 24;
    case '2day':
      return 48;
    case 'chain_complete':
      return 0; // Will be handled by dependency logic
    default:
      return delay.customHours || 0;
  }
};

// Calculate next process start time considering delays
export const calculateNextProcessStartTime = (
  currentProcessEndTime: Date,
  processDelay: ProcessDelay | undefined,
  shifts: Shift[]
): Date => {
  if (!processDelay || processDelay.type === 'immediate') {
    return currentProcessEndTime;
  }

  if (processDelay.type === 'chain_complete') {
    // For chain complete, next process starts immediately after current one
    return currentProcessEndTime;
  }

  const delayHours = calculateProcessDelay(processDelay);
  const nextStartTime = new Date(currentProcessEndTime.getTime() + (delayHours * 60 * 60 * 1000));
  
  // Adjust to next working shift if delay spans non-working hours
  const activeShift = shifts.find(s => s.isActive);
  if (activeShift && activeShift.timing) {
    const dayName = nextStartTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!activeShift.workingDays?.includes(dayName as any)) {
      // Find next working day
      let adjustedDate = new Date(nextStartTime);
      let attempts = 0;
      while (attempts < 7) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        const checkDay = adjustedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (activeShift.workingDays?.includes(checkDay as any)) {
          // Set to shift start time
          const [startHour, startMin] = activeShift.timing.startTime.split(':');
          adjustedDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
          return adjustedDate;
        }
        attempts++;
      }
    }
  }
  
  return nextStartTime;
};

// Check if schedule item should auto-update
export const shouldAutoUpdate = (item: ScheduleItem): boolean => {
  return item.schedulingMode !== 'manual' && !item.manualOverride;
};

// Toggle scheduling mode for an item
export const toggleSchedulingMode = (item: ScheduleItem, mode: 'auto' | 'manual'): ScheduleItem => {
  return {
    ...item,
    schedulingMode: mode,
    manualOverride: mode === 'manual',
    lastAutoUpdate: mode === 'auto' ? new Date().toISOString() : item.lastAutoUpdate
  };
};

// Update schedule item with manual override protection
export const updateScheduleItem = (
  item: ScheduleItem, 
  updates: Partial<ScheduleItem>, 
  forceUpdate: boolean = false
): ScheduleItem => {
  // Don't auto-update if in manual mode unless forced
  if (!forceUpdate && !shouldAutoUpdate(item)) {
    return item;
  }
  
  return {
    ...item,
    ...updates,
    lastAutoUpdate: new Date().toISOString()
  };
};

// Calculate overtime hours for a specific work period
export const calculateOvertimeHours = (actualHours: number, shift: Shift): number => {
  const regularHours = calculateWorkingHoursFromShift(shift);
  const overtime = actualHours - regularHours;
  return overtime > 0 ? Math.round(overtime * 10) / 10 : 0;
};

// Check if overtime is allowed and within limits
export const isOvertimeAllowed = (requestedOvertimeHours: number, shift: Shift): boolean => {
  // Allow overtime if explicitly enabled in shift timing
  if (shift.timing?.overtimeAllowed) {
    const maxOvertime = shift.timing.maxOvertimeHours || 12; // Default max 12 hours if not specified
    return requestedOvertimeHours <= maxOvertime;
  }
  
  // For legacy shifts or when overtime is not explicitly configured,
  // allow reasonable overtime (up to 4 hours) for operational flexibility
  const reasonableOvertimeLimit = 4;
  return requestedOvertimeHours <= reasonableOvertimeLimit && requestedOvertimeHours > 0;
};

// Calculate overtime cost multiplier
export const getOvertimeMultiplier = (overtimeHours: number): number => {
  if (overtimeHours <= 2) return 1.5; // Time and a half for first 2 hours
  return 2.0; // Double time for hours beyond 2
};

// Calculate effective working time considering breaks
export const calculateEffectiveWorkingTime = (shift: Shift, date: Date): number => {
  const timing = shift.timing || {
    startTime: shift.startTime || '09:00',
    endTime: shift.endTime || '17:00',
    allowFlexibleTiming: false,
    overtimeAllowed: false,
    maxOvertimeHours: 0
  };
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;
  if (!shift.workingDays?.includes(dayName)) {
    return 0; // Not a working day for this shift
  }
  
  const baseHours = calculateWorkingHoursFromShift(shift);
  
  // Add potential overtime if allowed
  if (timing.overtimeAllowed) {
    return baseHours + (timing.maxOvertimeHours || 0);
  }
  
  return baseHours;
};

// Calculate total working time including overtime
export const calculateTotalWorkingTime = (shift: Shift, date: Date, overtimeHours: number = 0): number => {
  const baseHours = calculateEffectiveWorkingTime(shift, date);
  if (overtimeHours > 0 && isOvertimeAllowed(overtimeHours, shift)) {
    return baseHours + overtimeHours;
  }
  return baseHours;
};

// Get overtime schedule for a shift
export const getOvertimeSchedule = (shift: Shift, date: Date, overtimeHours: number): { start: Date; end: Date } | null => {
  if (!isOvertimeAllowed(overtimeHours, shift)) return null;
  
  const shiftEnd = getShiftEndTime(date, shift);
  const overtimeEnd = new Date(shiftEnd.getTime() + (overtimeHours * 60 * 60 * 1000));
  
  return {
    start: shiftEnd,
    end: overtimeEnd
  };
};

export const calculateMachineCapacity = (machine: Machine, shifts: Shift[]): number => {
  const activeShifts = shifts.filter(shift => shift.isActive);
  let totalCapacity = 0;

  if (activeShifts.length > 0) {
    activeShifts.forEach(shift => {
      const shiftDuration = calculateShiftDuration(shift);
      const breakTime = shift.breakTimes.reduce((total, breakTime) => total + breakTime.duration, 0);
      const effectiveTime = shiftDuration - breakTime;
      totalCapacity += effectiveTime * (machine.efficiency / 100);
    });
  } else {
    // If no shifts defined, calculate from machine's shift timing
    const workingHours = calculateWorkingHoursFromShift(machine.shiftTiming);
    totalCapacity = workingHours * 60 * (machine.efficiency / 100);
  }

  return totalCapacity;
};

export const calculateShiftDuration = (shift: Shift): number => {
  const timing = shift.timing || {
    startTime: shift.startTime || '09:00',
    endTime: shift.endTime || '17:00',
    allowFlexibleTiming: false,
    overtimeAllowed: false,
    maxOvertimeHours: 0
  };
  
  const start = new Date(`2000-01-01 ${timing.startTime}`);
  let end = new Date(`2000-01-01 ${timing.endTime}`);
  
  // Handle overnight shifts
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  let durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  
  // Subtract break times from total duration
  if (shift.breakTimes) {
    const totalBreakMinutes = shift.breakTimes.reduce((total, breakTime) => {
      return total + breakTime.duration;
    }, 0);
    durationMinutes -= totalBreakMinutes;
  }
  
  return durationMinutes;
};

// Get break times for a specific shift on a given date
export const getShiftBreakTimes = (shift: Shift, date: Date): { start: Date; end: Date; type: string; isPaid: boolean }[] => {
  if (!shift.breakTimes) return [];
  
  return shift.breakTimes.map(breakTime => {
    const breakStart = new Date(date);
    const [startHour, startMinute] = breakTime.start.split(':').map(Number);
    breakStart.setHours(startHour, startMinute, 0, 0);
    
    const breakEnd = new Date(date);
    const [endHour, endMinute] = breakTime.end.split(':').map(Number);
    breakEnd.setHours(endHour, endMinute, 0, 0);
    
    return {
      start: breakStart,
      end: breakEnd,
      type: breakTime.type,
      isPaid: breakTime.isPaid
    };
  });
};

export const calculateProductionTime = (product: Product, quantity: number, machines?: Machine[]): number => {
  // Calculate realistic production time considering machine efficiency and batch processing
  let totalTime = 0;
  
  // Group steps by sequence to handle parallel operations
  const stepsBySequence = new Map<number, typeof product.processFlow>();
  product.processFlow.forEach(step => {
    if (!stepsBySequence.has(step.sequence)) {
      stepsBySequence.set(step.sequence, []);
    }
    stepsBySequence.get(step.sequence)!.push(step);
  });
  
  // Process each sequence level
  Array.from(stepsBySequence.keys()).sort((a, b) => a - b).forEach(sequence => {
    const steps = stepsBySequence.get(sequence)!;
    let sequenceTime = 0;
    
    steps.forEach(step => {
      const machine = machines?.find(m => m.id === step.machineId);
      const efficiency = machine?.efficiency || 100;
      
      const setupTime = step.setupTime || 0;
      // Optimize for realistic manufacturing - setup once, then continuous production
      const cycleTime = step.cycleTimePerPart * quantity;
      
      // Apply machine efficiency and realistic production rates
      const efficiencyFactor = efficiency / 100;
      const adjustedCycleTime = cycleTime / efficiencyFactor;
      
      // For high quantities, apply economies of scale (reduce per-unit time)
      const scaleReduction = quantity > 50 ? 0.85 : quantity > 20 ? 0.9 : 1.0;
      const stepTime = setupTime + (adjustedCycleTime * scaleReduction);
      
      // For parallel steps in same sequence, take maximum time
      sequenceTime = Math.max(sequenceTime, stepTime);
    });
    
    totalTime += sequenceTime;
  });
  
  return totalTime;
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
  const productionTime = calculateProductionTime(product, po.quantity, machines);
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
      // If no active shifts, calculate from machine's shift timing
      const activeShifts = shifts.filter(shift => shift.isActive);
      const dailyCapacity = activeShifts.length > 0 ? calculateMachineCapacity(machine, shifts) : (calculateWorkingHoursFromShift(machine.shiftTiming) * 60);
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
    // Start from the requested delivery date, search forward for the first feasible date
    let testDate = new Date(deliveryDate);
    let found = false;
    let maxTries = 365; // avoid infinite loop
    let suggestedDate = null;
    while (!found && maxTries-- > 0) {
      const workingDays = calculateWorkingDays(poDate, testDate, holidays);
      const totalCapacity = product.processFlow.reduce((total, step) => {
        const machine = machines.find(m => m.id === step.machineId);
        if (machine && (machine.status === 'active' || machine.status === 'idle')) {
          const activeShifts = shifts.filter(shift => shift.isActive);
          const dailyCapacity = activeShifts.length > 0 ? calculateMachineCapacity(machine, shifts) : (calculateWorkingHoursFromShift(machine.shiftTiming) * 60);
          // This calculation is still simplified. A more accurate model would consider sequential dependencies.
          // For now, we assume parallel capacity, which is optimistic.
          return total + (dailyCapacity * workingDays);
        } 
        return total;
      }, 0);
      if (productionTime <= totalCapacity && workingDays > 0) {
        found = true;
        suggestedDate = new Date(testDate);
      } else {
        testDate.setDate(testDate.getDate() + 1);
      }
    }
    if (!suggestedDate) {
      return {
        feasible: false,
        message: 'Unable to calculate a feasible delivery date within a year.',
        confidence: 0,
        alternatives
      };
    }
    return {
      feasible: false,
      suggestedDate: suggestedDate.toISOString().slice(0, 10),
      message: `Not feasible by requested date. Earliest possible: ${suggestedDate.toISOString().slice(0, 10)}`,
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
  if (items.every(item => item.status === 'completed')) return 'completed';
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

  // Machine availability tracking - start from current date
  const machineAvailability: { [machineId: string]: Date } = {};
  const machineAssignments: { [machineId: string]: ScheduleItem[] } = {};
  const currentDate = new Date();
  currentDate.setHours(9, 0, 0, 0); // Start at 9 AM by default
  
  machines.forEach(machine => {
    if (machine.status === 'active') {
      machineAvailability[machine.id] = new Date(currentDate);
      machineAssignments[machine.id] = [];
    }
  });

  sortedPOs.forEach(po => {
    const product = products.find(p => p.id === po.productId);
    if (!product) return;

    let lastStepEndTime = new Date(0); // Initialize for each PO

    product.processFlow
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((step) => {
        const machine = machines.find(m => m.id === step.machineId);
        if (!machine || machine.status !== 'active') return;

        const setupTime = step.setupTime || 0;
        const cycleTime = step.cycleTimePerPart * po.quantity;
        
        // Apply machine efficiency and scale optimization
        const efficiencyFactor = machine.efficiency / 100;
        const adjustedCycleTime = cycleTime / efficiencyFactor;
        const scaleReduction = po.quantity > 50 ? 0.85 : po.quantity > 20 ? 0.9 : 1.0;
        const totalTime = setupTime + (adjustedCycleTime * scaleReduction);

        // The next step can't start before the previous one ends AND the machine is free.
        const earliestPossibleStart = new Date(Math.max(
          (machineAvailability[machine.id] || new Date(0)).getTime(),
          lastStepEndTime.getTime()
        ));

        // Calculate start date considering shift timing and machine availability
        const startDate = calculateShiftBasedStartDate(
          machine,
          earliestPossibleStart,
          shifts,
          holidays
        );

        // Calculate end date based on shift timing
        const endDate = calculateShiftBasedEndDate(
          machine,
          startDate,
          totalTime,
          shifts,
          holidays
        );

        // Update machine availability and the end time for the next step in the sequence
        machineAvailability[machine.id] = new Date(endDate);
        lastStepEndTime = new Date(endDate);

        // Check for conflicts
        const conflictsForMachine = (machineAssignments[step.machineId] || []).filter(item => {
          const itemStart = new Date(item.startDate);
          const itemEnd = new Date(item.endDate);
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
                  priority: po.priority,
                  efficiency: machine.efficiency,
                  qualityScore: 0,
                  progress: 0,
                  notes: step.isOutsourced ? 'Outsourced operation' : ''
                },
                userMessage: '',
                suggestedEndDate: ''
              });
            }
          });
        }
        
        const scheduleItem: ScheduleItem = {
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
          priority: po.priority,
          efficiency: machine.efficiency,
          qualityScore: 0,
          progress: 0,
          notes: step.isOutsourced ? 'Outsourced operation' : ''
        };
        
        schedule.push(scheduleItem);
        machineAssignments[step.machineId].push(scheduleItem);
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
        priority: po.priority,
        efficiency: scheduledItems[0].efficiency,
        qualityScore: 0,
        progress: 0,
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
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;
  
  return shifts.find(shift => {
    // Check if shift is active and includes this day
    if (!shift.isActive) return false;
    if (shift.workingDays && !shift.workingDays.includes(dayName)) return false;
    
    const timing = shift.timing || {
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '17:00',
      allowFlexibleTiming: false,
      overtimeAllowed: false,
      maxOvertimeHours: 0
    };
    
    const startTime = timing.startTime;
    const endTime = timing.endTime;
    
    // Handle flexible timing
    if (timing.allowFlexibleTiming && timing.coreHoursStart && timing.coreHoursEnd) {
      return timeString >= timing.coreHoursStart && timeString <= timing.coreHoursEnd;
    }
    
    if (startTime <= endTime) {
      return timeString >= startTime && timeString < endTime;
    } else {
      // Overnight shift
      return timeString >= startTime || timeString < endTime;
    }
  }) || null;
};

// Check if current time is within a break period
export const isWithinBreakTime = (time: Date, shift: Shift): { inBreak: boolean; breakInfo?: any } => {
  if (!shift.breakTimes) return { inBreak: false };
  
  const timeString = time.toTimeString().substring(0, 5);
  
  for (const breakTime of shift.breakTimes) {
    if (timeString >= breakTime.start && timeString <= breakTime.end) {
      return {
        inBreak: true,
        breakInfo: breakTime
      };
    }
  }
  
  return { inBreak: false };
};

export const getShiftEndTime = (currentTime: Date, shift: Shift): Date => {
  const timing = shift.timing || {
    startTime: shift.startTime || '09:00',
    endTime: shift.endTime || '17:00',
    allowFlexibleTiming: false,
    overtimeAllowed: false,
    maxOvertimeHours: 0
  };
  
  const endTime = new Date(currentTime);
  const [hours, minutes] = timing.endTime.split(':').map(Number);
  endTime.setHours(hours, minutes, 0, 0);
  
  // Handle overnight shifts
  if (timing.startTime > timing.endTime && endTime <= currentTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  // Add overtime if allowed and needed
  if (timing.overtimeAllowed && timing.maxOvertimeHours > 0) {
    // This would be determined by actual scheduling needs
    // For now, just return the regular end time
  }
  
  return endTime;
};

export const calculateShiftBasedEndDate = (
  machine: Machine,
  startDate: Date,
  durationMinutes: number,
  shifts: Shift[],
  holidays: string[]
): Date => {
  const activeShifts = shifts.filter(shift => shift.isActive);
  let remainingDuration = durationMinutes;
  let endDate = new Date(startDate);

  if (activeShifts.length === 0) {
    // If no active shifts, use machine's own shift timing. Assumes work happens within these hours.
    const [start, end] = machine.shiftTiming.split('-').map(t => t.split(':').map(Number));
    const startHour = start[0];
    const endHour = end[0];

    while (remainingDuration > 0) {
        const dayOfWeek = endDate.getDay();
        const dateString = endDate.toISOString().split('T')[0];

        if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateString)) {
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(startHour, 0, 0, 0);
            continue;
        }

        if (endDate.getHours() < startHour) {
            endDate.setHours(startHour, 0, 0, 0);
        }

        if (endDate.getHours() >= endHour) {
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(startHour, 0, 0, 0);
            continue;
        }

        const endOfDay = new Date(endDate);
        endOfDay.setHours(endHour, 0, 0, 0);

        const availableTime = (endOfDay.getTime() - endDate.getTime()) / (1000 * 60);
        const timeToUse = Math.min(remainingDuration, availableTime);

        endDate.setMinutes(endDate.getMinutes() + timeToUse);
        remainingDuration -= timeToUse;
    }
    return endDate;
  }

  while (remainingDuration > 0) {
    const dayOfWeek = endDate.getDay();
    const dateString = endDate.toISOString().split('T')[0];

    if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateString)) {
      endDate.setDate(endDate.getDate() + 1);
      const nextShift = getNextShiftStart(endDate, activeShifts);
      endDate = nextShift;
      continue;
    }

    const currentShift = findCurrentShift(endDate, activeShifts);
    if (!currentShift) {
      const nextShift = getNextShiftStart(endDate, activeShifts);
      endDate = nextShift;
      continue;
    }

    const shiftEnd = getShiftEndTime(endDate, currentShift);
    const availableTimeInShift = (shiftEnd.getTime() - endDate.getTime()) / (1000 * 60);
    const timeToUse = Math.min(remainingDuration, availableTimeInShift);

    endDate.setMinutes(endDate.getMinutes() + timeToUse);
    remainingDuration -= timeToUse;

    if (remainingDuration > 0) {
      const nextShift = getNextShiftStart(endDate, activeShifts);
      endDate = nextShift;
    }
  }

  return endDate;
};

export const getNextShiftStart = (currentTime: Date, shifts: Shift[]): Date => {
  const activeShifts = shifts.filter(shift => shift.isActive);
  
  // Try to find next shift on the same day first
  const currentDayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;
  const todayShifts = activeShifts.filter(shift => 
    shift.workingDays?.includes(currentDayName)
  );
  
  for (const shift of todayShifts) {
    const timing = shift.timing || {
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '17:00',
      allowFlexibleTiming: false,
      overtimeAllowed: false,
      maxOvertimeHours: 0
    };
    
    const [hours, minutes] = timing.startTime.split(':').map(Number);
    const shiftStart = new Date(currentTime);
    shiftStart.setHours(hours, minutes, 0, 0);
    
    if (shiftStart > currentTime) {
      return shiftStart;
    }
  }
  
  // Find next day with shifts
  let nextDay = new Date(currentTime);
  nextDay.setDate(nextDay.getDate() + 1);
  
  for (let i = 0; i < 7; i++) { // Check up to 7 days ahead
    const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;
    const dayShifts = activeShifts.filter(shift => 
      shift.workingDays?.includes(dayName)
    );
    
    if (dayShifts.length > 0) {
      const earliestShift = dayShifts.reduce((earliest, shift) => {
        const timing = shift.timing || {
          startTime: shift.startTime || '09:00',
          endTime: shift.endTime || '17:00',
          allowFlexibleTiming: false,
          overtimeAllowed: false,
          maxOvertimeHours: 0
        };
        
        const [hours, minutes] = timing.startTime.split(':').map(Number);
        const shiftStart = new Date(nextDay);
        shiftStart.setHours(hours, minutes, 0, 0);
        
        return !earliest || shiftStart < earliest ? shiftStart : earliest;
      }, null as Date | null);
      
      if (earliestShift) return earliestShift;
    }
    
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  // Fallback to next day at 9 AM
  const fallback = new Date(currentTime);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
};

// Helper function to calculate start date based on shift timing
export const calculateShiftBasedStartDate = (
  machine: Machine,
  earliestStart: Date,
  shifts: Shift[],
  holidays: string[]
): Date => {
  const activeShifts = shifts.filter(shift => shift.isActive);
  let currentDate = new Date(earliestStart);
  
  // If no shifts defined, use machine's shift timing
  if (activeShifts.length === 0) {
    const [startHour, startMinute] = machine.shiftTiming.split('-')[0].split(':').map(Number);
    currentDate.setHours(startHour, startMinute, 0, 0);
    
    // Skip weekends and holidays
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6 || 
           holidays.includes(currentDate.toISOString().split('T')[0])) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return currentDate;
  }
  
  // Find next available shift start
  while (true) {
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Skip weekends and holidays
    if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateString)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Find applicable shift for current time
    const currentShift = findCurrentShift(currentDate, activeShifts);
    if (currentShift) {
      return currentDate;
    }
    
    // Move to next shift start
    const nextShift = getNextShiftStart(currentDate, activeShifts);
    currentDate = nextShift;
  }
};

export const generateAlerts = (
  purchaseOrders: PurchaseOrder[],
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
      const dailyCapacity = calculateWorkingHoursFromShift(machine.shiftTiming) * 60;
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
    if (machine.status !== 'active') return total;
    return total + (calculateWorkingHoursFromShift(machine.shiftTiming) * 60);
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