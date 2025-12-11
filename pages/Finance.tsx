import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { SalaryRecord, PaymentRecord, Teacher, ClassSession, Student } from '../types';
import { DollarSign, CheckCircle, Search, Filter } from 'lucide-react';

export const Finance = () => {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [month, setMonth] = useState('2023-10');
  const [activeTab, setActiveTab] = useState<'fees' | 'salaries'>('fees');

  // Filter State
  const [feeFilterClass, setFeeFilterClass] = useState('');
  const [feeFilterTeacher, setFeeFilterTeacher] = useState('');
  const [feeFilterMonth, setFeeFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [feeSort, setFeeSort] = useState('student');

  useEffect(() => {
    loadData();
  }, [month]); // Reload salaries when global month changes

  const loadData = async () => {
    const [t, sal, p, s, c] = await Promise.all([
        DataService.getTeachers(),
        DataService.calculateSalaries(month),
        // For fees tab, we need ALL payments potentially, or we filter in memory
        // Since getFullDump is available, let's use it for comprehensive data
        Promise.resolve([]), 
        DataService.getStudents(),
        DataService.getClasses()
    ]);
    
    const dump = await DataService.getFullDump();
    
    setTeachers(t);
    setSalaries(sal);
    setPayments(dump.payments);
    setStudents(s);
    setClasses(c);
  };

  // --- Fee Filtering Logic ---
  // We need to generate a "row" for every student in every class for the selected month
  // even if a payment record doesn't exist yet (implied pending).
  
  const generateFeeRows = () => {
    const rows: { 
        id: string, 
        student: Student, 
        cls: ClassSession, 
        teacher: Teacher | undefined, 
        amount: number, 
        status: string, 
        month: string 
    }[] = [];

    // Filter classes first
    const relevantClasses = classes.filter(c => {
        if (feeFilterClass && c.id !== feeFilterClass) return false;
        if (feeFilterTeacher && c.teacherId !== feeFilterTeacher) return false;
        return true;
    });

    relevantClasses.forEach(cls => {
        const teacher = teachers.find(t => t.id === cls.teacherId);
        cls.studentIds.forEach(sid => {
            const student = students.find(s => s.id === sid);
            if (!student) return;

            const existingPayment = payments.find(p => p.studentId === sid && p.classId === cls.id && p.month === feeFilterMonth);
            
            rows.push({
                id: `${sid}-${cls.id}-${feeFilterMonth}`,
                student,
                cls,
                teacher,
                amount: cls.feePerMonth,
                status: existingPayment ? existingPayment.status : 'PENDING',
                month: feeFilterMonth
            });
        });
    });

    // Sorting
    return rows.sort((a, b) => {
        if (feeSort === 'student') return a.student.name.localeCompare(b.student.name);
        if (feeSort === 'class') return a.cls.name.localeCompare(b.cls.name);
        if (feeSort === 'status') return a.status.localeCompare(b.status);
        return 0;
    });
  };

  const feeRows = generateFeeRows();
  const totalExpected = feeRows.reduce((acc, r) => acc + r.amount, 0);
  const totalCollected = feeRows.filter(r => r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Finance Management</h2>
      </div>

      <div className="flex space-x-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('fees')}
          className={`pb-2 px-4 font-medium text-sm ${activeTab === 'fees' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Student Fees
        </button>
        <button 
          onClick={() => setActiveTab('salaries')}
          className={`pb-2 px-4 font-medium text-sm ${activeTab === 'salaries' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Teacher Salaries
        </button>
      </div>

      {activeTab === 'salaries' && (
        <div className="space-y-4">
             <div className="flex justify-end items-center gap-2">
                 <label className="text-sm font-bold text-slate-600">Salary Month:</label>
                 <input 
                    type="month" 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)}
                    className="border border-slate-300 bg-white p-2 rounded-lg text-sm"
                 />
             </div>
             
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-yellow-50 border-b border-yellow-100 text-sm text-yellow-800">
                    Note: Salary includes Base Pay + (Commission × Total Students in all classes assigned to teacher).
                </div>
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Teacher</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Base Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Total Payout</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                    {salaries.map(salary => {
                        const teacher = teachers.find(t => t.id === salary.teacherId);
                        return (
                        <tr key={salary.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {teacher?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${salary.baseAmount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${salary.commissionAmount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">${salary.totalAmount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                    {salary.status}
                                </span>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="space-y-4">
             {/* Fee Filters */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fee Month</label>
                    <input 
                        type="month"
                        value={feeFilterMonth}
                        onChange={(e) => setFeeFilterMonth(e.target.value)}
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-40 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Class</label>
                    <select 
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-48 outline-none focus:ring-2 focus:ring-blue-500"
                        value={feeFilterClass}
                        onChange={e => setFeeFilterClass(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Teacher</label>
                    <select 
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-48 outline-none focus:ring-2 focus:ring-blue-500"
                        value={feeFilterTeacher}
                        onChange={e => setFeeFilterTeacher(e.target.value)}
                    >
                        <option value="">All Teachers</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sort By</label>
                    <select 
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-40 outline-none focus:ring-2 focus:ring-blue-500"
                        value={feeSort}
                        onChange={e => setFeeSort(e.target.value)}
                    >
                        <option value="student">Student Name</option>
                        <option value="class">Class Name</option>
                        <option value="status">Payment Status</option>
                    </select>
                </div>
                
                <div className="ml-auto flex items-center gap-4 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <div>
                        <span className="text-slate-500">Collected:</span> 
                        <span className="ml-1 font-bold text-green-600">${totalCollected}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div>
                         <span className="text-slate-500">Expected:</span>
                         <span className="ml-1 font-bold text-slate-700">${totalExpected}</span>
                    </div>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {feeRows.map(row => (
                            <tr key={row.id}>
                                <td className="px-6 py-3 text-sm font-bold text-slate-900">{row.student.name}</td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                    <div>{row.cls.name}</div>
                                    <div className="text-xs text-slate-400">{row.cls.code}</div>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">{row.teacher?.name}</td>
                                <td className="px-6 py-3 text-sm font-medium text-slate-900">${row.amount}</td>
                                <td className="px-6 py-3 text-sm">
                                    {row.status === 'PAID' 
                                        ? <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Paid</span>
                                        : <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">Pending</span>
                                    }
                                </td>
                            </tr>
                        ))}
                        {feeRows.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">No fee records matching filters.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
      )}
    </div>
  );
};