import { 
  Student, Teacher, ClassSession, AttendanceRecord, PaymentRecord, SalaryRecord, UserProfile, Institute, UserRole
} from '../types';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_CLASSES, MOCK_ATTENDANCE, MOCK_PAYMENTS, MOCK_PROFILES, MOCK_INSTITUTES } from '../constants';

// --- SESSION STATE (Mocking Supabase Auth) ---
let currentUser: UserProfile | null = null;

// --- DATA STORE ---
let institutes = [...MOCK_INSTITUTES];
let profiles = [...MOCK_PROFILES];
let students = [...MOCK_STUDENTS];
let teachers = [...MOCK_TEACHERS];
let classes = [...MOCK_CLASSES];
let attendance = [...MOCK_ATTENDANCE];
let payments = [...MOCK_PAYMENTS];

export const DataService = {
  // --- Auth & Session ---
  login: (email: string) => {
    const user = profiles.find(p => p.email === email);
    if (user) {
        currentUser = user;
        // Check if institute is approved
        if (user.role !== UserRole.ADMIN) {
            const inst = institutes.find(i => i.id === user.instituteId);
            if (inst?.status !== 'APPROVED') {
                currentUser = null;
                return Promise.reject("Institute is pending approval.");
            }
        }
        return Promise.resolve(user);
    }
    return Promise.reject("Invalid credentials");
  },
  
  logout: () => {
    currentUser = null;
    return Promise.resolve();
  },

  getCurrentUser: () => currentUser,

  registerInstitute: (instituteName: string, managerName: string, email: string) => {
    const newInstId = `inst-${Math.random().toString(36).substr(2, 5)}`;
    const newInstitute: Institute = {
        id: newInstId,
        name: instituteName,
        status: 'PENDING',
        subscriptionPlan: 'FREE',
        createdAt: new Date().toISOString()
    };
    
    const newProfile: UserProfile = {
        id: `mngr-${Math.random().toString(36).substr(2, 5)}`,
        email,
        name: managerName,
        role: UserRole.MANAGER,
        instituteId: newInstId
    };

    institutes.push(newInstitute);
    profiles.push(newProfile);
    return Promise.resolve();
  },

  // --- Institute Management (Admin Only) ---
  getAllInstitutes: () => {
    if (currentUser?.role !== UserRole.ADMIN) return Promise.resolve([]);
    return Promise.resolve(institutes);
  },

  approveInstitute: (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return Promise.reject("Unauthorized");
    institutes = institutes.map(i => i.id === id ? { ...i, status: 'APPROVED' } : i);
    return Promise.resolve();
  },

  // --- Data Access Helpers (RLS Simulation) ---
  // Ensure users only see data for their institute
  
  getStudents: () => {
    if (!currentUser?.instituteId) return Promise.resolve([]);
    return Promise.resolve(students.filter(s => s.instituteId === currentUser?.instituteId));
  },
  
  addStudent: (student: Omit<Student, 'id' | 'instituteId'>) => {
    if (!currentUser?.instituteId) return Promise.reject("No institute");
    const newStudent = { 
        ...student, 
        id: Math.random().toString(36).substr(2, 9),
        instituteId: currentUser.instituteId 
    };
    students = [...students, newStudent];
    return Promise.resolve(newStudent);
  },

  updateStudent: (id: string, updates: Partial<Student>) => {
    students = students.map(s => s.id === id ? { ...s, ...updates } : s);
    return Promise.resolve();
  },

  getTeachers: () => {
    if (!currentUser?.instituteId) return Promise.resolve([]);
    return Promise.resolve(teachers.filter(t => t.instituteId === currentUser?.instituteId));
  },

  addTeacher: (teacher: Omit<Teacher, 'id' | 'instituteId'>) => {
    if (!currentUser?.instituteId) return Promise.reject("No institute");
    const newTeacher = { 
        ...teacher, 
        id: Math.random().toString(36).substr(2, 9),
        instituteId: currentUser.instituteId
    };
    teachers = [...teachers, newTeacher];
    // Also create a profile for them so they can login? 
    // In real app, this would be separate invite flow.
    return Promise.resolve(newTeacher);
  },

  updateTeacher: (id: string, updates: Partial<Teacher>) => {
    teachers = teachers.map(t => t.id === id ? { ...t, ...updates } : t);
    return Promise.resolve();
  },

  getClasses: () => {
    if (!currentUser?.instituteId) return Promise.resolve([]);
    let myClasses = classes.filter(c => c.instituteId === currentUser?.instituteId);
    
    // RLS: Teacher only sees their classes
    if (currentUser.role === UserRole.TEACHER) {
        // Find teacher profile ID (mock logic assuming currentUser.id matches teacher.id for simplicity in mock)
        // In real app, auth.uid links to teachers table.
        // For mock, we map manually in constants or use ID directly.
        myClasses = myClasses.filter(c => c.teacherId === currentUser?.id);
    }
    return Promise.resolve(myClasses);
  },

  addClass: (cls: Omit<ClassSession, 'id' | 'instituteId'>) => {
    if (!currentUser?.instituteId) return Promise.reject("No institute");
    const newClass = { 
        ...cls, 
        id: Math.random().toString(36).substr(2, 9),
        instituteId: currentUser.instituteId 
    };
    classes = [...classes, newClass];
    return Promise.resolve(newClass);
  },

  updateClass: (id: string, updates: Partial<ClassSession>) => {
    classes = classes.map(c => c.id === id ? { ...c, ...updates } : c);
    return Promise.resolve();
  },

  enrollStudent: (classId: string, studentId: string) => {
    classes = classes.map(c => {
      if (c.id === classId && !c.studentIds.includes(studentId)) {
        return { ...c, studentIds: [...c.studentIds, studentId] };
      }
      return c;
    });
    return Promise.resolve();
  },

  // --- Attendance ---
  getAllAttendance: () => {
    if (!currentUser?.instituteId) return Promise.resolve([]);
    return Promise.resolve(attendance.filter(a => a.instituteId === currentUser?.instituteId));
  },

  markAttendance: (records: AttendanceRecord[]) => {
    if (!currentUser?.instituteId) return Promise.reject("No institute");
    
    if (records.length === 0) return Promise.resolve();
    
    const { classId, date } = records[0];
    
    // Security check: Teacher can only mark their class
    if (currentUser.role === UserRole.TEACHER) {
        const cls = classes.find(c => c.id === classId);
        if (!cls || cls.teacherId !== currentUser.id) {
            return Promise.reject("Unauthorized: You can only mark attendance for your classes.");
        }
    }

    // Clean existing
    attendance = attendance.filter(a => !(a.classId === classId && a.date === date));
    
    // Inject instituteId
    const secureRecords = records.map(r => ({ ...r, instituteId: currentUser!.instituteId! }));
    attendance = [...attendance, ...secureRecords];
    return Promise.resolve();
  },

  // --- Finance ---
  getPayments: (month: string) => Promise.resolve(payments.filter(p => p.month === month && p.instituteId === currentUser?.instituteId)),
  
  togglePaymentStatus: (studentId: string, classId: string, month: string, amount: number) => {
    if (!currentUser?.instituteId) return Promise.reject("No institute");
    if (currentUser.role === UserRole.TEACHER) return Promise.reject("Teachers cannot manage fees.");

    const existingIdx = payments.findIndex(p => p.studentId === studentId && p.classId === classId && p.month === month);
    
    if (existingIdx >= 0) {
      const record = payments[existingIdx];
      const newStatus = record.status === 'PAID' ? 'PENDING' : 'PAID';
      payments[existingIdx] = { ...record, status: newStatus, datePaid: newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : undefined };
    } else {
      payments.push({
        id: Math.random().toString(36).substr(2, 9),
        instituteId: currentUser.instituteId,
        studentId,
        classId,
        month,
        amount,
        status: 'PAID',
        datePaid: new Date().toISOString().split('T')[0]
      });
    }
    return Promise.resolve();
  },
  
  calculateSalaries: (month: string): Promise<SalaryRecord[]> => {
    if (!currentUser?.instituteId) return Promise.resolve([]);
    if (currentUser.role === UserRole.TEACHER) return Promise.resolve([]); // Teachers don't see all salaries

    const myTeachers = teachers.filter(t => t.instituteId === currentUser?.instituteId);
    
    const salaryRecords: SalaryRecord[] = myTeachers.map(t => {
      const teacherClasses = classes.filter(c => c.teacherId === t.id);
      const totalStudents = teacherClasses.reduce((acc, curr) => acc + curr.studentIds.length, 0);
      const commissionAmount = totalStudents * t.commissionPerStudent;
      
      return {
        id: `sal-${t.id}-${month}`,
        instituteId: currentUser!.instituteId!,
        teacherId: t.id,
        month,
        baseAmount: t.baseSalary,
        commissionAmount,
        totalAmount: t.baseSalary + commissionAmount,
        status: 'PENDING' 
      };
    });
    return Promise.resolve(salaryRecords);
  },

  getFullDump: () => ({
    students: students.filter(s => s.instituteId === currentUser?.instituteId),
    teachers: teachers.filter(t => t.instituteId === currentUser?.instituteId),
    classes: classes.filter(c => c.instituteId === currentUser?.instituteId),
    attendance: attendance.filter(a => a.instituteId === currentUser?.instituteId),
    payments: payments.filter(p => p.instituteId === currentUser?.instituteId)
  })
};
