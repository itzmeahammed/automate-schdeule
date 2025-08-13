import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Product, ProcessStep } from '../../types';
import { Plus, Edit2, Trash2, Save, X, ArrowRight, Copy, Download, Upload } from 'lucide-react';

const ProductMaster: React.FC = () => {
  const { products, machines, addProduct, updateProduct, deleteProduct } = useApp();
  
  // Export products to CSV
  const exportProducts = () => {
    const csvContent = [
      ['Product Name', 'Part Number', 'Drawing Number', 'Priority', 'Category', 'Description', 'Material', 'Dimensions', 'Weight', 'Tolerance', 'Estimated Cost'],
      ...products.map(product => [
        product.productName,
        product.partNumber,
        product.drawingNumber,
        product.priority,
        product.category,
        product.description,
        product.specifications.material,
        product.specifications.dimensions,
        product.specifications.weight,
        product.specifications.tolerance,
        product.estimatedCost.toString()
      ])
    ].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import products from CSV
  const importProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      const importedProducts: Partial<Product>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const product: Partial<Product> = {
          productName: values[0] || '',
          partNumber: values[1] || `PN-${Date.now()}-${i}`,
          drawingNumber: values[2] || '',
          priority: (values[3] as Product['priority']) || 'medium',
          category: values[4] || '',
          description: values[5] || '',
          specifications: {
            material: values[6] || '',
            dimensions: values[7] || '',
            weight: values[8] || '',
            tolerance: values[9] || ''
          },
          estimatedCost: parseFloat(values[10]) || 0,
          processFlow: [],
          qualityStandards: []
        };
        
        if (product.productName) {
          importedProducts.push(product);
        }
      }
      
      // Add imported products
      importedProducts.forEach(product => {
        const newProduct: Product = {
          id: crypto.randomUUID(),
          productName: product.productName || '',
          partNumber: product.partNumber || `PN-${Date.now()}`,
          drawingNumber: product.drawingNumber || '',
          processFlow: product.processFlow || [],
          priority: product.priority || 'medium',
          category: product.category || '',
          description: product.description || '',
          specifications: product.specifications || { material: '', dimensions: '', weight: '', tolerance: '' },
          qualityStandards: product.qualityStandards || [],
          estimatedCost: product.estimatedCost || 0
        };
        addProduct(newProduct);
      });
      
      alert(`Successfully imported ${importedProducts.length} products`);
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };
  
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
         <div className="flex items-center gap-3">
           <button
             onClick={exportProducts}
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
               onChange={importProducts}
               className="hidden"
             />
           </label>
           <button
             onClick={() => setIsAdding(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
           >
             <Plus size={16} />
             Add Product
           </button>
         </div>
       </div>

      {isAdding && (
        <div className="bg-white/90 rounded-xl shadow p-4 mb-6 border border-blue-100">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Product</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={e => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 text-sm shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Part Number</label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={e => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 text-sm shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 text-sm shadow-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Process Flow</label>
              <div className="space-y-2">
                {formData.processFlow?.map((step, index) => (
                  <div key={step.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-blue-50/50 rounded p-2 border border-blue-100">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Select Machine</label>
                      <select
                        value={step.machineId}
                        onChange={e => updateProcessStep(step.id, { machineId: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 text-sm shadow-sm"
                        required
                      >
                        <option value="">Select Machine</option>
                        {machines.map(machine => (
                          <option key={machine.id} value={machine.id}>{machine.machineName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Step Name</label>
                      <input
                        type="text"
                        value={step.stepName}
                        onChange={e => updateProcessStep(step.id, { stepName: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 text-sm shadow-sm"
                        placeholder="e.g. Cutting, Drilling"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Minutes</label>
                      <input
                        type="number"
                        value={step.cycleTimePerPart}
                        onChange={e => updateProcessStep(step.id, { cycleTimePerPart: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 text-sm shadow-sm"
                        min="0"
                        step="0.1"
                        required
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeProcessStep(step.id)}
                        className="text-red-600 hover:text-red-800 bg-white border border-red-200 rounded p-1 transition-colors shadow-sm"
                        title="Remove Step"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addProcessStep}
                className="mt-2 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow text-sm font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Step
              </button>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow font-bold text-base mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Add Product
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