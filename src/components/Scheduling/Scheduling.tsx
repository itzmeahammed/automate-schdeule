import React, { useState, useEffect, useReducer } from 'react';
import { useApp } from '../../contexts/AppContext';
import { generateScheduleWithConflicts, getAutoStatus, ScheduleConflict, checkDeliveryFeasibility, isOvertimeAllowed, getOvertimeMultiplier, calculateProcessDelay, calculateNextProcessStartTime, toggleSchedulingMode } from '../../utils/scheduling';
import GanttChart from './GanttChart';
import { ScheduleItem, PurchaseOrder as SalesOrder, OvertimeRecord, ProcessDelay } from '../../types';
import { 
  Calendar, 
  Clock, 
  Play, 
  X,
  RefreshCw,
  Info,
  Target,
  Zap,
  Download,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';

// 1. Add utility for DD/MM/YYYY
function formatDMY(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB');
}

// Add utility for DD/MM/YYYY HH:mm
function formatDMYHM(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const Scheduling: React.FC = () => {
  const { 
    purchaseOrders, 
    products, 
    machines, 
    user, 
    scheduleItems, 
    setScheduleItems,
    shifts,
    updatePurchaseOrder, // <-- add this
    holidays
  } = useApp();
  
  const [filter, setFilter] = useState({
    dateRange: 'week',
    machineId: '',
    productId: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  
  const [filteredSchedule, setFilteredSchedule] = useState(scheduleItems);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeReason, setOvertimeReason] = useState('');
  const [showProcessDelayModal, setShowProcessDelayModal] = useState(false);
  const [selectedProcessStep, setSelectedProcessStep] = useState<any>(null);
  const [processDelay, setProcessDelay] = useState<ProcessDelay>({ type: 'immediate' });
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [editedEndDates, setEditedEndDates] = useState<{ [poId: string]: string }>({});
  const [conflictSearch, setConflictSearch] = useState('');
  // Add state for delayed PO popup
  const [showDelayedPopup, setShowDelayedPopup] = useState<{poId: string, open: boolean}>({poId: '', open: false});
  const [detailsFilter, setDetailsFilter] = useState({ productId: '', machineId: '' });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedItemForStatus, setSelectedItemForStatus] = useState<ScheduleItem | null>(null);
  const [notes, setNotes] = useState("");
  const [refreshKey, forceRefresh] = useReducer(x => x + 1, 0);

  useEffect(() => {
    if (selectedItem) setNotes(selectedItem.notes || "");
  }, [selectedItem]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let filtered = scheduleItems;

    if (filter.machineId) {
      filtered = filtered.filter(item => item.machineId === filter.machineId);
    }

    if (filter.productId) {
      filtered = filtered.filter(item => item.productId === filter.productId);
    }

    if (filter.status) {
      filtered = filtered.filter(item => item.status === filter.status);
    }

    if (filter.startDate && filter.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.startDate);
        return itemDate >= new Date(filter.startDate) && itemDate <= new Date(filter.endDate);
      });
    }

    setFilteredSchedule(filtered);
  }, [scheduleItems, filter]);

  useEffect(() => {
    const handler = (e: any) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  const generateProductionSchedule = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { schedule: newSchedule, conflicts } = generateScheduleWithConflicts(
        purchaseOrders,
        products,
        machines,
        shifts,
        holidays
      );
      // Preserve progress and status for in-progress/completed items
      const mergedSchedule = newSchedule.map(newItem => {
        const prevItem = scheduleItems.find(
          item => item.id === newItem.id
        );
        if (prevItem && (prevItem.status === 'in-progress' || prevItem.status === 'completed')) {
          return {
            ...newItem,
            status: prevItem.status,
            startDate: prevItem.startDate,
            endDate: prevItem.endDate,
            actualStartTime: prevItem.actualStartTime,
            actualEndTime: prevItem.actualEndTime
          };
        }
        return newItem;
      });
      if (conflicts.length > 0) {
        setConflicts(conflicts);
        setShowConflictModal(true);
      } else {
        setScheduleItems(mergedSchedule);
      }
    } finally {
      setIsGenerating(false);
    }
  };


  const exportSchedule = async (format: 'excel' | 'word' | 'pdf') => {
    // Export each schedule item (process step) as a separate row
    const data = filteredSchedule.map(item => {
      const product = products.find(p => p.id === item.productId);
      const machine = machines.find(m => m.id === item.machineId);
      const po = purchaseOrders.find(p => p.id === item.poId);
      
      return {
        'SO Number': po?.poNumber || 'N/A',
        'Product': product?.productName || 'Unknown',
        'Part Number': product?.partNumber || 'N/A',
        'Process Step': item.processStep.toString(),
        'Machine': machine?.machineName || 'Unknown',
        'Machine Type': machine?.machineType || 'N/A',
        'Start Date': formatDMYHM(item.actualStartTime || item.startDate),
        'End Date': formatDMYHM(item.actualEndTime || item.endDate),
        'Quantity': item.quantity,
        'Allocated Time (min)': item.allocatedTime.toString(),
        'Status': getAutoStatus(item),
        'Efficiency (%)': item.efficiency,
        'Quality Score': item.qualityScore,
        'Notes': item.notes || ''
      };
    });
    
          // Handle empty data case
      if (data.length === 0) {
        const emptyData = [{
          'SO Number': 'No Data',
          'Product': 'No Data',
          'Part Number': 'No Data',
          'Process Step': 'No Data',
          'Machine': 'No Data',
          'Machine Type': 'No Data',
          'Start Date': 'No Data',
          'End Date': 'No Data',
          'Quantity': 0,
          'Allocated Time (min)': 'No Data',
          'Status': 'scheduled' as const,
          'Efficiency (%)': 0,
          'Quality Score': 0,
          'Notes': 'No Data'
        }];
        data.push(...emptyData);
      }
    
    const today = formatDMY(new Date().toISOString());
    const company = user?.name || 'Manufacturing Company';
    const reportTitle = 'Production Schedule Report';
    // --- Excel ---
    if (format === 'excel') {
      // Create a new worksheet
      const ws = XLSX.utils.aoa_to_sheet([]);
      
      // Add company header (spanning all columns)
      const header = Object.keys(data[0] || {});
      XLSX.utils.sheet_add_aoa(ws, [[company, '', '', '', '', '', '', '', '', '', '', '', '', '']], { origin: 'A1' });
      
      // Add report title (spanning all columns)
      XLSX.utils.sheet_add_aoa(ws, [[reportTitle, '', '', '', '', '', '', '', '', '', '', '', '', '']], { origin: 'A2' });
      
      // Add date (spanning all columns)
      XLSX.utils.sheet_add_aoa(ws, [[`Date: ${today}`, '', '', '', '', '', '', '', '', '', '', '', '', '']], { origin: 'A3' });
      
      // Add empty row for spacing
      XLSX.utils.sheet_add_aoa(ws, [['', '', '', '', '', '', '', '', '', '', '', '', '', '']], { origin: 'A4' });
      
      // Add column headers
      XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A5' });
      
      // Add data rows
      XLSX.utils.sheet_add_aoa(ws, data.map(row => header.map(h => (row as Record<string, any>)[h])), { origin: 'A6' });
      
      // Style the company header (row 1)
      for (let c = 0; c < header.length; c++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, size: 16, color: { rgb: '2563EB' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      
      // Style the report title (row 2)
      for (let c = 0; c < header.length; c++) {
        const cell = XLSX.utils.encode_cell({ r: 1, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, size: 14, color: { rgb: '1E293B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      
      // Style the date (row 3)
      for (let c = 0; c < header.length; c++) {
        const cell = XLSX.utils.encode_cell({ r: 2, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { size: 12, color: { rgb: '64748B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      
      // Style the column headers (row 5)
      header.forEach((h, idx) => {
        const cell = XLSX.utils.encode_cell({ r: 4, c: idx });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2563EB' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '2563EB' } },
              bottom: { style: 'thin', color: { rgb: '2563EB' } },
              left: { style: 'thin', color: { rgb: '2563EB' } },
              right: { style: 'thin', color: { rgb: '2563EB' } },
            },
          };
        }
      });
      
      // Style data rows with alternating colors
      for (let r = 0; r < data.length; r++) {
        header.forEach((h, c) => {
          const cell = XLSX.utils.encode_cell({ r: r + 5, c });
          if (ws[cell]) {
            ws[cell].s = {
              fill: { fgColor: { rgb: r % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } },
              },
            };
          }
        });
      }
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // SO Number
        { wch: 25 }, // Product
        { wch: 15 }, // Part Number
        { wch: 12 }, // Process Step
        { wch: 20 }, // Machine
        { wch: 15 }, // Machine Type
        { wch: 18 }, // Start Date
        { wch: 18 }, // End Date
        { wch: 10 }, // Quantity
        { wch: 18 }, // Allocated Time
        { wch: 12 }, // Status
        { wch: 15 }, // Efficiency
        { wch: 15 }, // Quality Score
        { wch: 30 }  // Notes
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
      XLSX.writeFile(wb, `production-schedule-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }
    // --- PDF ---
    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text(company, 14, 14);
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(reportTitle, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${today}`, 14, 30);
      if (data.length === 0) {
        doc.text('No schedule data available.', 14, 45);
      } else {
        const header = Object.keys(data[0]);
        autoTable(doc, {
          startY: 36,
          head: [header],
          body: data.map(row => header.map(h => (row as Record<string, any>)[h])),
          styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'center' },
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 10, halign: 'center' },
          alternateRowStyles: { fillColor: [239, 246, 255] },
          margin: { left: 10, right: 10 },
          tableLineColor: [37, 99, 235],
          tableLineWidth: 0.3,
          rowPageBreak: 'avoid',
          didDrawCell: (data) => {
            if (data.section === 'body' && data.row.index % 2 === 0) {
              data.cell.styles.fillColor = [255, 255, 255];
            }
          },
        });
      }
      doc.save(`production-schedule-${new Date().toISOString().split('T')[0]}.pdf`);
      return;
    }
    // --- Word ---
    if (format === 'word') {
      const headerRow = new TableRow({
        children: Object.keys(data[0] || {}).map(h =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: h, bold: true, color: '2563EB', size: 20 }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: 'E0E7FF' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' },
              left: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' },
              right: { style: BorderStyle.SINGLE, size: 1, color: '2563EB' },
            },
          })
        ),
      });
      const dataRows = data.map(row =>
        new TableRow({
          children: Object.values(row).map(val =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: String(val), color: '1E293B', size: 18 }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
              },
            })
          ),
        })
      );
      const summaryTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: company, bold: true, size: 28, color: '2563EB' })],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                columnSpan: 14,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: reportTitle, bold: true, size: 26, color: '1E293B' })],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                columnSpan: 14,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `Date: ${today}`, size: 22, color: '64748B' })],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                columnSpan: 14,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              }),
            ],
          }),
        ],
      });
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              summaryTable,
              new Paragraph({ text: '', spacing: { after: 200 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...dataRows],
              }),
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production-schedule-${new Date().toISOString().split('T')[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // fallback: CSV
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateScheduleItem = (itemId: string, updates: Partial<ScheduleItem>) => {
    setScheduleItems(((((prev: ScheduleItem[]) => prev.map((item: ScheduleItem) =>
      item.id === itemId ? { ...item, ...updates } : item
    ))) as any));
  };

  const getScheduleStats = () => {
    const total = filteredSchedule.length;
    const completed = filteredSchedule.filter(item => item.status === 'completed').length;
    const inProgress = filteredSchedule.filter(item => item.status === 'in-progress').length;
    const delayed = filteredSchedule.filter(item => item.status === 'delayed').length;
    const scheduled = filteredSchedule.filter(item => item.status === 'scheduled').length;
    
    const avgEfficiency = filteredSchedule.length > 0 
      ? filteredSchedule.reduce((sum, item) => sum + item.efficiency, 0) / filteredSchedule.length 
      : 0;

    return { total, completed, inProgress, delayed, scheduled, avgEfficiency };
  };

  const stats = getScheduleStats();

  // Helper to get a suggested feasible end date for a SO
  const getSuggestedEndDate = (po: SalesOrder) => {
    const product = products.find(p => p.id === po.productId);
    if (!product) return '';
    const { suggestedDate } = checkDeliveryFeasibility(
      po,
      product,
      machines,
      shifts,
      holidays
    );
    return suggestedDate || '';
  };

  // Helper to get the next N feasible end dates for a SO
  const getNextFeasibleEndDates = (po: SalesOrder, count = 3) => {
    const product = products.find(p => p.id === po.productId);
    if (!product) return [];
    const baseDate = new Date(po.deliveryDate);
    const feasibleDates: string[] = [];
    let testDate = new Date(baseDate);
    let tries = 0;
    while (feasibleDates.length < count && tries < 30) { // limit to 30 tries
      testDate.setDate(testDate.getDate() + 1);
      const testPODate = { ...po, deliveryDate: testDate.toISOString().slice(0, 10) };
      const { feasible } = checkDeliveryFeasibility(
        testPODate,
        product,
        machines,
        shifts,
        holidays
      );
      if (feasible) {
        feasibleDates.push(testDate.toISOString().slice(0, 10));
      }
      tries++;
    }
    return feasibleDates;
  };

  const handleOvertimeRequest = (item: ScheduleItem) => {
    setSelectedScheduleItem(item);
    setShowOvertimeModal(true);
    setOvertimeHours(0);
    setOvertimeReason('');
  };

  const handleProcessDelayConfig = (item: ScheduleItem) => {
    const product = products.find(p => p.id === item.productId);
    const processStep = product?.processFlow.find(step => step.sequence === item.processStep);
    setSelectedProcessStep(processStep);
    setProcessDelay(processStep?.nextProcessDelay || { type: 'immediate' });
    setShowProcessDelayModal(true);
  };

  const toggleItemSchedulingMode = (item: ScheduleItem) => {
    const newMode = item.schedulingMode === 'manual' ? 'auto' : 'manual';
    const updatedItem = toggleSchedulingMode(item, newMode);
    
    const updatedItems = scheduleItems.map(scheduleItem => 
      scheduleItem.id === item.id ? updatedItem : scheduleItem
    );
    
    setScheduleItems(updatedItems);
    setToast({ 
      type: 'success', 
      message: `Schedule item switched to ${newMode} mode` 
    });
  };

  const handleManualStatusUpdate = (item: ScheduleItem) => {
    setSelectedItemForStatus(item);
    setShowStatusModal(true);
  };

  const updateItemStatus = (newStatus: 'scheduled' | 'in-progress' | 'completed' | 'delayed' | 'paused') => {
    if (!selectedItemForStatus) return;
    
    const now = new Date().toISOString();
    const updatedItem = {
      ...selectedItemForStatus,
      status: newStatus,
      progress: newStatus === 'completed' ? 100 : 
                newStatus === 'in-progress' ? (selectedItemForStatus.progress || 0) :
                newStatus === 'scheduled' ? 0 : selectedItemForStatus.progress,
      actualStartTime: newStatus === 'in-progress' && !selectedItemForStatus.actualStartTime ? now : selectedItemForStatus.actualStartTime,
      actualEndTime: newStatus === 'completed' ? now : selectedItemForStatus.actualEndTime,
      actionHistory: [
        ...(selectedItemForStatus.actionHistory || []),
        { action: `status_changed_to_${newStatus}`, timestamp: now, user: user?.name || 'Unknown' }
      ]
    };
    
    const updatedItems = scheduleItems.map(scheduleItem => 
      scheduleItem.id === selectedItemForStatus.id ? updatedItem : scheduleItem
    );
    
    setScheduleItems(updatedItems);
    setShowStatusModal(false);
    setSelectedItemForStatus(null);
    setToast({ 
      type: 'success', 
      message: `Status updated to ${newStatus}` 
    });
  };


  const saveProcessDelay = () => {
    if (!selectedProcessStep) return;
    
    // Update the product's process flow with new delay configuration
    // Note: In a real app, you'd persist this to backend
    const updatedProducts = products.map(product => ({
      ...product,
      processFlow: product.processFlow.map(step => 
        step.id === selectedProcessStep.id 
          ? { ...step, nextProcessDelay: processDelay }
          : step
      )
    }));
    // Products updated in memory for this session
    console.log('Updated products with process delay:', updatedProducts);
    setShowProcessDelayModal(false);
    setToast({ type: 'success', message: 'Process delay configuration saved successfully!' });
  };

  const submitOvertimeRequest = () => {
    if (!selectedScheduleItem || overtimeHours <= 0) {
      alert('Please enter valid overtime hours (greater than 0)');
      return;
    }
    
    const shift = shifts.find(s => s.isActive); // Get current active shift
    if (!shift) {
      alert('No active shift found. Please configure an active shift first.');
      return;
    }
    
    if (!isOvertimeAllowed(overtimeHours, shift)) {
      const maxAllowed = shift.timing?.overtimeAllowed ? 
        (shift.timing.maxOvertimeHours || 12) : 4;
      alert(`Overtime exceeds maximum allowed hours. Maximum allowed: ${maxAllowed} hours for this shift.`);
      return;
    }

    const overtimeRecord: OvertimeRecord = {
      id: Date.now().toString(),
      scheduleItemId: selectedScheduleItem.id,
      shiftId: shift.id,
      date: new Date().toISOString().split('T')[0],
      plannedOvertimeHours: overtimeHours,
      reason: overtimeReason,
      status: 'planned',
      costMultiplier: getOvertimeMultiplier(overtimeHours),
      startTime: selectedScheduleItem.endDate,
      endTime: new Date(new Date(selectedScheduleItem.endDate).getTime() + (overtimeHours * 60 * 60 * 1000)).toISOString(),
    };

    const updatedItems = scheduleItems.map(item => {
      if (item.id === selectedScheduleItem.id) {
        return {
          ...item,
          overtimeRecords: [...(item.overtimeRecords || []), overtimeRecord],
          plannedOvertimeHours: (item.plannedOvertimeHours || 0) + overtimeHours
        };
      }
      return item;
    });

    setScheduleItems(updatedItems);
    setShowOvertimeModal(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all animate-fade-in ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                              <h1 className="text-3xl font-bold text-gray-900">Production Schedule</h1>
              <p className="text-gray-600">AI-powered auto-scheduling and optimization for Sales Orders</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => forceRefresh()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Refresh Progress"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={generateProductionSchedule}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg font-semibold"
              >
                <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                <span>{isGenerating ? 'Generating...' : 'Auto-Generate Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Info Message */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Auto-Schedule Generation</h4>
              <p className="text-blue-700 text-sm">
                Schedules are automatically generated when you add new Sales Orders. 
                You can also manually generate or optimize schedules here. 
                The system considers machine availability, priorities, and delivery dates.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Target className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Play className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delayed</p>
                <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
              </div>
              <Clock className="text-red-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-amber-600">{stats.scheduled}</p>
              </div>
              <Calendar className="text-amber-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgEfficiency.toFixed(1)}%</p>
              </div>
              <Zap className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters & Controls</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportSchedule('excel')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                <span>Excel</span>
              </button>
              <button
                onClick={() => exportSchedule('pdf')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Download size={16} />
                <span>PDF</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filter.dateRange}
                onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Machine
              </label>
              <select
                value={filter.machineId}
                onChange={(e) => setFilter(prev => ({ ...prev, machineId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Machines</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.machineName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                value={filter.productId}
                onChange={(e) => setFilter(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <GanttChart 
          scheduleItems={filteredSchedule} 
          onItemClick={setSelectedItem}
        />

        {/* Schedule Items List */}
        {filteredSchedule.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Schedule Details</h3>
                <span className="relative group">
                  <HelpCircle size={18} className="text-blue-400 cursor-pointer" />
                  <div className="absolute left-6 top-0 z-20 w-64 p-3 bg-white border border-blue-200 rounded-lg shadow-lg text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <b>Actions:</b><br/>
                    <b>Settings</b>: View and edit schedule item details<br/>
                    <b>Start</b>: Mark as in-progress<br/>
                    <b>Pause</b>: Pause an in-progress item<br/>
                    <b>Progress Bar</b>: Shows completion %<br/>
                    <b>Status Badge</b>: Read-only, auto-calculated
                  </div>
                </span>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Product</label>
                  <select
                    value={detailsFilter.productId}
                    onChange={e => setDetailsFilter(f => ({ ...f, productId: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Products</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.productName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Machine</label>
                  <select
                    value={detailsFilter.machineId}
                    onChange={e => setDetailsFilter(f => ({ ...f, machineId: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">All Machines</option>
                    {machines.map(machine => (
                      <option key={machine.id} value={machine.id}>{machine.machineName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SO / Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchedule
                    .filter(item =>
                      (!detailsFilter.productId || item.productId === detailsFilter.productId) &&
                      (!detailsFilter.machineId || item.machineId === detailsFilter.machineId)
                    )
                    .map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    const machine = machines.find(m => m.id === item.machineId);
                    const po = purchaseOrders.find(p => p.id === item.poId);
                    // Dynamic progress calculation
                    let start = new Date(item.actualStartTime || item.startDate);
                    let end = new Date(item.actualEndTime || item.endDate);
                    let now = new Date();
                    let progress = 0;
                    if (now <= start) progress = 0;
                    else if (now >= end) progress = 100;
                    else progress = Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
                    // Auto-complete if finished before end date
                    if (progress === 100 && item.status !== 'completed' && now <= end) {
                      updateScheduleItem(item.id, { status: 'completed', actualEndTime: now.toISOString() });
                    }
                    // Calculate status automatically
                    const autoStatus = getAutoStatus(item);
                    // If delayed, show popup for manual completion
                    if (autoStatus === 'delayed' && showDelayedPopup.poId !== item.poId && !showDelayedPopup.open) {
                      setShowDelayedPopup({poId: item.poId, open: true});
                    }
                    
                    return (
                      <tr key={item.id + refreshKey} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">SO #{po?.poNumber}</p>
                            <p className="text-sm text-gray-500">{product?.productName}</p>
                            <p className="text-xs text-gray-400">Step {item.processStep} • Qty: {item.quantity}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{machine?.machineName}</p>
                            <p className="text-sm text-gray-500">{machine?.machineType}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm text-gray-900">{new Date(item.startDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-400">{item.allocatedTime} minutes</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress === 100 ? 'bg-green-500' :
                                progress > 50 ? 'bg-blue-500' :
                                progress > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">{progress}% complete</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Status badge, read-only */}
                          <span
                            className={`text-xs font-medium rounded-full px-3 py-1 border ${
                              autoStatus === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                              autoStatus === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              autoStatus === 'delayed' ? 'bg-red-100 text-red-800 border-red-200' :
                              autoStatus === 'paused' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {autoStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleItemSchedulingMode(item)}
                              className={`px-3 py-1 text-white rounded text-sm ${
                                item.schedulingMode === 'manual' 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                              title={`Switch to ${item.schedulingMode === 'manual' ? 'auto' : 'manual'} mode`}
                            >
                              {item.schedulingMode === 'manual' ? (
                                <>
                                  <Play size={14} className="inline mr-1" />
                                  Manual
                                </>
                              ) : (
                                <>
                                  <Zap size={14} className="inline mr-1" />
                                  Auto
                                </>
                              )}
                            </button>
                            {item.schedulingMode === 'manual' && (
                              <button
                                onClick={() => handleManualStatusUpdate(item)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                title="Update status manually"
                              >
                                <CheckCircle size={14} className="inline mr-1" />
                                Status
                              </button>
                            )}
                            <button
                              onClick={() => handleOvertimeRequest(item)}
                              className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                              disabled={item.status === 'completed'}
                            >
                              <Clock size={14} className="inline mr-1" />
                              Overtime
                            </button>
                            <button
                              onClick={() => handleProcessDelayConfig(item)}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                            >
                              <Target size={14} className="inline mr-1" />
                              Process Delay
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSchedule.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled items found</h3>
            <p className="text-gray-500 mb-6">
              Generate a schedule to see production planning or adjust your filters.
            </p>
            <button
              onClick={generateProductionSchedule}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mx-auto"
            >
              <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Generating...' : 'Generate Schedule'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Schedule Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateScheduleItem(selectedItem.id, { notes });
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && conflicts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Scheduling Conflict Detected</h3>
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setEditedEndDates({});
                  setConflictSearch('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            {/* Search Bar */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Search PO number or product name..."
                value={conflictSearch}
                onChange={e => setConflictSearch(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-4">
              {conflicts
                .filter(conflict => {
                  const poNum = conflict.newPO.poNumber?.toLowerCase() || '';
                  const prod = (products.find(p => p.id === conflict.newPO.productId)?.productName || '').toLowerCase();
                  return (
                    poNum.includes(conflictSearch.toLowerCase()) ||
                    prod.includes(conflictSearch.toLowerCase())
                  );
                })
                .map((conflict, idx) => {
                  const priorityColor = {
                    urgent: 'bg-red-100 text-red-700 border-red-300',
                    high: 'bg-orange-100 text-orange-700 border-orange-300',
                    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                    low: 'bg-green-100 text-green-700 border-green-300'
                  }[conflict.newPO.priority] || 'bg-gray-100 text-gray-700 border-gray-300';
                  // Calculate a new suggested end date for this PO
                  const suggestedEndDate = getSuggestedEndDate(conflict.newPO) || conflict.suggestedEndDate;
                  // Get next 3 feasible end dates if needed
                  const product = products.find(p => p.id === conflict.newPO.productId);
                  const qtyByDelivery = scheduleItems
                    .filter(item => item.poId === conflict.newPO.id && new Date(item.endDate) <= new Date(suggestedEndDate))
                    .reduce((sum, item) => sum + item.quantity, 0);
                  const showFeasibleChips = qtyByDelivery < conflict.newPO.quantity;
                  const nextFeasibleDates = showFeasibleChips ? getNextFeasibleEndDates(conflict.newPO, 3) : [];
                  return (
                    <div key={idx} className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white shadow-md">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${priorityColor}`}>
                          {conflict.newPO.priority.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-indigo-100 text-indigo-700 border-indigo-300">
                          PO #{conflict.newPO.poNumber}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-pink-100 text-pink-700 border-pink-300">
                          {products.find(p => p.id === conflict.newPO.productId)?.productName || 'Unknown Product'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-cyan-100 text-cyan-700 border-cyan-300">
                          {machines.find(m => m.id === conflict.machineId)?.machineName || 'Unknown Machine'}
                        </span>
                      </div>
                      <div className="mb-2 text-base font-semibold text-red-700 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{conflict.userMessage}</span>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-xs text-gray-600 font-medium">Change End Date:</span>
                        <input
                          type="date"
                          value={
                            editedEndDates[conflict.conflictingPO.id] ||
                            suggestedEndDate.slice(0, 10)
                          }
                          min={suggestedEndDate.slice(0, 10)}
                          onChange={e =>
                            setEditedEndDates(prev => ({
                              ...prev,
                              [conflict.conflictingPO.id]: e.target.value
                            }))
                          }
                          className="border-2 border-blue-300 px-2 py-1 rounded-lg focus:ring-2 focus:ring-blue-400"
                        />
                        <span className="text-xs text-blue-700 ml-2 font-semibold">
                          (Suggested: {suggestedEndDate ? new Date(suggestedEndDate).toLocaleDateString() : 'N/A'})
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          (Current scheduled: <b>{new Date(conflict.suggestedEndDate).toLocaleDateString()}</b>)
                        </span>
                      </div>
                      {showFeasibleChips && nextFeasibleDates.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 ml-2">
                          <span className="text-xs text-gray-600 font-medium mr-2">Next feasible dates:</span>
                          {nextFeasibleDates.map(date => (
                            <button
                              key={date}
                              type="button"
                              onClick={() => setEditedEndDates(prev => ({ ...prev, [conflict.conflictingPO.id]: date }))}
                              className="px-3 py-1 rounded-full text-xs font-semibold border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              {new Date(date).toLocaleDateString()}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 ml-8">
                        Delivery Date: <b className="text-blue-700">{conflict.newPO.deliveryDate}</b>
                      </div>
                    </div>
                  );
                })}
              {conflicts.filter(conflict => {
                const poNum = conflict.newPO.poNumber?.toLowerCase() || '';
                const prod = (products.find(p => p.id === conflict.newPO.productId)?.productName || '').toLowerCase();
                return (
                  poNum.includes(conflictSearch.toLowerCase()) ||
                  prod.includes(conflictSearch.toLowerCase())
                );
              }).length === 0 && (
                <div className="text-center text-gray-400 py-8">No conflicts found for your search.</div>
              )}
            </div>
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  setEditedEndDates({});
                  setConflictSearch('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  let updatedSchedule = [...scheduleItems];
                  // Update PO deliveryDate for each conflict
                  for (const conflict of conflicts) {
                    const newEndDate =
                      editedEndDates[conflict.conflictingPO.id] ||
                      conflict.suggestedEndDate.slice(0, 10);
                    // Update PO deliveryDate
                    await updatePurchaseOrder(conflict.conflictingPO.id, {
                      deliveryDate: newEndDate
                    });
                    // Update schedule item endDate for UI
                    updatedSchedule = updatedSchedule.map(item =>
                      item.poId === conflict.conflictingPO.id
                        ? {
                            ...item,
                            endDate: new Date(newEndDate + 'T23:59:59.999Z').toISOString(),
                            notes: (item.notes || '') + ' [User changed end date to resolve conflict]'
                          }
                        : item
                    );
                  }
                  setScheduleItems(updatedSchedule);
                  setShowConflictModal(false);
                  setConflicts([]);
                  setEditedEndDates({});
                  setConflictSearch('');
                  // Re-run schedule generation to recalculate with new delivery dates
                  await generateProductionSchedule();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resolve Conflict & Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delayed PO Popup */}
      {showDelayedPopup.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-red-300 animate-fade-in">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fee2e2"/><path d="M12 8v4m0 4h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-red-700 mb-2">SO Delayed</h2>
              <p className="text-gray-700 mb-4 text-center">This Sales Order is delayed. If the client is okay with the delay, you can mark it as completed manually.</p>
              <div className="flex gap-4">
                <button
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                  onClick={() => {
                    // Mark all schedule items for this SO as completed
                    setScheduleItems(
                      scheduleItems.map((item) =>
                        item.poId === showDelayedPopup.poId
                          ? { ...item, status: 'completed', actualEndTime: new Date().toISOString() }
                          : item
                      )
                    );
                    setShowDelayedPopup({poId: '', open: false});
                  }}
                >
                  Mark as Completed
                </button>
                <button
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                  onClick={() => setShowDelayedPopup({ poId: '', open: false })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Request Modal */}
      {showOvertimeModal && selectedScheduleItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Request Overtime</h3>
              <button
                onClick={() => setShowOvertimeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Item
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{products.find(p => p.id === selectedScheduleItem.productId)?.productName}</p>
                  <p className="text-sm text-gray-600">
                    Machine: {machines.find(m => m.id === selectedScheduleItem.machineId)?.machineName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Current End: {new Date(selectedScheduleItem.endDate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter hours (0.5 - 8)"
                />
                {overtimeHours > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Cost Multiplier: {getOvertimeMultiplier(overtimeHours)}x
                    </p>
                    <p className="text-sm text-blue-700">
                      New End Time: {new Date(new Date(selectedScheduleItem.endDate).getTime() + (overtimeHours * 60 * 60 * 1000)).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Overtime
                </label>
                <textarea
                  value={overtimeReason}
                  onChange={(e) => setOvertimeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Explain why overtime is needed..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowOvertimeModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitOvertimeRequest}
                  disabled={overtimeHours <= 0 || !overtimeReason.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Overtime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Delay Configuration Modal */}
      {showProcessDelayModal && selectedProcessStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Configure Process Delay</h3>
              <button
                onClick={() => setShowProcessDelayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Process Step
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedProcessStep.stepName}</p>
                  <p className="text-sm text-gray-600">Sequence: {selectedProcessStep.sequence}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Process Start Timing
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="immediate"
                      name="processDelay"
                      value="immediate"
                      checked={processDelay.type === 'immediate'}
                      onChange={(e) => setProcessDelay({ type: e.target.value as any })}
                      className="mr-3"
                    />
                    <label htmlFor="immediate" className="flex items-center">
                      <span className="font-medium">Immediate</span>
                      <span className="ml-2 text-sm text-gray-600">Next process starts right after this one</span>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="1day"
                      name="processDelay"
                      value="1day"
                      checked={processDelay.type === '1day'}
                      onChange={(e) => setProcessDelay({ type: e.target.value as any })}
                      className="mr-3"
                    />
                    <label htmlFor="1day" className="flex items-center">
                      <span className="font-medium">1 Day Delay</span>
                      <span className="ml-2 text-sm text-gray-600">24 hours waiting time</span>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="2day"
                      name="processDelay"
                      value="2day"
                      checked={processDelay.type === '2day'}
                      onChange={(e) => setProcessDelay({ type: e.target.value as any })}
                      className="mr-3"
                    />
                    <label htmlFor="2day" className="flex items-center">
                      <span className="font-medium">2 Day Delay</span>
                      <span className="ml-2 text-sm text-gray-600">48 hours waiting time</span>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="chain_complete"
                      name="processDelay"
                      value="chain_complete"
                      checked={processDelay.type === 'chain_complete'}
                      onChange={(e) => setProcessDelay({ type: e.target.value as any })}
                      className="mr-3"
                    />
                    <label htmlFor="chain_complete" className="flex items-center">
                      <span className="font-medium">Chain Complete</span>
                      <span className="ml-2 text-sm text-gray-600">Wait for entire batch to complete</span>
                    </label>
                  </div>
                </div>
              </div>

              {processDelay.type !== 'immediate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={processDelay.description || ''}
                    onChange={(e) => setProcessDelay({ ...processDelay, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Reason for delay (e.g., cooling time, quality check)"
                  />
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Impact Preview</h4>
                <div className="text-sm text-blue-700">
                  {processDelay.type === 'immediate' && (
                    <p>Next process will start immediately after this one completes.</p>
                  )}
                  {processDelay.type === '1day' && (
                    <p>Next process will start {calculateProcessDelay(processDelay)} hours after this one completes.</p>
                  )}
                  {processDelay.type === '2day' && (
                    <p>Next process will start {calculateProcessDelay(processDelay)} hours after this one completes.</p>
                  )}
                  {processDelay.type === 'chain_complete' && (
                    <p>Next process will wait for all items in the batch to complete this step.</p>
                  )}
                  {selectedScheduleItem && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="font-medium">Example timing:</p>
                      <p>Current end: {new Date(selectedScheduleItem.endDate).toLocaleString()}</p>
                      <p>Next start: {calculateNextProcessStartTime(
                        new Date(selectedScheduleItem.endDate),
                        processDelay,
                        shifts
                      ).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowProcessDelayModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProcessDelay}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Status Update Modal */}
      {showStatusModal && selectedItemForStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current Status: <span className="font-medium">{selectedItemForStatus.status}</span>
              </p>
              <p className="text-sm text-gray-600">
                Item: {products.find(p => p.id === selectedItemForStatus.productId)?.productName} - Step {selectedItemForStatus.processStep}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Select New Status:</p>
              {['scheduled', 'in-progress', 'paused', 'completed', 'delayed'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateItemStatus(status as any)}
                  className={`w-full text-left px-3 py-2 rounded border hover:bg-gray-50 ${
                    selectedItemForStatus.status === status 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'border-gray-200'
                  }`}
                  disabled={selectedItemForStatus.status === status}
                >
                  <span className="capitalize">{status.replace('-', ' ')}</span>
                  {selectedItemForStatus.status === status && (
                    <span className="text-xs text-blue-600 ml-2">(Current)</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling;