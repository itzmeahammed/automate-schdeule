import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { getDashboardMetrics, generateAlerts, getPOTimeProgress, getAutoPOStatus } from '../../utils/scheduling';
import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  DollarSign,
  Award,
  Activity,
  Settings,
  RefreshCw,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, Machine } from '../../types';

const Dashboard: React.FC = () => {
  let { purchaseOrders, scheduleItems, machines, products, user, setAlerts } = useApp();
  purchaseOrders = purchaseOrders || [];
  scheduleItems = scheduleItems || [];
  machines = machines || [];
  products = products || [];
  const [metrics, setMetrics] = useState(getDashboardMetrics(purchaseOrders, scheduleItems, machines));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
    const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [productFilter, setProductFilter] = useState<string>('');
  const [machineFilter, setMachineFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [poNumberFilter, setPONumberFilter] = useState<string>('');

  useEffect(() => {
    const newMetrics = getDashboardMetrics(purchaseOrders, scheduleItems, machines);
    setMetrics(newMetrics);
    
    // Generate and update alerts
    const newAlerts = generateAlerts(purchaseOrders, machines, scheduleItems);
    setAlerts(newAlerts);
  }, [purchaseOrders, scheduleItems, machines, products, setAlerts]);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newMetrics = getDashboardMetrics(purchaseOrders, scheduleItems, machines);
    setMetrics(newMetrics);
    setIsRefreshing(false);
  };

  const resetFilters = () => {
    setProductFilter('');
    setMachineFilter('');
    setStatusFilter('');
    setPONumberFilter('');
    setTimeRange('today');
  };

  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    suffix?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
    description?: string;
  }> = ({ title, value, icon: Icon, color, suffix = '', trend, trendValue, description }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-green-100 text-green-800' :
            trend === 'down' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {trend === 'up' ? <ArrowUp size={12} /> : 
             trend === 'down' ? <ArrowDown size={12} /> : 
             <Minus size={12} />}
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMachineStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'breakdown': return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filtered data
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const productMatch = !productFilter || po.productId === productFilter;
    const statusMatch = !statusFilter || getAutoPOStatus(po, scheduleItems) === statusFilter;
    const poNumberMatch = !poNumberFilter || po.poNumber.toLowerCase().includes(poNumberFilter.toLowerCase());
    return productMatch && statusMatch && poNumberMatch;
  });
  const filteredMachines = machines.filter(machine => {
    const machineMatch = !machineFilter || machine.id === machineFilter;
    return machineMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Production Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}! Here's your manufacturing overview</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Dashboard Filters */}
        <div className="sticky top-0 z-30 mb-8 w-full">
          <div className="bg-white rounded-xl shadow border border-blue-100 px-4 py-2 flex flex-wrap gap-3 items-end min-h-[48px] w-full">
            <div className="flex flex-col min-w-[120px] flex-1">
              <label className="block text-[11px] font-semibold text-blue-700 mb-0.5 flex items-center gap-1"><Package size={12} /> Product</label>
              <select
                value={productFilter}
                onChange={e => setProductFilter(e.target.value)}
                className="px-2 py-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm text-xs"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.productName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] flex-1">
              <label className="block text-[11px] font-semibold text-blue-700 mb-0.5 flex items-center gap-1"><Activity size={12} /> Machine</label>
              <select
                value={machineFilter}
                onChange={e => setMachineFilter(e.target.value)}
                className="px-2 py-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm text-xs"
              >
                <option value="">All Machines</option>
                {machines.map(machine => (
                  <option key={machine.id} value={machine.id}>{machine.machineName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] flex-1">
              <label className="block text-[11px] font-semibold text-blue-700 mb-0.5 flex items-center gap-1"><Calendar size={12} /> Time Range</label>
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
                className="px-2 py-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm text-xs"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] flex-1">
              <label className="block text-[11px] font-semibold text-blue-700 mb-0.5 flex items-center gap-1"><CheckCircle size={12} /> Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2 py-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm text-xs"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="delayed">Delayed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex flex-col min-w-[140px] flex-1">
              <label className="block text-[11px] font-semibold text-blue-700 mb-0.5 flex items-center gap-1"><Package size={12} /> PO Number</label>
              <input
                type="text"
                value={poNumberFilter}
                onChange={e => setPONumberFilter(e.target.value)}
                placeholder="Search PO #"
                className="px-2 py-1 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/50 text-gray-900 font-medium shadow-sm text-xs"
              />
            </div>
            <div className="flex flex-col min-w-[100px] flex-1 items-end justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition-all text-xs"
                style={{ minWidth: 80 }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <MetricCard
            title="Total Orders"
            value={metrics.totalOrders}
            icon={Package}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            trend="up"
            trendValue={12}
            description="Active production orders"
          />
          <MetricCard
            title="On-Time Delivery"
            value={metrics.onTimeOrders}
            icon={CheckCircle}
            color="bg-gradient-to-br from-green-500 to-green-600"
            trend="up"
            trendValue={8}
            description="Completed on schedule"
          />
          <MetricCard
            title="Delayed Orders"
            value={metrics.delayedOrders}
            icon={AlertTriangle}
            color="bg-gradient-to-br from-red-500 to-red-600"
            trend="down"
            trendValue={5}
            description="Behind schedule"
          />
          <MetricCard
            title="Machine Utilization"
            value={metrics.machineUtilization.toFixed(1)}
            icon={Activity}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            suffix="%"
            trend="up"
            trendValue={3}
            description="Overall efficiency"
          />
          <MetricCard
            title="Daily Revenue"
            value={`$${(metrics.revenue / 1000).toFixed(1)}K`}
            icon={DollarSign}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            trend="up"
            trendValue={15}
            description="Today's earnings"
          />
          <MetricCard
            title="Quality Score"
            value={metrics.qualityScore.toFixed(1)}
            icon={Award}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
            suffix="%"
            trend="neutral"
            trendValue={0}
            description="Quality metrics"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h3>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Last 7 days</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredPurchaseOrders.slice(0, 6).map((po) => {
                  const product = products.find(p => p.id === po.productId);
                  const poStatus = getAutoPOStatus(po, scheduleItems);
                  let progress = 0;
                  if (poStatus === 'completed') {
                    progress = 100;
                  } else {
                    const poScheduleItems = scheduleItems.filter(item => item.poId === po.id);
                    const currentItem = poScheduleItems.find(item => item.status === 'in-progress' || item.status === 'paused');
                    if (currentItem) {
                      progress = getPOTimeProgress(po.id, scheduleItems);
                    } else if (poScheduleItems.length > 0 && poScheduleItems.every(item => item.status === 'completed')) {
                      progress = 100;
                    }
                  }

                  console.log(`PO #${po.poNumber} - Status: ${poStatus}, Progress: ${progress}`);
                  return (
                    <div key={po.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-500">
                          <Package size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{po.poNumber}</p>
                          <p className="text-sm text-gray-600 cursor-pointer hover:underline" onClick={() => { if (product) setSelectedProduct(product); }}>{product?.productName || 'Unknown Product'}</p>
                          <p className="text-xs text-gray-500">Qty: {po.quantity} • Due: {new Date(po.deliveryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(poStatus)}`}> {poStatus} </span>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${ progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : progress > 0 ? 'bg-yellow-500' : 'bg-gray-300' }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Machine Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Machine Status</h3>
                <div className="flex items-center space-x-2">
                  <Activity size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Live</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredMachines.map((machine) => {
                  const problems = Array.isArray(machine.problems) ? machine.problems : [];
                  return (
                  <div key={machine.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{machine.machineName}</p>
                        <p className="text-sm text-gray-600 cursor-pointer hover:underline" onClick={() => setSelectedMachine(machine)}>{machine.machineName}</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getMachineStatusColor(machine.status)}`}>
                        {machine.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Efficiency</span>
                        <span className="font-medium text-gray-900">{machine.efficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${machine.efficiency}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>Shift: {machine.shiftTiming}</span>
                        <span>Location: {machine.location}</span>
                      </div>
                        {problems.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-xs text-red-600 font-medium">Issues:</p>
                            {problems.slice(0, 2).map((problem, index) => (
                            <p key={index} className="text-xs text-red-600">• {problem}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Production Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Efficiency Trends */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Production Efficiency</h3>
                <BarChart3 size={20} className="text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Efficiency</span>
                  <span className="text-lg font-bold text-gray-900">{metrics.efficiency.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.efficiency}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{metrics.completedToday}</p>
                    <p className="text-sm text-blue-600">Completed Today</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{metrics.pendingOrders}</p>
                    <p className="text-sm text-green-600">Pending Orders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 group"
                  onClick={() => navigate('/purchase-orders')}
                >
                  <Package size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">New Order</p>
                </button>
                
                <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 group"
                  onClick={() => navigate('/scheduling')}
                >
                  <Calendar size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Schedule</p>
                </button>
                
                <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 group"
                  onClick={() => navigate('/reports')}
                >
                  <BarChart3 size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Reports</p>
                </button>
                
                <button className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 group"
                  onClick={() => navigate('/master-data')}
                >
                  <Settings size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium">Settings</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border-4 border-blue-200 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-blue-900">Product Details</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-blue-600 text-2xl">×</button>
            </div>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedProduct.productName}</h3>
                    <p className="text-sm text-gray-500 mb-1">Part Number: <b>{selectedProduct.partNumber}</b></p>
                    <p className="text-sm text-gray-500 mb-1">Category: {selectedProduct.category}</p>
                    <p className="text-sm text-gray-500 mb-1">Priority: <span className="font-semibold capitalize">{selectedProduct.priority}</span></p>
                    <p className="text-sm text-gray-500 mb-1">Description: {selectedProduct.description}</p>
                    <p className="text-sm text-gray-500 mb-1">Estimated Cost: ${selectedProduct.estimatedCost}</p>
                    <p className="text-sm text-gray-500 mb-1">Quality Standards: {selectedProduct.qualityStandards?.join(', ')}</p>
                    <div className="mt-2">
                      <h4 className="font-semibold text-gray-700 mb-1">Specifications</h4>
                      <ul className="text-xs text-gray-600 list-disc ml-5">
                        {Object.entries(selectedProduct.specifications || {}).map(([k, v]) => (
                          <li key={k}><b>{k}:</b> {v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700 mb-2">Process Flow</h4>
                    <ol className="list-decimal ml-5 text-xs text-gray-700">
                      {selectedProduct.processFlow?.map((step, idx) => (
                        <li key={step.id} className="mb-1">
                          <b>Step {idx + 1}:</b> {step.stepName} (Machine: {machines.find(m => m.id === step.machineId)?.machineName || 'N/A'})<br/>
                          <span className="text-gray-500">Cycle Time: {step.cycleTimePerPart} min, Setup: {step.setupTime} min</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Machine Details Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border-4 border-purple-200 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-purple-900">Machine Details</h2>
              <button onClick={() => setSelectedMachine(null)} className="text-gray-400 hover:text-purple-600 text-2xl">×</button>
            </div>
            {selectedMachine && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedMachine.machineName}</h3>
                    <p className="text-sm text-gray-500 mb-1">Type: {selectedMachine.machineType}</p>
                    <p className="text-sm text-gray-500 mb-1">Status: <span className="capitalize font-semibold">{selectedMachine.status}</span></p>
                    <p className="text-sm text-gray-500 mb-1">Location: {selectedMachine.location}</p>
                    <p className="text-sm text-gray-500 mb-1">Shift Timing: {selectedMachine.shiftTiming}</p>
                    <p className="text-sm text-gray-500 mb-1">Efficiency: {selectedMachine.efficiency}%</p>
                    <p className="text-sm text-gray-500 mb-1">Last Maintenance: {selectedMachine.lastMaintenance}</p>
                    <p className="text-sm text-gray-500 mb-1">Next Maintenance: {selectedMachine.nextMaintenance}</p>
                    <div className="mt-2">
                      <h4 className="font-semibold text-gray-700 mb-1">Specifications</h4>
                      <ul className="text-xs text-gray-600 list-disc ml-5">
                        {Object.entries(selectedMachine.specifications || {}).map(([k, v]) => (
                          <li key={k}><b>{k}:</b> {v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700 mb-2">Problems</h4>
                    <ul className="text-xs text-red-600 list-disc ml-5">
                      {(selectedMachine.problems || []).length > 0 ? (
                        selectedMachine.problems.map((p, idx) => <li key={idx}>{p}</li>)
                      ) : (
                        <li>No current problems</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;