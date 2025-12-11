import React, { useEffect, useState } from 'react';
import { Plus, Users, Calendar, Hash, GraduationCap, Edit2, Search } from 'lucide-react';
import { DataService } from '../services/dataService';
import { ClassSession, Teacher, Student } from '../types';

export const Classes = () => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Search & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name');

  // Forms
  const [classForm, setClassForm] = useState({ 
    name: '', code: '', gradeYear: '', teacherId: '', schedule: '', feePerMonth: 0 
  });
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [c, t, s] = await Promise.all([DataService.getClasses(), DataService.getTeachers(), DataService.getStudents()]);
    setClasses(c);
    setTeachers(t);
    setStudents(s);
  };

  const handleCreate = async () => {
    if(!classForm.name || !classForm.teacherId || !classForm.code) return;
    await DataService.addClass({ ...classForm, studentIds: [] });
    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleUpdate = async () => {
    if (!editingClassId || !classForm.name) return;
    await DataService.updateClass(editingClassId, classForm);
    setIsEditModalOpen(false);
    setEditingClassId(null);
    loadData();
  };

  const handleEnroll = async (classId: string, studentId: string) => {
    if(!studentId) return;
    await DataService.enrollStudent(classId, studentId);
    loadData();
  };

  const resetForm = () => {
    setClassForm({ name: '', code: '', gradeYear: '', teacherId: '', schedule: '', feePerMonth: 0 });
  };

  const openEditModal = (cls: ClassSession) => {
    setEditingClassId(cls.id);
    setClassForm({
        name: cls.name,
        code: cls.code,
        gradeYear: cls.gradeYear,
        teacherId: cls.teacherId,
        schedule: cls.schedule,
        feePerMonth: cls.feePerMonth
    });
    setIsEditModalOpen(true);
  };

  // Sort & Filter
  const sortedClasses = [...classes].sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'grade') return a.gradeYear.localeCompare(b.gradeYear);
      if (sortOption === 'fee') return b.feePerMonth - a.feePerMonth;
      return 0;
  });

  const filteredClasses = sortedClasses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gradeYear.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FormContent = () => (
    <>
        <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <label className="text-sm font-bold text-slate-700 mb-1 block">Course Name</label>
                 <input 
                  placeholder="e.g. Physics 101" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Course Code</label>
                <input 
                  placeholder="e.g. PHY101" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={classForm.code} onChange={e => setClassForm({...classForm, code: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Grade/Year</label>
                <input 
                  placeholder="e.g. Year 1" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={classForm.gradeYear} onChange={e => setClassForm({...classForm, gradeYear: e.target.value})} 
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm font-bold text-slate-700 mb-1 block">Teacher</label>
              <select 
                className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={classForm.teacherId} onChange={e => setClassForm({...classForm, teacherId: e.target.value})}
              >
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Schedule</label>
                <input 
                  placeholder="e.g. Mon 10am" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={classForm.schedule} onChange={e => setClassForm({...classForm, schedule: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Monthly Fee</label>
                <input 
                  type="number" placeholder="0" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={classForm.feePerMonth || ''} onChange={e => setClassForm({...classForm, feePerMonth: Number(e.target.value)})}
                />
              </div>
            </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Class Management</h2>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Search classes..." 
                  className="w-full border border-slate-300 pl-9 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <select 
                    className="border border-slate-300 p-2 rounded-lg bg-white text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                >
                    <option value="name">Sort by Name</option>
                    <option value="grade">Sort by Grade</option>
                    <option value="fee">Sort by Fee</option>
                </select>
            </div>
            <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
            <Plus className="w-4 h-4 mr-2" /> Create Class
            </button>
        </div>
      </div>

      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{isEditModalOpen ? 'Edit Class' : 'Create New Class'}</h3>
            <FormContent />
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-4">
              <button 
                onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={isEditModalOpen ? handleUpdate : handleCreate} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                {isEditModalOpen ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map(cls => (
          <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
            <button 
                onClick={() => openEditModal(cls)}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-full border border-transparent hover:border-slate-200 transition-all opacity-0 group-hover:opacity-100"
            >
                <Edit2 className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-start mb-4 pr-8">
              <div>
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{cls.code}</span>
                </div>
                <div className="text-sm text-slate-500 mt-1 space-y-1">
                    <p className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {cls.schedule}</p>
                    <p className="flex items-center"><GraduationCap className="w-3 h-3 mr-1" /> {cls.gradeYear}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-2 rounded">
                 <div>
                    <span className="font-semibold text-slate-500 text-xs uppercase block mb-1">Teacher</span> 
                    {teachers.find(t => t.id === cls.teacherId)?.name || 'Unassigned'}
                 </div>
                 <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                    ${cls.feePerMonth}/mo
                </span>
              </div>
              
              <div className="border-t pt-3 border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold flex items-center text-slate-700">
                        <Users className="w-4 h-4 mr-1" /> Students ({cls.studentIds.length})
                    </span>
                </div>
                
                <div className="flex space-x-2">
                   <select 
                     className="text-sm border border-slate-300 bg-white text-slate-900 rounded px-2 py-1 flex-1 outline-none focus:border-blue-500"
                     onChange={(e) => {
                       handleEnroll(cls.id, e.target.value);
                       e.target.value = '';
                     }}
                   >
                     <option value="">+ Quick Enroll</option>
                     {students.filter(s => !cls.studentIds.includes(s.id)).map(s => (
                       <option key={s.id} value={s.id}>{s.name}</option>
                     ))}
                   </select>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {cls.studentIds.map(sid => {
                    const st = students.find(s => s.id === sid);
                    return st ? (
                      <span key={sid} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
                        {st.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
