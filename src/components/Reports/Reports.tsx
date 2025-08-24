import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { getDashboardMetrics, calculateMachineEfficiency, getAutoPOStatus } from '../../utils/scheduling';
import { FileText, Download, TrendingUp, Calendar, Package, User, AlertTriangle, CheckCircle, Clock, MapPin, Wrench, BarChart3 } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';

const Reports: React.FC = () => {
  const { purchaseOrders, products, machines, scheduleItems, user, holidays } = useApp();
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'machine-utilization'>('summary');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const metrics = getDashboardMetrics(purchaseOrders, scheduleItems);

  const generateReport = async (format: 'pdf' | 'excel' | 'word') => {
    // Prepare tabular data for export
    const tableData = [
      ['Company Name', user?.name || 'Manufacturing Company'],
      ['Report Date', new Date().toLocaleDateString()],
      ['Total Orders', metrics.totalOrders],
      ['On Time Orders', metrics.onTimeOrders],
      ['Delayed Orders', metrics.delayedOrders],
      ['Machine Utilization (%)', metrics.machineUtilization],
      ['Machines', machines.length],
      ['Products', products.length],
      ['Schedule Items', scheduleItems.length],
    ];
    const today = new Date().toLocaleDateString();
    const company = user?.name || 'Manufacturing Company';
    const reportTitle = 'Manufacturing Report';
    if (format === 'excel') {
      // Create a new worksheet
      const ws = XLSX.utils.aoa_to_sheet([]);
      
      // Add company header (spanning both columns)
      XLSX.utils.sheet_add_aoa(ws, [[company, '']], { origin: 'A1' });
      
      // Add report title (spanning both columns)
      XLSX.utils.sheet_add_aoa(ws, [[reportTitle, '']], { origin: 'A2' });
      
      // Add date (spanning both columns)
      XLSX.utils.sheet_add_aoa(ws, [[`Date: ${today}`, '']], { origin: 'A3' });
      
      // Add empty row for spacing
      XLSX.utils.sheet_add_aoa(ws, [['', '']], { origin: 'A4' });
      
      // Add column headers
      XLSX.utils.sheet_add_aoa(ws, [['Field', 'Value']], { origin: 'A5' });
      
      // Add data rows
      XLSX.utils.sheet_add_aoa(ws, tableData, { origin: 'A6' });
      
      // Style the company header (row 1)
      for (let c = 0; c < 2; c++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, size: 16, color: { rgb: '2563EB' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      
      // Style the report title (row 2)
      for (let c = 0; c < 2; c++) {
        const cell = XLSX.utils.encode_cell({ r: 1, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, size: 14, color: { rgb: '1E293B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      
      // Style the date (row 3)
      for (let c = 0; c < 2; c++) {
        const cell = XLSX.utils.encode_cell({ r: 2, c });
        if (ws[cell]) {
          ws[cell].s = {
            font: { size: 12, color: { rgb: '64748B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }
      
      // Style the column headers (row 5)
      ['Field', 'Value'].forEach((h, idx) => {
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
      for (let r = 0; r < tableData.length; r++) {
        for (let c = 0; c < 2; c++) {
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
        }
      }
      
      // Set column widths
      ws['!cols'] = [{ wch: 28 }, { wch: 28 }];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `manufacturing-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }
    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text(company, 10, 15);
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(reportTitle, 10, 25);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${today}`, 10, 32);
      autoTable(doc, {
        startY: 38,
        head: [['Field', 'Value']],
        body: tableData,
        styles: { fontSize: 11, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        margin: { left: 10, right: 10 },
        tableLineColor: [37, 99, 235],
        tableLineWidth: 0.2,
      });
      doc.save(`manufacturing-report-${new Date().toISOString().split('T')[0]}.pdf`);
      return;
    }
    if (format === 'word') {
      const headerRow = new TableRow({
        children: ['Field', 'Value'].map(h =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: h, bold: true, color: '2563EB', size: 24 }),
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
      const dataRows = tableData.map(row =>
        new TableRow({
          children: row.map(val =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: String(val), color: '1E293B', size: 22 }),
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
                columnSpan: 2,
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
                columnSpan: 2,
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
                columnSpan: 2,
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
      a.download = `manufacturing-report-${new Date().toISOString().split('T')[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
  };

  // Parse holidays as objects with optional reason (stored as 'YYYY-MM-DD|reason')
  const parseHoliday = (h: string) => {
    const [date, ...reasonParts] = h.split('|');
    return { date, reason: reasonParts.join('|') || '' };
  };
  const holidayEntries = holidays.map(parseHoliday);

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
  const currentYear = calendarMonth.getFullYear();
  const sundays = getAllSundays(currentYear);

  // Color legend for holiday types
  const colorLegend: { label: string; className: string; tooltip: string }[] = [
    { label: 'Sunday', className: 'bg-blue-100 border-blue-300 text-blue-700', tooltip: 'Default weekly holiday (every Sunday)' },
    { label: 'Festival/Celebration', className: 'bg-pink-100 border-pink-300 text-pink-700', tooltip: 'Festival, celebration, or special event' },
    { label: 'Maintenance/Shutdown', className: 'bg-yellow-100 border-yellow-300 text-yellow-700', tooltip: 'Maintenance, shutdown, or repair' },
    { label: 'National/Public', className: 'bg-green-100 border-green-300 text-green-700', tooltip: 'National or public holiday' },
    { label: 'Other', className: 'bg-purple-100 border-purple-300 text-purple-700', tooltip: 'Other custom reason' },
  ];

  // Color coding for reasons
  const reasonColor = (reason: string) => {
    if (!reason) return 'bg-red-100 border-red-300 text-red-700';
    if (/festival|holiday|celebration/i.test(reason)) return 'bg-pink-100 border-pink-300 text-pink-700';
    if (/maintenance|shutdown|repair/i.test(reason)) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    if (/national|public/i.test(reason)) return 'bg-green-100 border-green-300 text-green-700';
    return 'bg-purple-100 border-purple-300 text-purple-700';
  };

  // Get upcoming holidays (next 5)
  // Fix: Use date string and UTC methods to avoid timezone bugs
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidays = holidayEntries
    .map(h => ({ ...h, dateObj: new Date(h.date + 'T00:00:00Z') }))
    .filter(h => h.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // Calendar grid logic
  const getMonthDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    const days: Date[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, monthIdx, 1 - (firstDay.getDay() - i)));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, monthIdx, d));
    }
    for (let i = lastDay.getDay() + 1; i <= 6; i++) {
      days.push(new Date(year, monthIdx + 1, i - lastDay.getDay()));
    }
    return days;
  };
  const monthDays = getMonthDays(calendarMonth);
  const isHoliday = (date: Date) => holidayEntries.some(h => h.date === date.toISOString().split('T')[0]) || sundays.includes(date.toISOString().split('T')[0]);
  const getHolidayReason = (date: Date) => {
    const entry = holidayEntries.find(h => h.date === date.toISOString().split('T')[0]);
    return entry?.reason || (sundays.includes(date.toISOString().split('T')[0]) ? 'Sunday' : '');
  };
  const isToday = (date: Date) => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  };

  const nextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const SummaryReport = () => (
    <div className="space-y-6">
      {/* Modern, full-width holidays section with calendar */}
      <div className="w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl shadow border border-blue-100 p-8 mb-6">
        {/* Color legend */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <span className="font-semibold text-gray-700 mr-2">Legend:</span>
          {colorLegend.map((l: { label: string; className: string; tooltip: string }) => (
            <span key={l.label} className={`relative group px-3 py-1 rounded-full border text-xs font-semibold ${l.className} cursor-pointer transition-colors duration-200`}
              tabIndex={0}
            >
              {l.label}
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-300 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap min-w-max">
                {l.tooltip}
              </span>
            </span>
          ))}
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon size={32} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-blue-900">Holidays Calendar</h2>
              <p className="text-gray-500">All Sundays and custom holidays are highlighted below.</p>
            </div>
          </div>
          <div className="flex gap-2 items-center mt-4 md:mt-0">
            <button onClick={prevMonth} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">&lt;</button>
            <span className="font-semibold text-blue-800">{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
            <button onClick={nextMonth} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">&gt;</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl mx-auto text-center select-none">
            <thead>
              <tr className="text-blue-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <th key={day} className="py-2 font-semibold">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(monthDays.length / 7) }).map((_, weekIdx) => (
                <tr key={weekIdx}>
                  {monthDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                    const holiday = isHoliday(date);
                    const today = isToday(date);
                    const inMonth = date.getMonth() === calendarMonth.getMonth();
                    const reason = getHolidayReason(date);
                    const colorClass = holiday && inMonth ? reasonColor(reason) : '';
                    return (
                      <td
                        key={idx}
                        className={`relative py-2 px-1 md:px-2 rounded-lg transition-all duration-200 font-bold
                          ${colorClass} ${holiday && inMonth ? 'border-2' : ''}
                          ${today && inMonth ? 'bg-blue-200 text-blue-900 border-2 border-blue-400' : ''}
                          ${!inMonth ? 'text-gray-300' : ''}
                        `}
                        title={holiday && inMonth ? (reason ? `Holiday: ${reason}` : 'Holiday') : today && inMonth ? 'Today' : ''}
                      >
                        {date.getDate()}
                        {holiday && inMonth && (
                          <span className="absolute top-1 right-1 text-xs text-red-400">•</span>
                        )}
                        {today && inMonth && (
                          <span className="absolute bottom-1 left-1 text-xs text-blue-700">Today</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upcoming Holidays</h3>
            <ul className="space-y-2">
              {upcomingHolidays.length === 0 && <li className="text-gray-400">No upcoming holidays.</li>}
              {upcomingHolidays.map((h, idx) => (
                <li key={idx} className="flex items-center gap-2 text-blue-700">
                  <span className="font-mono bg-blue-50 px-2 py-1 rounded">{h.date}</span>
                  <span className="text-xs text-gray-500">{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(h.date + 'T00:00:00Z').getUTCDay()]}</span>
                  {h.reason && <span className={`text-xs rounded px-2 py-1 ml-2 ${reasonColor(h.reason)}`}>{h.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div> */}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Order Status Distribution</h3>
        <div className="space-y-3">
          {['pending', 'in-progress', 'completed', 'delayed'].map(status => {
            const count = purchaseOrders.filter(po => po.status === status).length;
            const percentage = metrics.totalOrders > 0 ? (count / metrics.totalOrders * 100).toFixed(1) : 0;
            
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'in-progress' ? 'bg-blue-500' :
                    status === 'delayed' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="capitalize text-gray-700">{status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <span className="text-sm text-gray-500">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const DetailedReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Sales Orders Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map(po => {
                const product = products.find(p => p.id === po.productId);
                return (
                  <tr key={po.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      SO #{po.poNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product?.productName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {po.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        getAutoPOStatus(po, scheduleItems) === 'completed' ? 'bg-green-100 text-green-800' :
                        getAutoPOStatus(po, scheduleItems) === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        getAutoPOStatus(po, scheduleItems) === 'delayed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getAutoPOStatus(po, scheduleItems)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(po.deliveryDate).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const MachineUtilizationReport = () => (
    <div className="space-y-8">
            {machines.map(machine => {
              const machineSchedule = scheduleItems.filter(item => item.machineId === machine.id);
        const completedWithActuals = machineSchedule.filter(item => item.status === 'completed' && item.actualStartTime && item.actualEndTime);
        console.log('Machine:', machine, 'Completed with actuals:', completedWithActuals);
              const totalTime = machineSchedule.reduce((sum, item) => sum + item.allocatedTime, 0);
              const utilizationPercentage = machine.workingHours ? Math.min(100, (totalTime / (machine.workingHours * 60)) * 100) : 0;
        const liveEfficiency = calculateMachineEfficiency(machine.id, scheduleItems);
              return (
          <div key={machine.id} className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Wrench size={28} className="text-white" />
                </div>
                    <div>
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">{machine.machineName}
                    {machine.status === 'active' && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">Active</span>}
                    {machine.status === 'maintenance' && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Maintenance</span>}
                    {machine.status === 'breakdown' && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border-red-300">Breakdown</span>}
                    {machine.status === 'idle' && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border-gray-300">Idle</span>}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><BarChart3 size={14} /> {machine.machineType}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={14} /> {machine.location}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {machine.workingHours}h/day</span>
                    <span className="inline-flex items-center gap-1"><User size={14} /> {machine.operatorId || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Efficiency:</span>
                  <span className="font-bold text-blue-700">{liveEfficiency !== null ? `${liveEfficiency}%` : 'N/A'}</span>
                </div>
                <div className="w-40 bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${liveEfficiency !== null ? liveEfficiency : 0}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Utilization:</span>
                  <span className="font-bold text-purple-700">{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-40 bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${utilizationPercentage}%` }} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Last Maintenance: {machine.lastMaintenance}</span>
              <span className="inline-flex items-center gap-1"><AlertTriangle size={14} className="text-red-500" /> Next Maintenance: {machine.nextMaintenance}</span>
              <span className="inline-flex items-center gap-1"><FileText size={14} /> Capacity: {machine.capacity || 'N/A'}</span>
              <span className="inline-flex items-center gap-1"><FileText size={14} /> Power: {machine.specifications?.power || 'N/A'}</span>
              <span className="inline-flex items-center gap-1"><FileText size={14} /> Dimensions: {machine.specifications?.dimensions || 'N/A'}</span>
              <span className="inline-flex items-center gap-1"><FileText size={14} /> Weight: {machine.specifications?.weight || 'N/A'}</span>
            </div>
            {machine.problems && machine.problems.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-semibold text-red-700 mb-1 flex items-center gap-2"><AlertTriangle size={16} /> Issues:</div>
                <ul className="list-disc ml-6 text-xs text-red-700">
                  {machine.problems.map((problem, idx) => <li key={idx}>{problem}</li>)}
                </ul>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-4 mt-2">
              <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Calendar size={16} /> Schedule Breakdown</h5>
              {machineSchedule.length === 0 ? (
                <div className="text-gray-400 text-sm">No scheduled items for this machine.</div>
              ) : (
                <div className="grid gap-4">
                  {machineSchedule.map((item, idx) => {
                    const po = purchaseOrders.find(po => po.id === item.poId);
                    const product = products.find(p => p.id === item.productId);
                    const statusColor =
                      item.status === 'completed' ? 'border-l-4 border-green-500' :
                      item.status === 'in-progress' ? 'border-l-4 border-blue-500' :
                      item.status === 'delayed' ? 'border-l-4 border-red-500' :
                      item.status === 'paused' ? 'border-l-4 border-yellow-500' :
                      'border-l-4 border-gray-400';
                    const statusIcon =
                      item.status === 'completed' ? <CheckCircle size={18} className="text-green-500" /> :
                      item.status === 'in-progress' ? <Clock size={18} className="text-blue-500" /> :
                      item.status === 'delayed' ? <AlertTriangle size={18} className="text-red-500" /> :
                      item.status === 'paused' ? <Clock size={18} className="text-yellow-500" /> :
                      <Clock size={18} className="text-gray-400" />;
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-shadow duration-200 ${statusColor}`}
                      >
                        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex items-center gap-3 min-w-[120px]">
                            {statusIcon}
                            <div>
                              <div className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                <Package size={16} className="inline-block text-blue-400" />{po?.poNumber || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                <FileText size={13} className="inline-block text-gray-400" />{product?.productName || 'Unknown'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-700">
                            <div><span className="font-semibold text-gray-500">Step:</span> {item.processStep}</div>
                            <div><span className="font-semibold text-gray-500">Allocated:</span> <Clock size={12} className="inline-block mr-1 text-gray-400" />{item.allocatedTime} min</div>
                            <div><span className="font-semibold text-gray-500">Efficiency:</span> {item.efficiency}%</div>
                            <div><span className="font-semibold text-gray-500">Quality:</span> {item.qualityScore}</div>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end gap-2 mt-3 md:mt-0 min-w-[220px]">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar size={12} className="text-gray-400" />
                            <span>Start:</span>
                            <span className="font-semibold text-gray-800">{new Date(item.startDate).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar size={12} className="text-gray-400" />
                            <span>End:</span>
                            <span className="font-semibold text-gray-800">{new Date(item.endDate).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 max-w-[180px] truncate" title={item.notes}>
                            <FileText size={12} className="text-gray-400" />
                            <span className="font-semibold text-gray-500">Notes:</span>
                            <span className="truncate">{item.notes || <span className="text-gray-300">—</span>}</span>
                          </div>
                  </div>
                </div>
              );
            })}
          </div>
              )}
        </div>
        {/* Related SOs Section */}
        <div className="bg-blue-50 rounded-xl p-4 mt-4">
          <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Package size={16} /> Related Sales Orders</h5>
          {(() => {
            // Get all schedule items for this machine
            const machineScheduleItems = scheduleItems.filter(item => item.machineId === machine.id);
                    // Get unique SO IDs
        const soIds = [...new Set(machineScheduleItems.map(item => item.poId))];
        // Get all related SOs
        const relatedSOs = purchaseOrders.filter(po => soIds.includes(po.id));
        if (relatedSOs.length === 0) {
          return <div className="text-gray-400 text-sm">No SOs found for this machine.</div>;
        }
        return (
          <div className="space-y-3">
            {relatedSOs.map(po => {
              const product = products.find(p => p.id === po.productId);
              const soSchedule = machineScheduleItems.filter(item => item.poId === po.id);
                  return (
                    <div key={po.id} className="bg-white rounded-lg shadow-sm border border-blue-100 p-3">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span className="font-bold text-blue-900">SO #{po.poNumber}</span>
                        <span className="text-xs text-gray-500">{product?.productName || 'Unknown Product'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          getAutoPOStatus(po, scheduleItems) === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                          getAutoPOStatus(po, scheduleItems) === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          getAutoPOStatus(po, scheduleItems) === 'delayed' ? 'bg-red-100 text-red-800 border-red-300' :
                          'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}>{getAutoPOStatus(po, scheduleItems)}</span>
                        <span className="text-xs text-gray-500">Qty: {po.quantity}</span>
                        <span className="text-xs text-gray-500">Due: {new Date(po.deliveryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs mt-1">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="px-2 py-1 text-left">Step</th>
                              <th className="px-2 py-1 text-left">Status</th>
                              <th className="px-2 py-1 text-left">Allocated</th>
                              <th className="px-2 py-1 text-left">Efficiency</th>
                              <th className="px-2 py-1 text-left">Quality</th>
                              <th className="px-2 py-1 text-left">Start</th>
                              <th className="px-2 py-1 text-left">End</th>
                            </tr>
                          </thead>
                          <tbody>
                            {soSchedule.map(item => (
                              <tr key={item.id} className="border-b hover:bg-blue-50">
                                <td className="px-2 py-1">{item.processStep}</td>
                                <td className="px-2 py-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                    item.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                                    item.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    item.status === 'delayed' ? 'bg-red-100 text-red-800 border-red-300' :
                                    item.status === 'paused' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                    'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}>{item.status}</span>
                                </td>
                                <td className="px-2 py-1">{item.allocatedTime} min</td>
                                <td className="px-2 py-1">{item.efficiency}%</td>
                                <td className="px-2 py-1">{item.qualityScore}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{new Date(item.actualStartTime || item.startDate).toLocaleString()}</td>
                                <td className="px-2 py-1 whitespace-nowrap">{new Date(item.actualEndTime || item.endDate).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
      </div>
        </div>
      );
    })}
    </div>
  );

  // Add utility for DD/MM/YYYY HH:mm
  function formatDMYHM(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // 2. Add exportDetailedReport function
  const exportDetailedReport = async (format: 'pdf' | 'excel') => {
    // Prepare data - export each schedule item (process step) as a separate row
    const detailedData = scheduleItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      const machine = machines.find(m => m.id === item.machineId);
      const po = purchaseOrders.find(p => p.id === item.poId);
      
      return {
        'SO Number': po?.poNumber || 'N/A',
        'Product': product?.productName || 'Unknown',
        'Part Number': product?.partNumber || 'N/A',
        'Process Step': item.processStep,
        'Machine': machine?.machineName || 'Unknown',
        'Machine Type': machine?.machineType || 'N/A',
        'Start Date': formatDMYHM(item.actualStartTime || item.startDate),
        'End Date': formatDMYHM(item.actualEndTime || item.endDate),
        'Quantity': item.quantity,
        'Allocated Time (min)': item.allocatedTime,
        'Status': item.status,
        'Efficiency (%)': item.efficiency,
        'Quality Score': item.qualityScore,
        'Notes': item.notes || ''
      };
    });
    const headers = Object.keys(detailedData[0] || {});
    // --- PDF ---
    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text('Production Schedule Detailed Report', 14, 14);
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Date: ${formatDMYHM(new Date().toISOString())}`, 14, 22);
      autoTable(doc, {
        startY: 28,
        head: [headers],
        body: detailedData.map(row => headers.map(h => (row as Record<string, any>)[h])),
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
      doc.save(`detailed-report-${new Date().toISOString().split('T')[0]}.pdf`);
      return;
    }
    // --- Excel ---
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(detailedData, { skipHeader: false });
      // Style header row
      headers.forEach((h, idx) => {
        const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (!ws[cell]) ws[cell] = { t: 's', v: h };
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
      });
      // Set alternating row colors
      for (let r = 1; r <= detailedData.length; r++) {
        headers.forEach((h, c) => {
          const cell = XLSX.utils.encode_cell({ r, c });
          if (!ws[cell]) return;
          ws[cell].s = {
            fill: { fgColor: { rgb: r % 2 === 0 ? 'FFFFFF' : 'F3F6FD' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        });
      }
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
      XLSX.utils.book_append_sheet(wb, ws, 'Detailed Report');
      XLSX.writeFile(wb, `detailed-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }
  };

  // 3. Add buttons for detailed report export in the UI
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Production analytics and performance reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateReport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Download size={16} />
            Export PDF
          </button>
          <button
            onClick={() => generateReport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* <div className="flex gap-2 mt-2">
        <button
          onClick={() => exportDetailedReport('pdf')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          <Download size={16} />
          Download Detailed PDF
        </button>
        <button
          onClick={() => exportDetailedReport('excel')}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors"
        >
          <Download size={16} />
          Download Detailed Excel
        </button>
      </div> */}

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Type</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setReportType('summary')}
            className={`px-4 py-2 rounded-md transition-colors ${
              reportType === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Summary Report
          </button>
          <button
            onClick={() => setReportType('detailed')}
            className={`px-4 py-2 rounded-md transition-colors ${
              reportType === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Detailed Report
          </button>
          <button
            onClick={() => setReportType('machine-utilization')}
            className={`px-4 py-2 rounded-md transition-colors ${
              reportType === 'machine-utilization'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Machine Utilization
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {reportType === 'summary' && <SummaryReport />}
        {reportType === 'detailed' && <DetailedReport />}
        {reportType === 'machine-utilization' && <MachineUtilizationReport />}
      </div>
    </div>
  );
};

export default Reports;