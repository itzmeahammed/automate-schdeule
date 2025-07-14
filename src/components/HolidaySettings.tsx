import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Trash2, RefreshCw, Star, Upload, Download, Edit2, Check, X } from 'lucide-react';

interface HolidayEntry {
  date: string;
  reason: string;
}

const HolidaySettings: React.FC = () => {
  const { holidays, setHolidays } = useApp();
  // Parse holidays as objects with optional reason (stored as 'YYYY-MM-DD|reason')
  const parseHoliday = (h: string): HolidayEntry => {
    const [date, ...reasonParts] = h.split('|');
    return { date, reason: reasonParts.join('|') || '' };
  };
  const serializeHoliday = (h: HolidayEntry) => h.reason ? `${h.date}|${h.reason}` : h.date;
  const holidayEntries: HolidayEntry[] = holidays.map(parseHoliday);

  // Helper function to format date consistently
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
  };

  // Helper function to check if a date is Sunday
  const isSunday = (date: Date): boolean => {
    return date.getDay() === 0;
  };

  // Helper function to check if a date is Saturday
  const isSaturday = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    return d.getDay() === 6;
  };

  const [newHoliday, setNewHoliday] = useState('');
  const [newReason, setNewReason] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  const [calendarClickDate, setCalendarClickDate] = useState<string | null>(null);
  const [calendarClickReason, setCalendarClickReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState<{ date: string, reason: string } | null>(null);

  // Helper to get all Sundays in a year
  const getAllSundays = (year: number): string[] => {
    const sundays: string[] = [];
    // Start from January 1st of the year
    const date = new Date(year, 0, 1);
    
    // Find the first Sunday of the year
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }
    
    // Add all Sundays in the year
    while (date.getFullYear() === year) {
      const dateStr = formatDate(date);
      // Double-check this is actually a Sunday by checking the day name
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (dayName === 'Sunday') {
        sundays.push(dateStr);
      }
      date.setDate(date.getDate() + 7); // Move to next Sunday
    }
    return sundays;
  };

  const sundays = getAllSundays(year);
  // Only user holidays that are NOT Sundays and NOT Saturdays
  const userHolidays = holidayEntries.filter(
    h => !sundays.includes(h.date) && !isSaturday(h.date)
  );
  // Only show Sundays and valid custom holidays
  const allHolidays = [
    ...sundays.map(date => ({ date, reason: 'Sunday' })),
    ...userHolidays.filter(h => h.reason || h.date)
  ].sort((a, b) => a.date.localeCompare(b.date));

  const addHoliday = () => {
    if (!newHoliday) return;
    let newList = [...holidays, serializeHoliday({ date: newHoliday, reason: newReason })];
    if (recurring) {
      // Add for next 5 years
      const base = new Date(newHoliday);
      for (let i = 1; i <= 5; i++) {
        const next = new Date(base);
        next.setFullYear(base.getFullYear() + i);
        newList.push(serializeHoliday({ date: formatDate(next), reason: newReason }));
      }
    }
    setHolidays(Array.from(new Set(newList)));
    setNewHoliday('');
    setNewReason('');
    setMessage({ type: 'success', text: 'Holiday added.' });
  };

  const removeHoliday = (date: string) => {
    // Don't allow removing Sundays
    if (sundays.includes(date)) return;
    setHolidays(holidays.filter(h => !h.startsWith(date)));
  };

  const resetToSundays = () => {
    setHolidays(sundays);
  };

  // Export holidays as JSON
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(holidays, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Exported holidays as JSON.' });
  };

  // Export holidays as CSV
  const exportCSV = () => {
    const csv = holidays.map(h => h.replace('|', ',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Exported holidays as CSV.' });
  };

  // Import holidays from file
  const importHolidays = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let imported: string[] = [];
        if (file.name.endsWith('.json')) {
          imported = JSON.parse(event.target?.result as string);
        } else if (file.name.endsWith('.csv')) {
          imported = (event.target?.result as string).split(/\r?\n/).filter(Boolean).map(line => line.replace(',', '|'));
        }
        if (!Array.isArray(imported) || !imported.every(d => /^\d{4}-\d{2}-\d{2}(\|.*)?$/.test(d))) {
          throw new Error('Invalid format');
        }
        setHolidays(Array.from(new Set([...holidays, ...imported])));
        setMessage({ type: 'success', text: 'Imported holidays successfully.' });
      } catch {
        setMessage({ type: 'error', text: 'Failed to import holidays. Invalid file format.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Calendar grid logic
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
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
  const isHoliday = (date: Date) => allHolidays.some(h => h.date === formatDate(date));
  const getHolidayReason = (date: Date) => {
    const entry = allHolidays.find(h => h.date === formatDate(date));
    return entry?.reason || '';
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

  const handleCalendarClick = (date: Date) => {
    const dateStr = formatDate(date);
    const holiday = allHolidays.find(h => h.date === dateStr);
    const isSundayDate = isSunday(date);
    if (holiday && !isSundayDate) {
      setShowRemoveModal({ date: dateStr, reason: holiday.reason });
    } else if (!holiday) {
      setCalendarClickDate(dateStr);
      setCalendarClickReason('');
      setShowAddModal(true);
    }
  };

  // Edit reason for a holiday
  const startEdit = (date: string, reason: string) => {
    setEditing(date);
    setEditReason(reason);
  };
  const saveEdit = (date: string) => {
    setHolidays(holidays.map(h => h.startsWith(date) ? serializeHoliday({ date, reason: editReason }) : h));
    setEditing(null);
    setEditReason('');
    setMessage({ type: 'success', text: 'Reason updated.' });
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditReason('');
  };

  // Color coding for reasons
  const reasonColor = (reason: string) => {
    if (!reason || reason === 'Sunday') return 'bg-blue-100 border-blue-300 text-blue-700';
    if (/festival|holiday|celebration/i.test(reason)) return 'bg-pink-100 border-pink-300 text-pink-700';
    if (/maintenance|shutdown|repair/i.test(reason)) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    if (/national|public/i.test(reason)) return 'bg-green-100 border-green-300 text-green-700';
    return 'bg-purple-100 border-purple-300 text-purple-700';
  };
  // Color legend for holiday types
  const colorLegend: { label: string; className: string; tooltip: string }[] = [
    { label: 'Sunday', className: 'bg-blue-100 border-blue-300 text-blue-700', tooltip: 'Default weekly holiday (every Sunday)' },
    { label: 'Festival/Celebration', className: 'bg-pink-100 border-pink-300 text-pink-700', tooltip: 'Festival, celebration, or special event' },
    { label: 'Maintenance/Shutdown', className: 'bg-yellow-100 border-yellow-300 text-yellow-700', tooltip: 'Maintenance, shutdown, or repair' },
    { label: 'National/Public', className: 'bg-green-100 border-green-300 text-green-700', tooltip: 'National or public holiday' },
    { label: 'Other', className: 'bg-purple-100 border-purple-300 text-purple-700', tooltip: 'Other custom reason' },
  ];


  

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center py-8 px-2">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 flex flex-col gap-8">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Calendar size={36} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Holiday Settings</h1>
              <p className="text-gray-500">Manage company holidays. All Sundays are holidays by default. Add a reason for each holiday for better clarity.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center mt-4 md:mt-0">
            <button onClick={resetToSundays} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors" title="Reset to Sundays only">
              <RefreshCw size={16} /> Reset
            </button>
            <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors" title="Export as JSON">
              <Download size={16} /> JSON
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors" title="Export as CSV">
              <Download size={16} /> CSV
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors cursor-pointer" title="Import holidays">
              <Upload size={16} /> Import
              <input type="file" accept=".json,.csv" onChange={importHolidays} className="hidden" />
            </label>
          </div>
        </div>
        {message && (
          <div className={`mb-4 px-4 py-2 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{message.text}</div>
        )}
        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Calendar Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <button onClick={prevMonth} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">&lt;</button>
              <span className="font-semibold text-blue-800 text-lg">{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">&gt;</button>
            </div>
            <table className="w-full text-center select-none">
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
                      const dateStr = formatDate(date);
                      const isSundayDate = isSunday(date);
                      const colorClass = holiday && inMonth ? reasonColor(reason || (isSundayDate ? 'Sunday' : '')) : '';
                      return (
                        <td
                          key={idx}
                          className={`relative py-2 px-1 md:px-2 rounded-lg transition-all duration-200 cursor-pointer font-bold
                            ${colorClass} ${holiday && inMonth ? 'border-2' : ''}
                            ${today && inMonth ? 'bg-blue-200 text-blue-900 border-2 border-blue-400' : ''}
                            ${!inMonth ? 'text-gray-300' : ''}
                          `}
                          title={holiday && inMonth ? (reason ? `Holiday: ${reason}` : 'Holiday') : today && inMonth ? 'Today' : ''}
                          onClick={() => inMonth && handleCalendarClick(date)}
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
          {/* Add Holiday Form and List */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Holiday</label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={e => setNewHoliday(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={`${year}-01-01`}
                    max={`${year + 5}-12-31`}
                  />
                  <input
                    type="text"
                    value={newReason}
                    onChange={e => setNewReason(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason (e.g. Festival, Maintenance, etc.)"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} />
                    Recurring (every year)
                  </label>
                  <button
                    onClick={addHoliday}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={!newHoliday}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-blue-100 shadow flex-1 overflow-y-auto">
              <h2 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Star size={18} className="text-amber-400" /> Holidays List
              </h2>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Day</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHolidays.map(({ date, reason }) => {
                      const d = new Date(date);
                      const isSundayDate = isSunday(d);
                      const isEditing = editing === date;
                      return (
                        <tr key={date} className={isSundayDate ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-2 font-mono">{date}</td>
                          <td className="px-4 py-2">{d.toLocaleDateString(undefined, { weekday: 'long' })}</td>
                          <td className="px-4 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editReason}
                                onChange={e => setEditReason(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded"
                                placeholder="Reason"
                              />
                            ) : (
                              <span className={`px-2 py-1 rounded ${reasonColor(reason || (isSundayDate ? 'Sunday' : ''))}`}>{reason || (isSundayDate ? 'Sunday' : <span className="text-gray-400">—</span>)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {isSundayDate ? <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">Sunday</span> : <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">Custom</span>}
                          </td>
                          <td className="px-4 py-2 flex gap-2 items-center">
                            {!isSundayDate && !isEditing && (
                              <>
                                <button onClick={() => startEdit(date, reason)} className="text-blue-500 hover:text-blue-700" title="Edit Reason">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => removeHoliday(date)} className="text-red-500 hover:text-red-700" title="Remove">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            {isEditing && (
                              <>
                                <button onClick={() => saveEdit(date)} className="text-green-600 hover:text-green-800" title="Save">
                                  <Check size={16} />
                                </button>
                                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600" title="Cancel">
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {allHolidays.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-gray-400 py-4">No holidays set.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Holiday Modal */}
      {showAddModal && calendarClickDate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200 max-w-md w-full">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Add Holiday</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={calendarClickDate} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={calendarClickReason}
                onChange={e => setCalendarClickReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason (e.g. Festival, Maintenance, etc.)"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCalendarClickDate(null);
                  setCalendarClickReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >Cancel</button>
              <button
                onClick={() => {
                  setHolidays(Array.from(new Set([...holidays, calendarClickDate + (calendarClickReason ? '|' + calendarClickReason : '')])));
                  setShowAddModal(false);
                  setCalendarClickDate(null);
                  setCalendarClickReason('');
                  setMessage({ type: 'success', text: 'Holiday added.' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!calendarClickDate}
              >Add</button>
            </div>
          </div>
        </div>
      )}
      {/* Remove Holiday Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-900 mb-4">Remove Holiday</h3>
            <div className="mb-4">
              <p>Are you sure you want to remove the holiday on <span className="font-mono text-blue-700">{showRemoveModal.date}</span>?</p>
              {showRemoveModal.reason && <p className="text-sm text-gray-500 mt-2">Reason: <span className="text-amber-700">{showRemoveModal.reason}</span></p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRemoveModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >Cancel</button>
              <button
                onClick={() => {
                  setHolidays(holidays.filter(h => !h.startsWith(showRemoveModal.date)));
                  setShowRemoveModal(null);
                  setMessage({ type: 'success', text: 'Holiday removed.' });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidaySettings; 