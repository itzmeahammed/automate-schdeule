import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Machine } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Copy, Download, Upload } from 'lucide-react';

const MachineMaster: React.FC = () => {
  const { machines, addMachine, updateMachine, deleteMachine, purchaseOrders, products, deletePurchaseOrder } = useApp();
  
  // Helper function to calculate working hours from shift timing
  const calculateWorkingHoursFromShift = (shiftTiming: string): number => {
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
  };

  // Export machines to CSV
  const exportMachines = () => {
    const csvContent = [
      ['Machine Name', 'Machine Type', 'Capacity', 'Shift Timing', 'Status', 'Location', 'Efficiency (%)', 'Last Maintenance', 'Next Maintenance', 'Power (kW)'],
      ...machines.map(machine => [
        machine.machineName,
        machine.machineType,
        machine.capacity,
        machine.shiftTiming,
        machine.status,
        machine.location,
        machine.efficiency.toString(),
        machine.lastMaintenance,
        machine.nextMaintenance,
        machine.specifications.power
      ])
    ].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `machines_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import machines from CSV
  const importMachines = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const importedMachines: Partial<Machine>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const machine: Partial<Machine> = {
          machineName: values[0] || '',
          machineType: values[1] || '',
          capacity: values[2] || '',
          shiftTiming: values[3] || '09:00-17:00',
          status: (values[4] as Machine['status']) || 'active',
          location: values[5] || '',
          efficiency: parseInt(values[6]) || 100,
          lastMaintenance: values[7] || '',
          nextMaintenance: values[8] || '',
          specifications: {
            power: values[9] || '',
            dimensions: '',
            weight: ''
          },
          problems: []
        };
        
        if (machine.machineName) {
          importedMachines.push(machine);
        }
      }
      
      // Add imported machines
      importedMachines.forEach(machine => {
        const newMachine: Machine = {
          id: crypto.randomUUID(),
          machineName: machine.machineName || '',
          machineType: machine.machineType || '',
          capacity: machine.capacity || '',
          workingHours: calculateWorkingHoursFromShift(machine.shiftTiming || '09:00-17:00'),
          shiftTiming: machine.shiftTiming || '09:00-17:00',
          status: machine.status || 'active',
          location: machine.location || '',
          efficiency: machine.efficiency || 100,
          lastMaintenance: machine.lastMaintenance || '',
          nextMaintenance: machine.nextMaintenance || '',
          specifications: machine.specifications || { power: '', dimensions: '', weight: '' },
          problems: machine.problems || []
        };
        addMachine(newMachine);
      });
      
      alert(`Successfully imported ${importedMachines.length} machines`);
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Machine & { associatedProcesses?: { productId: string; stepId: string }[] }>>({
    machineName: '',
    machineType: '',
    capacity: '',
    shiftTiming: '09:00-17:00',
    status: 'active',
    location: '',
    efficiency: 100,
    lastMaintenance: '',
    nextMaintenance: '',
    specifications: {
      power: '',
      dimensions: '',
      weight: '',
    },
    problems: [],
    associatedProcesses: [], // NEW
  });
  const [manualProcessInput, setManualProcessInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMachine(editingId, formData);
      setEditingId(null);
    } else {
      const newMachine: Machine = {
        id: crypto.randomUUID(),
        machineName: formData.machineName || '',
        machineType: formData.machineType || '',
        capacity: formData.capacity || '',
                 workingHours: calculateWorkingHoursFromShift(formData.shiftTiming || '09:00-17:00'),
        shiftTiming: formData.shiftTiming || '09:00-17:00',
        status: formData.status || 'active',
        location: formData.location || '',
        efficiency: formData.efficiency || 100,
        lastMaintenance: formData.lastMaintenance || '',
        nextMaintenance: formData.nextMaintenance || '',
        operatorId: formData.operatorId,
        specifications: {
          power: formData.specifications?.power || '',
          dimensions: formData.specifications?.dimensions || '',
          weight: formData.specifications?.weight || '',
        },
        problems: formData.problems || [],
        // associatedProcesses is not part of Machine type, but can be used for UI/analytics
      };
      addMachine(newMachine);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      machineName: '',
      machineType: '',
      shiftTiming: '09:00-17:00',
      status: 'active',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (machine: Machine) => {
    setFormData(machine);
    setEditingId(machine.id);
    setIsAdding(true);
  };

  // When deleting a machine, also delete all SOs that use this machine
  const handleDeleteMachine = (machineId: string) => {
    // Find all productIds that use this machine in their processFlow
    const affectedProductIds = products
      .filter(product => product.processFlow.some(step => step.machineId === machineId))
      .map(product => product.id);
    // Find all SOs that use these products
    const affectedSOs = purchaseOrders.filter(po => affectedProductIds.includes(po.productId));
    // Delete each affected SO
    affectedSOs.forEach(po => deletePurchaseOrder(po.id));
    // Delete the machine
    deleteMachine(machineId);
  };

  const handleDuplicate = (machine: Machine) => {
    const duplicated = {
      ...machine,
      id: crypto.randomUUID(),
      machineName: machine.machineName + ' (Copy)',
    };
    setFormData(duplicated);
    setIsAdding(true);
    setEditingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-amber-100 text-amber-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
             <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-semibold text-gray-900">Machine Master</h2>
         <div className="flex items-center gap-3">
           <button
             onClick={exportMachines}
             className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
           >
             <Download size={16} />
             Export CSV
           </button>
           <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors cursor-pointer">
             <Upload size={16} />
             Import CSV
             <input
               type="file"
               accept=".csv"
               onChange={importMachines}
               className="hidden"
             />
           </label>
           <button
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
           >
             <Plus size={16} />
             Add Machine
           </button>
         </div>
       </div>

      {isAdding && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingId ? 'Edit Machine' : 'Add New Machine'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-blue-100 shadow-md">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Machine Name
              </label>
              <input
                type="text"
                value={formData.machineName}
                onChange={(e) => setFormData(prev => ({ ...prev, machineName: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Machine Type
              </label>
              <input
                type="text"
                value={formData.machineType}
                onChange={(e) => setFormData(prev => ({ ...prev, machineType: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Timing
              </label>
              <select
                value={formData.shiftTiming}
                onChange={(e) => {
                  const newShiftTiming = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    shiftTiming: newShiftTiming,
                    workingHours: calculateWorkingHoursFromShift(newShiftTiming)
                  }));
                }}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                required
              >
                <option value="09:00-17:00">09:00-17:00</option>
                <option value="08:00-16:00">08:00-16:00</option>
                <option value="16:00-00:00">16:00-00:00</option>
                <option value="00:00-08:00">00:00-08:00</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Machine['status'] }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
                <option value="idle">Idle</option>
                <option value="breakdown">Breakdown</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Efficiency (%)
              </label>
              <input
                type="number"
                value={formData.efficiency}
                onChange={(e) => setFormData(prev => ({ ...prev, efficiency: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Maintenance
              </label>
              <input
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData(prev => ({ ...prev, lastMaintenance: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Maintenance
              </label>
              <input
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
              />
            </div>

            {/* Remove Dimensions and Weight fields, keep only Power (kW) */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Power (kW)
              </label>
              <input
                type="text"
                value={formData.specifications?.power || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: {
                    power: e.target.value,
                    dimensions: '', // removed from UI, but keep for type compatibility
                    weight: '' // removed from UI, but keep for type compatibility
                  }
                }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
              />
            </div>

            {/* Associated Processes UI: Only manual entry, no suggestions or dropdowns */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Associated Processes
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={manualProcessInput}
                  onChange={e => setManualProcessInput(e.target.value)}
                  placeholder="Add process (e.g. Cleaning, Welding, etc.)"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualProcessInput.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        associatedProcesses: [
                          ...(prev.associatedProcesses || []),
                          { productId: '', stepId: manualProcessInput.trim() }
                        ]
                      }));
                      setManualProcessInput('');
                    }
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-semibold shadow"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
              {/* Show all associated processes (manual only) with remove option */}
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.associatedProcesses || []).map((ap, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold bg-cyan-50 border-cyan-200 text-cyan-700 shadow">
                    {ap.stepId}
                    <button
                      type="button"
                      className="ml-1 text-red-500 hover:text-red-700"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        associatedProcesses: (prev.associatedProcesses || []).filter((_, i) => i !== idx)
                      }))}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Add all processes (manual entry) this machine is typically used for. No suggestions, only manual input.</p>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save size={16} />
                {editingId ? 'Update' : 'Add'} Machine
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Shift Timing (Hours)
                 </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {machines.map((machine) => {
                // Find all products and process steps using this machine
                const processUsages = products.flatMap(product =>
                  product.processFlow
                    .filter(step => step.machineId === machine.id)
                    .map(step => ({ productName: product.productName, stepName: step.stepName }))
                );
                return (
                  <tr key={machine.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {machine.machineName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {machine.machineType}
                    </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {machine.shiftTiming}
                        <br />
                        <span className="text-xs text-gray-400">
                          ({calculateWorkingHoursFromShift(machine.shiftTiming)}h)
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(machine.status)}`}> 
                        {machine.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {processUsages.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {processUsages.map((usage, idx) => (
                            <li key={idx}>
                              <span className="font-semibold">{usage.productName}</span>: {usage.stepName}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(machine)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(machine)}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="Duplicate Machine"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMachine(machine.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
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
    </div>
  );
};

export default MachineMaster;