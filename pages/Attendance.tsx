import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { ClassSession, Student, AttendanceRecord, Teacher } from '../types';
import { Search } from 'lucide-react';

export const Attendance = () => {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'mark' | 'view'>('mark');

  // Mark State
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceBuffer, setAttendanceBuffer] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [message, setMessage] = useState('');

  // View Filter State
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    Promise.all([
        DataService.getClasses(),
        DataService.getStudents(),
        DataService.getTeachers(),
        DataService.getAllAttendance()
    ]).then(([c, s, t, a]) => {
        setClasses(c);
        setStudents(s);
        setTeachers(t);
        setAllAttendance(a);
    });
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const enrolledStudents = selectedClass 
    ? students.filter(s => selectedClass.studentIds.includes(s.id))
    : [];

  const handleSave = async () => {
    if (!selectedClassId) return;
    
    const user = await DataService.getCurrentUser();
    const records: AttendanceRecord[] = Object.entries(attendanceBuffer).map(([studentId, status]) => ({
      id: `${selectedClassId}-${selectedDate}-${studentId}`,
      classId: selectedClassId,
      instituteId: user?.instituteId || '',
      date: selectedDate,
      studentId,
      status: status as 'PRESENT' | 'ABSENT' | 'LATE'
    }));

    await DataService.markAttendance(records);
    
    // Refresh local history
    const updatedHistory = await DataService.getAllAttendance();
    setAllAttendance(updatedHistory);

    setMessage('Attendance saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  // --- Filtering Logic for View Tab ---
  const filteredHistory = allAttendance.filter(record => {
    let matchTeacher = true;
    let matchClass = true;
    let matchDate = true;

    if (filterClassId) {
        matchClass = record.classId === filterClassId;
    }
    
    if (filterTeacherId) {
        const cls = classes.find(c => c.id === record.classId);
        matchTeacher = cls ? cls.teacherId === filterTeacherId : false;
    }

    if (filterDate) {
        matchDate = record.date === filterDate;
    }

    return matchTeacher && matchClass && matchDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Attendance Manager</h2>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('mark')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'mark' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Mark Attendance
            </button>
            <button 
                onClick={() => setActiveTab('view')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'view' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                View History
            </button>
        </div>
      </div>
      
      {activeTab === 'mark' && (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="w-64">
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Class</label>
                <select 
                    className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedClassId}
                    onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        setAttendanceBuffer({});
                    }}
                >
                    <option value="">-- Choose Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                </div>
                
                <div className="w-48">
                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                <input 
                    type="date" 
                    className="w-full border border-slate-300 bg-white text-slate-900 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                </div>
            </div>

            {selectedClassId && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                    {enrolledStudents.map(student => (
                        <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <div className="flex space-x-2">
                                {['PRESENT', 'ABSENT', 'LATE'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setAttendanceBuffer(prev => ({ ...prev, [student.id]: status as any }))}
                                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                            attendanceBuffer[student.id] === status
                                            ? status === 'PRESENT' ? 'bg-green-100 border-green-500 text-green-700'
                                            : status === 'ABSENT' ? 'bg-red-100 border-red-500 text-red-700'
                                            : 'bg-yellow-100 border-yellow-500 text-yellow-700'
                                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </td>
                        </tr>
                    ))}
                    {enrolledStudents.length === 0 && (
                        <tr>
                            <td colSpan={2} className="px-6 py-4 text-center text-slate-500">No students enrolled in this class.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center">
                    {message && <span className="text-green-600 mr-4 text-sm font-bold">{message}</span>}
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium"
                    >
                        Save Attendance
                    </button>
                </div>
                </div>
            )}
        </>
      )}

      {activeTab === 'view' && (
        <div className="space-y-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Teacher</label>
                    <select 
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-48 outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterTeacherId}
                        onChange={e => setFilterTeacherId(e.target.value)}
                    >
                        <option value="">All Teachers</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Class</label>
                    <select 
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-48 outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterClassId}
                        onChange={e => setFilterClassId(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {classes.filter(c => filterTeacherId ? c.teacherId === filterTeacherId : true).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Date</label>
                    <input 
                        type="date"
                        className="border border-slate-300 bg-white text-slate-900 p-2 rounded-lg text-sm w-40 outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredHistory.map(record => {
                            const cls = classes.find(c => c.id === record.classId);
                            const st = students.find(s => s.id === record.studentId);
                            return (
                                <tr key={record.id}>
                                    <td className="px-6 py-3 text-sm text-slate-900">{record.date}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{cls?.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-600">{st?.name}</td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                            record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredHistory.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">No attendance records found for these filters.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
      )}
    </div>
  );
};