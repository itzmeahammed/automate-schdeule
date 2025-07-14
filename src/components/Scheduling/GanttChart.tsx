import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ScheduleItem } from '../../types';
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { getAutoStatus } from '../../utils/scheduling';

interface GanttChartProps {
  scheduleItems: ScheduleItem[];
  onItemClick?: (item: ScheduleItem) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ scheduleItems, onItemClick }) => {
  const { machines, products, purchaseOrders } = useApp();
  const { holidays } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [zoomLevel, setZoomLevel] = useState(1);

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  const generateTimeSlots = () => {
    const slots = [];
    const current = new Date(rangeStart);
    const slotDuration = viewMode === 'day' ? 60 : viewMode === 'week' ? 60 * 24 : 60 * 24 * 7; // minutes

    while (current <= rangeEnd) {
      slots.push(new Date(current));
      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isHoliday = (date: Date) => holidays.includes(date.toISOString().split('T')[0]);

  const getItemPosition = (item: ScheduleItem) => {
    const itemStart = new Date(item.startDate);
    const itemEnd = new Date(item.endDate);
    const totalDuration = rangeEnd.getTime() - rangeStart.getTime();
    
    const left = ((itemStart.getTime() - rangeStart.getTime()) / totalDuration) * 100;
    const width = ((itemEnd.getTime() - itemStart.getTime()) / totalDuration) * 100;
    
    return { left: Math.max(0, left), width: Math.max(1, width) };
  };

  const getItemColor = (item: ScheduleItem) => {
    const product = products.find(p => p.id === item.productId);
    switch (product?.priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'in-progress': return 'bg-blue-600';
      case 'delayed': return 'bg-red-600';
      case 'paused': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const formatTimeSlot = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Production Gantt Chart</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {viewMode === 'day' && currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                {viewMode === 'week' && `Week of ${rangeStart.toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                {viewMode === 'month' && currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm text-gray-600 min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
        <div className="min-w-[800px]">
          {/* Time Header */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-48 p-3 border-r border-gray-200 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
              Machine / Resource
            </div>
            <div className="flex-1 flex">
              {timeSlots.map((slot: Date, index: number) => {
                const dateStr = slot.toISOString().split('T')[0];
                const holiday = isHoliday(slot);
                return (
                  <div
                    key={index}
                    className={`flex-1 p-2 border-r border-gray-200 text-xs text-center min-w-[80px] ${holiday ? 'bg-red-50 relative' : ''}`}
                    title={holiday ? 'Holiday' : ''}
                  >
                    {formatTimeSlot(slot)}
                    {holiday && (
                      <div className="absolute inset-0 bg-red-100 opacity-30 pointer-events-none" style={{zIndex:0}} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine Rows */}
          {machines.map((machine) => {
            const machineItems = scheduleItems.filter(item => item.machineId === machine.id);
            
            return (
              <div key={machine.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                <div className="w-48 p-3 border-r border-gray-200 sticky left-0 bg-white z-10">
                  <div>
                    <p className="font-medium text-gray-900">{machine.machineName}</p>
                    <p className="text-xs text-gray-500">{machine.machineType}</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        machine.status === 'active' ? 'bg-green-500' :
                        machine.status === 'maintenance' ? 'bg-amber-500' :
                        machine.status === 'breakdown' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-xs text-gray-600 capitalize">{machine.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 relative h-16 bg-white">
                  {/* Time Grid */}
                  {timeSlots.map((_, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: `${(index / timeSlots.length) * 100}%` }}
                    />
                  ))}
                  
                  {/* Schedule Items */}
                  {machineItems.map((item) => {
                    const position = getItemPosition(item);
                    const product = products.find(p => p.id === item.productId);
                    const po = purchaseOrders.find(p => p.id === item.poId);
                    // Dynamic progress calculation
                    let start = new Date(item.actualStartTime || item.startDate);
                    let end = new Date(item.actualEndTime || item.endDate);
                    let now = new Date();
                    let progress = 0;
                    if (now <= start) progress = 0;
                    else if (now >= end) progress = 100;
                    else progress = Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
                    return (
                      <div
                        key={item.id}
                        className={`absolute top-1 bottom-1 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:z-10 ${getStatusColor(item.status)}`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`,
                          minWidth: '60px'
                        }}
                        onClick={() => onItemClick?.(item)}
                        title={`${product?.productName} - ${po?.poNumber}\nStep ${item.processStep}\nDuration: ${item.allocatedTime} min\nStatus: ${item.status}`}
                      >
                        <div className="p-2 text-white text-xs h-full flex flex-col justify-center">
                          <div className="font-medium truncate">
                            {product?.productName || 'Unknown'}
                          </div>
                          <div className="text-xs opacity-90 truncate">
                            Step {item.processStep} • {item.quantity} pcs
                          </div>
                          <div className="text-xs opacity-75">
                            {item.allocatedTime}min
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 rounded-b-lg">
                          <div
                            className="h-full bg-white bg-opacity-60 rounded-b-lg transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Priority:</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-600">Urgent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600">High</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-xs text-gray-600">Medium</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">Low</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-xs text-gray-600">Completed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-xs text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-xs text-gray-600">Delayed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-600 rounded"></div>
                  <span className="text-xs text-gray-600">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Total Items: {scheduleItems.length} • 
            Machines: {machines.length} • 
            View: {viewMode} • 
            Zoom: {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;