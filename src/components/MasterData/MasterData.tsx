import React, { useState } from 'react';
import UserMaster from './UserMaster';
import MachineMaster from './MachineMaster';
import ProductMaster from './ProductMaster';

const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'user' | 'machine' | 'product'>('user');

  const tabs = [
    { id: 'user', label: 'User Master', component: UserMaster },
    { id: 'machine', label: 'Machine Master', component: MachineMaster },
    { id: 'product', label: 'Product Master', component: ProductMaster },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || UserMaster;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Master Data Management</h1>
        <p className="text-gray-600">Manage your core system data</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default MasterData;