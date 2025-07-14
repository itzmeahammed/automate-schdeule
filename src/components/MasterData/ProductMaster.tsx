import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Product, ProcessStep } from '../../types';
import { Plus, Edit2, Trash2, Save, X, ArrowRight, Copy } from 'lucide-react';

const ProductMaster: React.FC = () => {
  const { products, machines, addProduct, updateProduct, deleteProduct } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    productName: '',
    partNumber: '',
    drawingNumber: '',
    processFlow: [],
    priority: 'medium',
    category: '',
    description: '',
    specifications: {
      material: '',
      dimensions: '',
      weight: '',
      tolerance: '',
    },
    qualityStandards: [],
    estimatedCost: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, formData);
      setEditingId(null);
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        productName: formData.productName || '',
        partNumber: formData.partNumber || `PN-${Date.now()}`,
        drawingNumber: formData.drawingNumber || '',
        processFlow: formData.processFlow || [],
        priority: formData.priority || 'medium',
        category: formData.category || '',
        description: formData.description || '',
        specifications: {
          material: formData.specifications?.material || '',
          dimensions: formData.specifications?.dimensions || '',
          weight: formData.specifications?.weight || '',
          tolerance: formData.specifications?.tolerance || '',
        },
        qualityStandards: formData.qualityStandards || [],
        estimatedCost: formData.estimatedCost || 0,
      };
      addProduct(newProduct);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      partNumber: '',
      processFlow: [],
      priority: 'medium',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleDuplicate = (product: Product) => {
    // Remove id and generate a new one, optionally tweak part number
    const duplicated = {
      ...product,
      id: crypto.randomUUID(),
      partNumber: product.partNumber + '-COPY',
      productName: product.productName + ' (Copy)',
    };
    setFormData(duplicated);
    setIsAdding(true);
    setEditingId(null);
  };

  const addProcessStep = () => {
    const newStep: ProcessStep = {
      id: crypto.randomUUID(),
      machineId: '',
      cycleTimePerPart: 0,
      sequence: (formData.processFlow?.length || 0) + 1,
      stepName: '',
      setupTime: 0,
      isOutsourced: false,
      qualityCheckRequired: false,
      toolsRequired: [],
      preferredMachines: [], // NEW
    };
    setFormData(prev => ({
      ...prev,
      processFlow: [...(prev.processFlow || []), newStep]
    }));
  };

  const updateProcessStep = (stepId: string, updates: Partial<ProcessStep>) => {
    setFormData(prev => ({
      ...prev,
      processFlow: prev.processFlow?.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      ) || []
    }));
  };

  const removeProcessStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      processFlow: prev.processFlow?.filter(step => step.id !== stepId) || []
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Product Master</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part Number
                </label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Product['priority'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Process Flow
                </label>
                <button
                  type="button"
                  onClick={addProcessStep}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus size={14} />
                  Add Step
                </button>
              </div>

              <div className="space-y-3">
                {formData.processFlow?.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 bg-white rounded-md border border-gray-200">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <select
                        value={step.machineId}
                        onChange={(e) => updateProcessStep(step.id, { machineId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Machine</option>
                        {machines.map(machine => (
                          <option key={machine.id} value={machine.id}>
                            {machine.machineName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preferred Machines Multi-Select */}
                    <div className="w-48">
                      <label className="block text-xs text-gray-500 mb-1">Preferred Machines</label>
                      <select
                        multiple
                        value={step.preferredMachines || []}
                        onChange={e => {
                          const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                          updateProcessStep(step.id, { preferredMachines: selected });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs h-20"
                      >
                        {machines.map(machine => (
                          <option key={machine.id} value={machine.id}>
                            {machine.machineName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        value={step.cycleTimePerPart}
                        onChange={(e) => updateProcessStep(step.id, { cycleTimePerPart: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Cycle time"
                        min="0"
                        step="0.1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">minutes</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProcessStep(step.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>

                    {index < (formData.processFlow?.length || 0) - 1 && (
                      <ArrowRight size={16} className="text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              {editingId ? 'Update' : 'Add'} Product
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process Steps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.partNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.processFlow.length} steps
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(product.priority)}`}>
                      {product.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="text-emerald-600 hover:text-emerald-800"
                        title="Duplicate Product"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductMaster;