import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AlertTriangle, CheckCircle, X, Filter, Search, Clock, Wrench, Package, Zap } from 'lucide-react';
import { Alert, ScheduleItem } from '../../types';
import { optimizeSchedule } from '../../utils/scheduling';

const Alerts: React.FC = () => {
  const { alerts, resolveAlert, setAlerts, updatePurchaseOrder, updateMachine, machines, purchaseOrders, addSystemNotification, products } = useApp();
  const { setScheduleItems, scheduleItems } = useApp();
  // Helper: Calculate current load for a machine
  const getMachineLoad = (machineId: string) => {
    return scheduleItems.filter(item => item.machineId === machineId).reduce((sum, item) => sum + (item.allocatedTime || 0), 0);
  };
  // Helper: Get machine capacity (assume workingHours * 60 for minutes per day)
  const getMachineCapacity = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? (machine.workingHours || 8) * 60 : 480;
  };
  // Helper: Get job details
  const getJobDetails = (item: ScheduleItem) => {
    const product = products.find(p => p.id === item.productId);
    const step = product?.processFlow.find(s => s.machineId === item.machineId && s.sequence === item.processStep);
    return step ? `${step.stepName} (${step.cycleTimePerPart}min/part)` : `Step ${item.processStep}`;
  };
  // State for selected jobs and error
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [redistributeError, setRedistributeError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'delivery_risk' | 'machine_breakdown' | 'quality_issue' | 'capacity_overload'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState<{ open: boolean, poId: string }>({ open: false, poId: '' });
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<{ open: boolean, machineId: string }>({ open: false, machineId: '' });
  const [newMaintenanceDate, setNewMaintenanceDate] = useState('');
  const [showRedistributeModal, setShowRedistributeModal] = useState<{ open: boolean, machineId: string }>({ open: false, machineId: '' });

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unresolved' && !alert.isResolved) ||
                         alert.type === filter;
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSeverity && matchesSearch;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'delivery_risk': return <Clock size={20} className="text-red-500" />;
      case 'machine_breakdown': return <Wrench size={20} className="text-amber-500" />;
      case 'quality_issue': return <Package size={20} className="text-purple-500" />;
      case 'capacity_overload': return <Zap size={20} className="text-orange-500" />;
      default: return <AlertTriangle size={20} className="text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-red-600 bg-red-50';
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-amber-500 bg-amber-50';
      case 'low': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const resolveAllAlerts = () => {
    alerts.forEach(alert => {
      if (!alert.isResolved) {
        resolveAlert(alert.id);
      }
    });
  };

  const clearResolvedAlerts = () => {
    setAlerts(alerts.filter((a: Alert) => !a.isResolved));
  };

  const unresolvedCount = alerts.filter(a => !a.isResolved).length;
  const criticalCount = alerts.filter(a => !a.isResolved && (a.severity === 'critical' || a.severity === 'high')).length;

  // Action handlers
  const handleReschedulePO = (poId: string) => {
    if (!newDeliveryDate) return;
    updatePurchaseOrder(poId, { deliveryDate: newDeliveryDate });
    addSystemNotification('info', 'PO Rescheduled', `PO #${purchaseOrders.find(po => po.id === poId)?.poNumber} rescheduled to ${newDeliveryDate}`);
    setShowRescheduleModal({ open: false, poId: '' });
    setNewDeliveryDate('');
    // Mark related alert as resolved
    setAlerts(alerts.map((alert: Alert) => alert.affectedEntities.includes(poId) && alert.type === 'delivery_risk' ? { ...alert, isResolved: true } : alert));
  };
  const handleScheduleMaintenance = (machineId: string) => {
    if (!newMaintenanceDate) return;
    updateMachine(machineId, { status: 'maintenance', nextMaintenance: newMaintenanceDate });
    addSystemNotification('info', 'Maintenance Scheduled', `Maintenance for machine ${machines.find(m => m.id === machineId)?.machineName} scheduled on ${newMaintenanceDate}`);
    setShowMaintenanceModal({ open: false, machineId: '' });
    setNewMaintenanceDate('');
    setAlerts(alerts.map((alert: Alert) => alert.affectedEntities.includes(machineId) && alert.type === 'machine_breakdown' ? { ...alert, isResolved: true } : alert));
  };
  const handleRedistributeJobs = (machineId: string) => {
    // For demo: just mark alert as resolved and show notification
    addSystemNotification('info', 'Jobs Redistributed', `Jobs for machine ${machines.find(m => m.id === machineId)?.machineName} have been redistributed.`);
    setShowRedistributeModal({ open: false, machineId: '' });
    setAlerts(alerts.map((alert: Alert) => alert.affectedEntities.includes(machineId) && alert.type === 'capacity_overload' ? { ...alert, isResolved: true } : alert));
  };

  // Calculate total time to move
  const totalTimeToMove = scheduleItems.filter(item => selectedJobIds.includes(item.id)).reduce((sum, item) => sum + (item.allocatedTime || 0), 0);
  const newMachineLoad = newMaintenanceDate ? getMachineLoad(newMaintenanceDate) + totalTimeToMove : 0;
  const newMachineCapacity = newMaintenanceDate ? getMachineCapacity(newMaintenanceDate) : 0;
  const willOverload = newMachineCapacity > 0 && newMachineLoad > newMachineCapacity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Critical Alerts</h1>
                <p className="text-gray-600">
                  {unresolvedCount > 0 ? (
                    <>
                      {unresolvedCount} unresolved alerts
                      {criticalCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          {criticalCount} critical
                        </span>
                      )}
                    </>
                  ) : (
                    'All alerts resolved'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {unresolvedCount > 0 && (
                <button
                  onClick={resolveAllAlerts}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Resolve All
                </button>
              )}
              <button
                onClick={clearResolvedAlerts}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Resolved
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Filter size={20} className="text-gray-400" />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                {['all', 'unresolved', 'delivery_risk', 'machine_breakdown', 'quality_issue', 'capacity_overload'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === filterType
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterType.replace('_', ' ').charAt(0).toUpperCase() + filterType.replace('_', ' ').slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Severity:</span>
                {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setSeverityFilter(severity as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      severityFilter === severity
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'All systems are running smoothly!'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl shadow-sm border-l-4 ${getSeverityColor(alert.severity)} ${
                  alert.isResolved ? 'opacity-60' : ''
                } transition-all duration-200 hover:shadow-md`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {alert.isResolved && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {alert.message}
                        </h4>
                        
                        {alert.suggestedActions.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Suggested Actions:</p>
                            <ul className="space-y-1">
                              {alert.suggestedActions.map((action, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {alert.affectedEntities.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Affected:</p>
                            <div className="flex flex-wrap gap-2">
                              {alert.affectedEntities.map((entity, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {entity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Dynamic Action Buttons */}
                        {!alert.isResolved && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {alert.type === 'delivery_risk' && (
                              <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                onClick={() => setShowRescheduleModal({ open: true, poId: alert.affectedEntities[0] })}
                              >
                                Reschedule PO
                              </button>
                            )}
                            {alert.type === 'machine_breakdown' && (
                              <button
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                                onClick={() => setShowMaintenanceModal({ open: true, machineId: alert.affectedEntities[0] })}
                              >
                                Schedule Maintenance
                              </button>
                            )}
                            {alert.type === 'capacity_overload' && (
                              <button
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                                onClick={() => setShowRedistributeModal({ open: true, machineId: alert.affectedEntities[0] })}
                              >
                                Redistribute Jobs
                              </button>
                            )}
                            <button
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Mark Resolved
                            </button>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.isResolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete alert"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Modals for actions */}
        {showRescheduleModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-blue-300 animate-fade-in">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Reschedule PO</h3>
              <input
                type="date"
                value={newDeliveryDate}
                onChange={e => setNewDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-4 justify-end">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  onClick={() => handleReschedulePO(showRescheduleModal.poId)}
                >
                  Confirm
                </button>
                <button
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                  onClick={() => setShowRescheduleModal({ open: false, poId: '' })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showMaintenanceModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-amber-300 animate-fade-in">
              <h3 className="text-xl font-bold mb-4 text-amber-700">Schedule Maintenance</h3>
              <input
                type="date"
                value={newMaintenanceDate}
                onChange={e => setNewMaintenanceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-4 justify-end">
                <button
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
                  onClick={() => handleScheduleMaintenance(showMaintenanceModal.machineId)}
                >
                  Confirm
                </button>
                <button
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                  onClick={() => setShowMaintenanceModal({ open: false, machineId: '' })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showRedistributeModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-orange-300 animate-fade-in">
              <h3 className="text-xl font-bold mb-4 text-orange-700">Redistribute Jobs</h3>
              <p className="mb-2">Select jobs to redistribute and a new machine.</p>
              {/* List jobs for this machine */}
              <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {scheduleItems.filter(item => item.machineId === showRedistributeModal.machineId).length === 0 ? (
                  <div className="text-gray-400 text-sm">No jobs found for this machine.</div>
                ) : (
                  scheduleItems.filter(item => item.machineId === showRedistributeModal.machineId).map(item => (
                    <label key={item.id} className="flex items-center gap-2 mb-1 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedJobIds.includes(item.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedJobIds(ids => [...ids, item.id]);
                          else setSelectedJobIds(ids => ids.filter(id => id !== item.id));
                        }}
                      />
                      <span>PO #{purchaseOrders.find(po => po.id === item.poId)?.poNumber || 'N/A'} | {getJobDetails(item)} | {item.quantity} pcs | {item.startDate.slice(0,10)} - {item.endDate.slice(0,10)} | {item.allocatedTime} min</span>
                    </label>
                  ))
                )}
              </div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                value={newMaintenanceDate} // reuse state for selected machineId
                onChange={e => setNewMaintenanceDate(e.target.value)}
              >
                <option value="">Select Machine</option>
                {machines.filter(m => m.id !== showRedistributeModal.machineId && m.status === 'active').map(m => {
                  const load = getMachineLoad(m.id);
                  const capacity = getMachineCapacity(m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.machineName} (Load: {load} min / {capacity} min)
                    </option>
                  );
                })}
              </select>
              {newMaintenanceDate && (
                <div className={`mb-2 text-sm ${willOverload ? 'text-red-600' : 'text-green-700'}`}>
                  {willOverload
                    ? `Warning: This machine will be overloaded (${newMachineLoad} min > ${newMachineCapacity} min)`
                    : `Projected load after move: ${newMachineLoad} min / ${newMachineCapacity} min`}
                </div>
              )}
              {redistributeError && <div className="text-red-600 text-sm mb-2">{redistributeError}</div>}
              <div className="flex gap-4 justify-end">
                <button
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                  onClick={() => {
                    // Update all schedule items for the old machine to the new machine
                    const oldMachineId = showRedistributeModal.machineId;
                    const newMachineId = newMaintenanceDate;
                    if (!newMachineId) {
                      setRedistributeError('Please select a machine.');
                      return;
                    }
                    if (selectedJobIds.length === 0) {
                      setRedistributeError('Please select at least one job to redistribute.');
                      return;
                    }
                    if (willOverload) {
                      setRedistributeError('Cannot redistribute: selected machine will be overloaded.');
                      return;
                    }
                    setRedistributeError('');
                    setScheduleItems(scheduleItems.map(item =>
                      selectedJobIds.includes(item.id) ? { ...item, machineId: newMachineId } : item
                    ));
                    addSystemNotification('info', 'Jobs Redistributed', `Selected jobs from ${machines.find(m => m.id === oldMachineId)?.machineName} moved to ${machines.find(m => m.id === newMachineId)?.machineName}.`);
                    setShowRedistributeModal({ open: false, machineId: '' });
                    setNewMaintenanceDate('');
                    setSelectedJobIds([]);
                    // Mark alert as resolved
                    setAlerts(alerts.map((alert: Alert) => alert.affectedEntities.includes(oldMachineId) && alert.type === 'capacity_overload' ? { ...alert, isResolved: true } : alert));
                    // Auto-optimize schedule after redistribution
                    setTimeout(() => {
                      setScheduleItems(optimizeSchedule(scheduleItems.map(item =>
                        selectedJobIds.includes(item.id) ? { ...item, machineId: newMachineId } : item
                      ), machines, products));
                    }, 100);
                  }}
                >
                  Confirm
                </button>
                <button
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                  onClick={() => {
                    setShowRedistributeModal({ open: false, machineId: '' });
                    setSelectedJobIds([]);
                    setRedistributeError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;