import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Institute } from '../types';
import { CheckCircle, XCircle, Building2, Clock } from 'lucide-react';

export const AdminDashboard = () => {
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  useEffect(() => {
    loadInstitutes();
  }, []);

  const loadInstitutes = async () => {
    const data = await DataService.getAllInstitutes();
    setInstitutes(data);
  };

  const handleApprove = async (id: string) => {
    await DataService.approveInstitute(id);
    loadInstitutes();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Platform Administration</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
            <h3 className="font-bold text-lg flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-slate-500"/> Registered Institutes
            </h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Institute Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {institutes.map(inst => (
              <tr key={inst.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{inst.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">{inst.subscriptionPlan}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(inst.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {inst.status === 'APPROVED' 
                        ? <span className="flex items-center text-green-600 text-sm font-bold"><CheckCircle className="w-4 h-4 mr-1"/> Active</span>
                        : <span className="flex items-center text-yellow-600 text-sm font-bold"><Clock className="w-4 h-4 mr-1"/> Pending</span>
                    }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                    {inst.status === 'PENDING' && (
                        <button 
                            onClick={() => handleApprove(inst.id)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Approve Access
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
