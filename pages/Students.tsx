import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronDown, ChevronUp, BookOpen, Clock, UserPlus, Edit2, DollarSign, CheckCircle, XCircle, Calendar, ListFilter, AlertCircle } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Student, ClassSession, AttendanceRecord, Teacher, PaymentRecord } from '../types';

export const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  // Modals
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Detailed View Modals
  const [detailsModal, setDetailsModal] = useState<{ type: 'ATTENDANCE' | 'FEES', studentId: string, classId: string } | null>(null);
  const [feeConfirmation, setFeeConfirmation] = useState<{ studentId: string, classId: string, month: string, amount: number } | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name'); // name, date, grade

  // Forms State
  const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', enrolledDate: new Date().toISOString().split('T')[0] });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Enrollment Filter State
  const [enrollSearch, setEnrollSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, c, t, allData] = await Promise.all([
      DataService.getStudents(),
      DataService.getClasses(),
      DataService.getTeachers(),
      DataService.getFullDump()
    ]);
    
    setStudents(s);
    setClasses(c);
    setTeachers(t);
    setAttendance(allData.attendance);
    setPayments(allData.payments);
  };

  const handleRegister = async () => {
    if (!studentForm.name || !studentForm.email) return;
    await DataService.addStudent(studentForm);
    setIsRegModalOpen(false);
    setStudentForm({ name: '', email: '', phone: '', enrolledDate: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleUpdate = async () => {
    if (!editingStudentId || !studentForm.name) return;
    await DataService.updateStudent(editingStudentId, studentForm);
    setIsEditModalOpen(false);
    setEditingStudentId(null);
    loadData();
  };

  const openEditModal = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudentId(student.id);
    setStudentForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      enrolledDate: student.enrolledDate
    });
    setIsEditModalOpen(true);
  };

  const handleEnrollSubmit = async (classId: string) => {
    if (!selectedStudentId) return;
    await DataService.enrollStudent(classId, selectedStudentId);
    setIsEnrollModalOpen(false);
    loadData();
  };

  const confirmPayment = async () => {
    if (!feeConfirmation) return;
    const { studentId, classId, month, amount } = feeConfirmation;
    await DataService.togglePaymentStatus(studentId, classId, month, amount);
    // Refresh payments
    const allData = await DataService.getFullDump();
    setPayments(allData.payments);
    setFeeConfirmation(null);
  };

  const openEnrollModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setEnrollSearch('');
    setIsEnrollModalOpen(true);
  };

  // --- Logic Helpers ---
  const getStudentClasses = (studentId: string) => {
    return classes.filter(c => c.studentIds.includes(studentId));
  };

  const getAttendanceStats = (studentId: string, classId: string) => {
    const records = attendance.filter(a => a.studentId === studentId && a.classId === classId);
    const total = records.length;
    const present = records.filter(a => a.status === 'PRESENT').length;
    const late = records.filter(a => a.status === 'LATE').length;
    return { total, present, late, records };
  };

  const getPaymentHistory = (studentId: string, classId: string) => {
    return payments.filter(p => p.studentId === studentId && p.classId === classId);
  };

  const sortedStudents = [...students].sort((a, b) => {
     if (sortOption === 'name') return a.name.localeCompare(b.name);
     if (sortOption === 'date') return new Date(b.enrolledDate).getTime() - new Date(a.enrolledDate).getTime();
     return 0;
  });

  const filteredStudents = sortedStudents.filter(student => {
    const search = searchTerm.toLowerCase();
    if (student.name.toLowerCase().includes(search) || 
        student.email.toLowerCase().includes(search) ||
        student.id.toLowerCase().includes(search)) {
      return true;
    }
    const enrolled = getStudentClasses(student.id);
    return enrolled.some(c => 
      c.name.toLowerCase().includes(search) || 
      c.gradeYear.toLowerCase().includes(search) ||
      c.code.toLowerCase().includes(search)
    );
  });

  // Generate last 6 months for fee dropdown logic
  const getLast6Months = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7));
    }
    return months;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Student Management</h2>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Search (Name, ID, Course)..." 
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
                <option value="date">Sort by Date Joined</option>
             </select>
          </div>
          <button 
            onClick={() => {
               setStudentForm({ name: '', email: '', phone: '', enrolledDate: new Date().toISOString().split('T')[0] });
               setIsRegModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 mr-2" /> New Student
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Enrolled</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredStudents.map(student => {
              const enrolledClasses = getStudentClasses(student.id);
              const isExpanded = expandedStudent === student.id;

              return (
                <React.Fragment key={student.id}>
                  <tr 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                    onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3 border border-blue-200">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-900">{student.name}</div>
                           <div className="text-xs text-slate-500">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{student.email}</div>
                        <div className="text-xs text-slate-500">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {enrolledClasses.length} Classes
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={(e) => openEditModal(student, e)}
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
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
                                <BookOpen className="w-4 h-4 mr-2" /> Academic Overview
                            </h4>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEnrollModal(student.id); }}
                              className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md shadow-sm font-medium flex items-center"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Enroll in Course
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {enrolledClasses.map(cls => {
                              const stats = getAttendanceStats(student.id, cls.id);
                              return (
                                <div key={cls.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="font-bold text-slate-800">{cls.name}</div>
                                      <div className="text-xs text-slate-500 font-mono">{cls.code} • {cls.gradeYear}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">{cls.schedule}</div>
                                        <div className="text-xs text-green-700 font-bold mt-1">${cls.feePerMonth}/mo</div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-slate-600 mb-3 pb-2 border-b border-slate-100">
                                    Instructor: <span className="font-medium">{teachers.find(t => t.id === cls.teacherId)?.name}</span>
                                  </div>

                                  <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-slate-500 font-semibold">Attendance</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setDetailsModal({ type: 'ATTENDANCE', studentId: student.id, classId: cls.id }); }}
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        View Detail
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                         <span className="text-xs font-medium text-slate-700">
                                            {stats.present + stats.late} / {stats.total}
                                        </span>
                                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                            <div 
                                                className="bg-green-500 h-1.5 rounded-full" 
                                                style={{ width: `${stats.total ? ((stats.present + stats.late) / stats.total) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 rounded p-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="text-[10px] uppercase font-bold text-slate-500 flex items-center">
                                            <DollarSign className="w-3 h-3 mr-1" /> Fee Status
                                        </h5>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setDetailsModal({ type: 'FEES', studentId: student.id, classId: cls.id }); }}
                                            className="text-[10px] text-blue-600 font-semibold hover:underline"
                                        >
                                            Manage Fees
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {getLast6Months().slice(0, 3).map(m => {
                                            const history = getPaymentHistory(student.id, cls.id);
                                            const rec = history.find(p => p.month === m);
                                            const isPaid = rec?.status === 'PAID';
                                            return (
                                                <div
                                                    key={m}
                                                    className={`flex-1 py-1 text-[10px] font-bold rounded border flex flex-col items-center justify-center ${
                                                        isPaid 
                                                        ? 'bg-green-50 border-green-200 text-green-700' 
                                                        : 'bg-white border-slate-200 text-slate-400'
                                                    }`}
                                                >
                                                    <span>{m}</span>
                                                    {isPaid ? <CheckCircle className="w-3 h-3 mt-1" /> : <div className="h-3 w-3 rounded-full border border-slate-300 mt-1"></div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {enrolledClasses.length === 0 && (
                              <div className="col-span-full text-center py-4 text-slate-500 text-sm italic bg-white rounded border border-dashed border-slate-300">
                                Not enrolled in any classes yet.
                              </div>
                            )}
                          </div>
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

      {/* Details Modal (Attendance or Fees) */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-900">
                        {detailsModal.type === 'ATTENDANCE' ? 'Detailed Attendance History' : 'Detailed Fee History'}
                    </h3>
                    <button onClick={() => setDetailsModal(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {detailsModal.type === 'ATTENDANCE' && (() => {
                        const { records } = getAttendanceStats(detailsModal.studentId, detailsModal.classId);
                        const cls = classes.find(c => c.id === detailsModal.classId);
                        return (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600">Attendance records for <strong>{cls?.name}</strong></p>
                                <table className="min-w-full divide-y divide-slate-200 border">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
                                            <tr key={r.id}>
                                                <td className="px-4 py-2 text-sm text-slate-900">{r.date}</td>
                                                <td className="px-4 py-2 text-sm">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                        r.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                        r.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {records.length === 0 && <p className="text-center text-slate-500 text-sm">No records found.</p>}
                            </div>
                        )
                    })()}

                    {detailsModal.type === 'FEES' && (() => {
                        const history = getPaymentHistory(detailsModal.studentId, detailsModal.classId);
                        const cls = classes.find(c => c.id === detailsModal.classId);
                        const months = getLast6Months();

                        return (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600">Fee history for <strong>{cls?.name}</strong> (Monthly Fee: ${cls?.feePerMonth})</p>
                                
                                <div className="border rounded-lg overflow-hidden">
                                     <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Month</th>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {months.map(m => {
                                                const rec = history.find(p => p.month === m);
                                                const isPaid = rec?.status === 'PAID';
                                                
                                                return (
                                                    <tr key={m}>
                                                        <td className="px-4 py-2 text-sm font-medium text-slate-900">{m}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {isPaid 
                                                                ? <span className="text-green-600 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Paid</span> 
                                                                : <span className="text-slate-400 flex items-center">Unpaid</span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <button 
                                                                onClick={() => setFeeConfirmation({ 
                                                                    studentId: detailsModal.studentId, 
                                                                    classId: detailsModal.classId, 
                                                                    month: m, 
                                                                    amount: cls?.feePerMonth || 0 
                                                                })}
                                                                className={`px-3 py-1 rounded text-xs font-bold border ${isPaid ? 'border-slate-300 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                            >
                                                                {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
      )}
      
      {/* Fee Confirmation Modal */}
      {feeConfirmation && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                  <div className="flex items-center mb-4 text-amber-600">
                      <AlertCircle className="w-6 h-6 mr-2"/>
                      <h3 className="text-lg font-bold">Confirm Fee Action</h3>
                  </div>
                  <p className="text-slate-700 mb-6">
                      Are you sure you want to update the fee status for <strong>{feeConfirmation.month}</strong>?
                      <br/>
                      <span className="text-sm text-slate-500">Amount: ${feeConfirmation.amount}</span>
                  </p>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setFeeConfirmation(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Cancel</button>
                      <button onClick={confirmPayment} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Confirm Update</button>
                  </div>
              </div>
          </div>
      )}

      {/* Enroll & Register Modals - Reuse Logic */}
      {(isRegModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">{isEditModalOpen ? 'Edit Student' : 'Register Student'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={studentForm.name} 
                  onChange={e => setStudentForm({...studentForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input 
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={studentForm.email} 
                  onChange={e => setStudentForm({...studentForm, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                <input 
                  className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={studentForm.phone} 
                  onChange={e => setStudentForm({...studentForm, phone: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button onClick={() => { setIsRegModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={isEditModalOpen ? handleUpdate : handleRegister} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{isEditModalOpen ? 'Save' : 'Register'}</button>
            </div>
          </div>
        </div>
      )}
      
       {/* Enroll Modal */}
       {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-900">Enroll Student</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Search courses..." 
                  className="w-full border border-slate-300 pl-9 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={enrollSearch}
                  onChange={e => setEnrollSearch(e.target.value)}
                />
              </div>
            </div>
             <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {classes.filter(c => c.name.toLowerCase().includes(enrollSearch.toLowerCase())).map(cls => (
                <div key={cls.id} className="p-3 hover:bg-slate-50 flex justify-between items-center bg-white">
                  <div>
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{cls.name}</span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{cls.code}</span>
                    </div>
                    <div className="text-sm text-slate-500">{cls.gradeYear}</div>
                  </div>
                  <button onClick={() => handleEnrollSubmit(cls.id)} className="px-3 py-1 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50">Select</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2"><button onClick={() => setIsEnrollModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};