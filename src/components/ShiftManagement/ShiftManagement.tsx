import React, { useState } from 'react';
import { Shift, BreakTime } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { Clock, Plus, Trash2, Edit2, Save, X, Coffee, Utensils, Settings, Calendar, Users, Power, PowerOff } from 'lucide-react';

const ShiftManagement: React.FC = () => {
  const { shifts, setShifts } = useApp();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Shift>>({
    shiftName: '',
    timing: {
      startTime: '09:00',
      endTime: '17:00',
      allowFlexibleTiming: false,
      overtimeAllowed: false,
      maxOvertimeHours: 2
    },
    breakTimes: [],
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isActive: true,
    color: '#3B82F6'
  });

  const defaultBreakTemplates = [
    { name: 'Morning Break', type: 'short_break' as const, duration: 15, start: '10:30', end: '10:45' },
    { name: 'Lunch Break', type: 'lunch' as const, duration: 60, start: '12:30', end: '13:30' },
    { name: 'Afternoon Break', type: 'tea_break' as const, duration: 15, start: '15:30', end: '15:45' }
  ];

  const addBreak = (template?: typeof defaultBreakTemplates[0]) => {
    const newBreak: BreakTime = {
      id: crypto.randomUUID(),
      name: template?.name || 'New Break',
      start: template?.start || '12:00',
      end: template?.end || '12:30',
      duration: template?.duration || 30,
      type: template?.type || 'custom',
      isPaid: template?.type === 'lunch' ? false : true,
      isFlexible: false,
      description: ''
    };

    setFormData(prev => ({
      ...prev,
      breakTimes: [...(prev.breakTimes || []), newBreak]
    }));
  };

  const updateBreak = (breakId: string, updates: Partial<BreakTime>) => {
    setFormData(prev => ({
      ...prev,
      breakTimes: prev.breakTimes?.map(b => 
        b.id === breakId ? { ...b, ...updates } : b
      ) || []
    }));
  };

  const removeBreak = (breakId: string) => {
    setFormData(prev => ({
      ...prev,
      breakTimes: prev.breakTimes?.filter(b => b.id !== breakId) || []
    }));
  };

  const handleSubmit = () => {
    if (!formData.shiftName || !formData.timing) return;

    const newShift: Shift = {
      id: isEditing || crypto.randomUUID(),
      shiftName: formData.shiftName,
      timing: formData.timing,
      breakTimes: formData.breakTimes || [],
      workingDays: formData.workingDays || [],
      isActive: formData.isActive ?? true,
      color: formData.color || '#3B82F6',
      description: formData.description,
      // Legacy support
      startTime: formData.timing.startTime,
      endTime: formData.timing.endTime
    };

    if (isEditing) {
      setShifts(shifts.map(s => s.id === isEditing ? newShift : s));
    } else {
      setShifts([...shifts, newShift]);
    }

    resetForm();
  };

  const toggleShiftStatus = (shiftId: string) => {
    setShifts(shifts.map(shift => 
      shift.id === shiftId 
        ? { ...shift, isActive: !shift.isActive }
        : shift
    ));
  };

  const deleteShift = (shiftId: string) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      setShifts(shifts.filter(shift => shift.id !== shiftId));
    }
  };

  const resetForm = () => {
    setFormData({
      shiftName: '',
      timing: {
        startTime: '09:00',
        endTime: '17:00',
        allowFlexibleTiming: false,
        overtimeAllowed: false,
        maxOvertimeHours: 2
      },
      breakTimes: [],
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      isActive: true,
      color: '#3B82F6'
    });
    setIsEditing(null);
    setShowAddForm(false);
  };

  const editShift = (shift: Shift) => {
    setFormData({
      ...shift,
      timing: shift.timing || {
        startTime: shift.startTime || '09:00',
        endTime: shift.endTime || '17:00',
        allowFlexibleTiming: false,
        overtimeAllowed: false,
        maxOvertimeHours: 2
      }
    });
    setIsEditing(shift.id);
    setShowAddForm(true);
  };

  const getBreakIcon = (type: string) => {
    switch (type) {
      case 'lunch': return <Utensils size={16} />;
      case 'tea_break': 
      case 'short_break': return <Coffee size={16} />;
      case 'maintenance': return <Settings size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shift Management</h1>
            <p className="text-gray-600 text-lg">Configure work shifts, timing, and break schedules</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{shifts.filter(s => s.isActive).length} Active Shifts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>{shifts.filter(s => !s.isActive).length} Inactive Shifts</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus size={18} />
            Add New Shift
          </button>
        </div>

      {/* Shift Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Edit Shift' : 'Add New Shift'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Name
                </label>
                <input
                  type="text"
                  value={formData.shiftName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shiftName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Morning Shift"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.timing?.startTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      timing: { ...prev.timing!, startTime: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.timing?.endTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      timing: { ...prev.timing!, endTime: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="flexibleTiming"
                  checked={formData.timing?.allowFlexibleTiming}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timing: { ...prev.timing!, allowFlexibleTiming: e.target.checked }
                  }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="flexibleTiming" className="text-sm font-medium text-gray-700">
                  Allow Flexible Timing
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="overtimeAllowed"
                  checked={formData.timing?.overtimeAllowed}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    timing: { ...prev.timing!, overtimeAllowed: e.target.checked }
                  }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="overtimeAllowed" className="text-sm font-medium text-gray-700">
                  Allow Overtime
                </label>
              </div>

              {formData.timing?.overtimeAllowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Overtime Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={formData.timing.maxOvertimeHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      timing: { ...prev.timing!, maxOvertimeHours: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.workingDays?.includes(day as any)}
                        onChange={(e) => {
                          const days = formData.workingDays || [];
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              workingDays: [...days, day as any]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              workingDays: days.filter(d => d !== day)
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Break Management */}
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-gray-900">Break Schedule</h4>
              <div className="flex gap-2">
                {defaultBreakTemplates.map(template => (
                  <button
                    key={template.name}
                    onClick={() => addBreak(template)}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    {getBreakIcon(template.type)}
                    {template.name}
                  </button>
                ))}
                <button
                  onClick={() => addBreak()}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                >
                  <Plus size={14} />
                  Custom
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {formData.breakTimes?.map(breakTime => (
                <div key={breakTime.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getBreakIcon(breakTime.type)}
                    <input
                      type="text"
                      value={breakTime.name}
                      onChange={(e) => updateBreak(breakTime.id, { name: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Break name"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={breakTime.start}
                      onChange={(e) => updateBreak(breakTime.id, { start: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={breakTime.end}
                      onChange={(e) => updateBreak(breakTime.id, { end: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <select
                    value={breakTime.type}
                    onChange={(e) => updateBreak(breakTime.id, { type: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="short_break">Short Break</option>
                    <option value="lunch">Lunch</option>
                    <option value="tea_break">Tea Break</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="custom">Custom</option>
                  </select>

                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={breakTime.isPaid}
                      onChange={(e) => updateBreak(breakTime.id, { isPaid: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Paid
                  </label>

                  <button
                    onClick={() => removeBreak(breakTime.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={16} />
              {isEditing ? 'Update' : 'Create'} Shift
            </button>
          </div>
        </div>
      )}

        {/* Shifts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {shifts.map(shift => (
            <div key={shift.id} className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all duration-300 hover:shadow-xl ${
              shift.isActive ? 'border-green-200 hover:border-green-300' : 'border-gray-200 hover:border-gray-300 opacity-75'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: shift.color }}
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{shift.shiftName}</h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {shift.timing?.startTime || shift.startTime} - {shift.timing?.endTime || shift.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleShiftStatus(shift.id)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      shift.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={shift.isActive ? 'Deactivate shift' : 'Activate shift'}
                  >
                    {shift.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                  <button
                    onClick={() => editShift(shift)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Edit shift"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteShift(shift.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete shift"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                  shift.isActive 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    shift.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  {shift.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <Calendar size={14} />
                  <span className="font-medium">
                    {shift.workingDays?.map(day => day.charAt(0).toUpperCase()).join(', ') || 'Mon-Fri'}
                  </span>
                </div>

                {shift.breakTimes && shift.breakTimes.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Coffee size={14} />
                      Break Schedule
                    </p>
                    <div className="space-y-2">
                      {shift.breakTimes.map(breakTime => (
                        <div key={breakTime.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            {getBreakIcon(breakTime.type)}
                            <span className="font-medium">{breakTime.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">
                              {breakTime.start} - {breakTime.end}
                            </span>
                            {breakTime.isPaid && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                Paid
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {shift.timing?.allowFlexibleTiming && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      <Clock size={12} />
                      <span>Flexible</span>
                    </div>
                  )}

                  {shift.timing?.overtimeAllowed && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      <Users size={12} />
                      <span>OT: {shift.timing.maxOvertimeHours}h</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {shifts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <Clock size={48} className="mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts configured</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first shift to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Your First Shift
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
