import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Institute, UserRole } from '../types';
import { Building2, Calendar, Shield, Save, Edit } from 'lucide-react';

export const InstituteProfile = () => {
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState('');

  const currentUser = DataService.getCurrentUser();
  const canEdit = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    loadInstitute();
  }, []);

  const loadInstitute = async () => {
    const data = await DataService.getInstitute();
    setInstitute(data);
    if (data) setEditName(data.name);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
        await DataService.updateInstitute(editName);
        setIsEditing(false);
        setMessage("Institute updated successfully!");
        loadInstitute();
        setTimeout(() => setMessage(''), 3000);
    } catch (e) {
        setMessage("Error updating institute.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  if (!institute) return <div className="p-8 text-center text-slate-500">No institute data found.</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-900">Institute Profile</h2>
         {message && <span className="text-sm font-bold text-green-600 animate-fade-in">{message}</span>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-900 to-indigo-900 relative">
            <div className="absolute -bottom-10 left-8">
                <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center border-4 border-white">
                    <Building2 className="w-10 h-10 text-blue-600" />
                </div>
            </div>
        </div>
        
        <div className="pt-14 px-8 pb-8">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input 
                                className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 outline-none pb-1"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <h1 className="text-3xl font-bold text-slate-900">{institute.name}</h1>
                    )}
                    <p className="text-slate-500 text-sm">Institute ID: {institute.id}</p>
                </div>
                
                {canEdit && (
                    <button 
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`px-4 py-2 rounded-lg font-bold flex items-center transition-colors shadow-sm ${
                            isEditing 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {isEditing ? <><Save className="w-4 h-4 mr-2"/> Save</> : <><Edit className="w-4 h-4 mr-2"/> Edit Profile</>}
                    </button>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center text-slate-500 mb-2">
                        <Shield className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Subscription Status</span>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="font-bold text-slate-900">{institute.subscriptionPlan} Plan</span>
                         <span className={`px-2 py-1 rounded text-xs font-bold ${institute.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                             {institute.status}
                         </span>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center text-slate-500 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Member Since</span>
                    </div>
                    <div className="font-bold text-slate-900">
                        {new Date(institute.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Platform Details</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                    This institute is managed on the EduFlow secure multi-tenant cloud. 
                    All data is isolated using Row Level Security policies ensuring privacy and compliance. 
                    {institute.status === 'PENDING' && <span className="text-yellow-600 block mt-2 font-semibold">Note: Your account is currently pending approval. Some features may be restricted.</span>}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};