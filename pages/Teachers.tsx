import React, { useEffect, useState } from 'react';
import { UserPlus, BookOpen, ChevronDown, ChevronUp, Edit2, Plus, Search } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Teacher, ClassSession } from '../types';

export const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  
  // Search & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name');

  // Modals
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Forms
  const [teacherForm, setTeacherForm] = useState({ 
    name: '', email: '', subjectSpecialty: '', baseSalary: 2000, commissionPerStudent: 50 
  });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState({
     name: '', code: '', gradeYear: '', schedule: '', feePerMonth: 0, teacherId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, c] = await Promise.all([DataService.getTeachers(), DataService.getClasses()]);
    setTeachers(t);
    setClasses(c);
  };

  // --- Handlers ---
  const handleRegister = async () => {
    if (!teacherForm.name || !teacherForm.email) return;
    await DataService.addTeacher(teacherForm);
    setIsRegModalOpen(false);
    resetTeacherForm();
    loadData();
  };

  const handleUpdate = async () => {
    if (!editingTeacherId || !teacherForm.name) return;
    await DataService.updateTeacher(editingTeacherId, teacherForm);
    setIsEditModalOpen(false);
    setEditingTeacherId(null);
    loadData();
  };

  const handleAddCourse = async () => {
      if(!courseForm.name || !courseForm.code || !courseForm.teacherId) return;
      await DataService.addClass({ ...courseForm, studentIds: [] });
      setIsCourseModalOpen(false);
      loadData();
  };

  const resetTeacherForm = () => {
    setTeacherForm({ name: '', email: '', subjectSpecialty: '', baseSalary: 2000, commissionPerStudent: 50 });
  };

  const openEditModal = (teacher: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTeacherId(teacher.id);
    setTeacherForm({
        name: teacher.name,
        email: teacher.email,
        subjectSpecialty: teacher.subjectSpecialty,
        baseSalary: teacher.baseSalary,
        commissionPerStudent: teacher.commissionPerStudent
    });
    setIsEditModalOpen(true);
  };

  const openCourseModal = (teacherId: string) => {
      setCourseForm({ name: '', code: '', gradeYear: '', schedule: '', feePerMonth: 0, teacherId });
      setIsCourseModalOpen(true);
  };

  // --- Filters ---
  const sortedTeachers = [...teachers].sort((a, b) => {
     if (sortOption === 'name') return a.name.localeCompare(b.name);
     if (sortOption === 'specialty') return a.subjectSpecialty.localeCompare(b.subjectSpecialty);
     return 0;
  });

  const filteredTeachers = sortedTeachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subjectSpecialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTeacherClasses = (teacherId: string) => {
    return classes.filter(c => c.teacherId === teacherId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Teacher Management</h2>
         <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search teachers..." 
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
                    <option value="specialty">Sort by Specialty</option>
                </select>
            </div>
          <button 
            onClick={() => { resetTeacherForm(); setIsRegModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Register Teacher
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Active Courses</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredTeachers.map(teacher => {
              const myClasses = getTeacherClasses(teacher.id);
              const isExpanded = expandedTeacher === teacher.id;

              return (
                <React.Fragment key={teacher.id}>
                  <tr 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                    onClick={() => setExpandedTeacher(isExpanded ? null : teacher.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mr-3 border border-emerald-200">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">{teacher.name}</div>
                            <div className="text-xs text-slate-500">{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{teacher.subjectSpecialty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {myClasses.length} Courses
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                             <button 
                                onClick={(e) => openEditModal(teacher, e)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="text-slate-400 hover:text-slate-600">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                        </div>
                    </td>
                  </tr>

                  {isExpanded && (
                     <tr>
                        <td colSpan={4} className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Courses Taught</h4>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openCourseModal(teacher.id); }}
                                    className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md shadow-sm font-medium flex items-center"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add New Course
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {myClasses.map(cls => (
                                    <div key={cls.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-900 text-sm">{cls.name}</span>
                                            <span className="text-xs bg-slate-100 px-1 rounded border text-slate-600">{cls.code}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{cls.gradeYear}</div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t pt-2">
                                            <span>Students: {cls.studentIds.length}</span>
                                            <span>{cls.schedule}</span>
                                        </div>
                                    </div>
                                ))}
                                {myClasses.length === 0 && (
                                    <div className="text-sm text-slate-500 italic text-center py-2 bg-white border border-dashed rounded">No active courses assigned.</div>
                                )}
                            </div>
                        </td>
                     </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Register/Edit Teacher Modal */}
      {(isRegModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
                {isEditModalOpen ? 'Edit Teacher' : 'Register New Teacher'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={teacherForm.name} 
                  onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={teacherForm.email} 
                  onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Specialty</label>
                <input 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={teacherForm.subjectSpecialty} 
                  onChange={e => setTeacherForm({...teacherForm, subjectSpecialty: e.target.value})} 
                />
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Base Salary ($)</label>
                <input 
                  type="number"
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={teacherForm.baseSalary} 
                  onChange={e => setTeacherForm({...teacherForm, baseSalary: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button 
                onClick={() => { setIsRegModalOpen(false); setIsEditModalOpen(false); }} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={isEditModalOpen ? handleUpdate : handleRegister} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm font-medium"
              >
                {isEditModalOpen ? 'Save Changes' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isCourseModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Create New Course</h3>
            
            <div className="space-y-3">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Course Name</label>
                 <input 
                  placeholder="e.g. Physics 101" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Code</label>
                    <input 
                    placeholder="PHY101" 
                    className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Grade</label>
                    <input 
                    placeholder="Year 1" 
                    className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={courseForm.gradeYear} onChange={e => setCourseForm({...courseForm, gradeYear: e.target.value})} 
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Schedule</label>
                <input 
                  placeholder="e.g. Mon 10am" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={courseForm.schedule} onChange={e => setCourseForm({...courseForm, schedule: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Monthly Fee ($)</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={courseForm.feePerMonth || ''} onChange={e => setCourseForm({...courseForm, feePerMonth: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Cancel</button>
              <button onClick={handleAddCourse} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm font-medium">Create Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
