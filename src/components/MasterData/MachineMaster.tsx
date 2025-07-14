import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Machine } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Copy } from 'lucide-react';

const MachineMaster: React.FC = () => {
  const { machines, addMachine, updateMachine, deleteMachine, purchaseOrders, products, deletePurchaseOrder } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Machine & { associatedProcesses?: { productId: string; stepId: string }[] }>>({
    machineName: '',
    machineType: '',
    capacity: '',
    workingHours: 8,
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
        workingHours: formData.workingHours || 8,
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
      workingHours: 8,
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

  // When deleting a machine, also delete all POs that use this machine
  const handleDeleteMachine = (machineId: string) => {
    // Find all productIds that use this machine in their processFlow
    const affectedProductIds = products
      .filter(product => product.processFlow.some(step => step.machineId === machineId))
      .map(product => product.id);
    // Find all POs that use these products
    const affectedPOs = purchaseOrders.filter(po => affectedProductIds.includes(po.productId));
    // Delete each affected PO
    affectedPOs.forEach(po => deletePurchaseOrder(po.id));
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
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Machine
        </button>
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
                Working Hours
              </label>
              <input
                type="number"
                value={formData.workingHours}
                onChange={(e) => setFormData(prev => ({ ...prev, workingHours: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm"
                required
                min="1"
                max="24"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Timing
              </label>
              <select
                value={formData.shiftTiming}
                onChange={(e) => setFormData(prev => ({ ...prev, shiftTiming: e.target.value }))}
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

            {/* Associated Processes UI remains as previously enhanced */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Associated Processes
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  multiple
                  value={formData.associatedProcesses?.filter(ap => ap.productId && ap.stepId).map(ap => `${ap.productId}|${ap.stepId}`) || []}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    const selectedAssociations = selected.map(val => {
                      const [productId, stepId] = val.split('|');
                      return { productId, stepId };
                    });
                    // Keep manual processes
                    setFormData(prev => ({
                      ...prev,
                      associatedProcesses: [
                        ...(prev.associatedProcesses?.filter(ap => !ap.productId && ap.stepId) || []),
                        ...selectedAssociations
                      ]
                    }));
                  }}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-32"
                >
                  {products.flatMap(product =>
                    product.processFlow.map(step => (
                      <option key={product.id + '-' + step.id} value={`${product.id}|${step.id}`}>
                        {product.productName} — {step.stepName}
                      </option>
                    ))
                  )}
                </select>
                <div className="flex flex-col gap-1 w-56">
                  <input
                    type="text"
                    value={manualProcessInput}
                    onChange={e => setManualProcessInput(e.target.value)}
                    placeholder="Add manual process (e.g. Cleaning)"
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs"
                  >
                    <Plus size={14} /> Add Manual
                  </button>
                </div>
              </div>
              {/* Show all associated processes (product/step or manual) with remove option */}
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.associatedProcesses || []).map((ap, idx) => {
                  const label = ap.productId && ap.stepId
                    ? (() => {
                        const product = products.find(p => p.id === ap.productId);
                        const step = product?.processFlow.find(s => s.id === ap.stepId);
                        return product && step ? `${product.productName} — ${step.stepName}` : ap.stepId;
                      })()
                    : ap.stepId;
                  return (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold bg-cyan-50 border-cyan-200 text-cyan-700">
                      {label}
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
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select or add all processes (product & step, or manual) this machine is typically used for.</p>
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
                  Working Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift Timing
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
                      {machine.workingHours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {machine.shiftTiming}
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