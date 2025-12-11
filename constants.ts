import { Student, Teacher, ClassSession, AttendanceRecord, PaymentRecord, Institute, UserProfile, UserRole } from './types';

// Mock Institutes
export const MOCK_INSTITUTES: Institute[] = [
  { id: 'inst-1', name: 'Springfield High', status: 'APPROVED', subscriptionPlan: 'PRO', createdAt: '2023-01-01' },
  { id: 'inst-2', name: 'Pending Academy', status: 'PENDING', subscriptionPlan: 'FREE', createdAt: '2023-10-20' }
];

// Mock Users (Auth)
export const MOCK_PROFILES: UserProfile[] = [
  { id: 'admin-user', email: 'admin@platform.com', name: 'Super Admin', role: UserRole.ADMIN, instituteId: null },
  { id: 'manager-1', email: 'manager@springfield.com', name: 'Principal Skinner', role: UserRole.MANAGER, instituteId: 'inst-1' },
  { id: 'teacher-1', email: 'sarah@eduflow.com', name: 'Dr. Sarah Connor', role: UserRole.TEACHER, instituteId: 'inst-1' },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', instituteId: 'inst-1', name: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', enrolledDate: '2023-01-15' },
  { id: 's2', instituteId: 'inst-1', name: 'Bob Smith', email: 'bob@example.com', phone: '555-0102', enrolledDate: '2023-02-01' },
  { id: 's3', instituteId: 'inst-1', name: 'Charlie Davis', email: 'charlie@example.com', phone: '555-0103', enrolledDate: '2023-03-10' },
  { id: 's4', instituteId: 'inst-1', name: 'Diana Evans', email: 'diana@example.com', phone: '555-0104', enrolledDate: '2023-04-05' },
  { id: 's5', instituteId: 'inst-1', name: 'Ethan Hunt', email: 'ethan@example.com', phone: '555-0105', enrolledDate: '2023-05-20' },
];

// Corresponds to teacher-1 in profiles
export const MOCK_TEACHERS: Teacher[] = [
  { id: 'teacher-1', instituteId: 'inst-1', name: 'Dr. Sarah Connor', email: 'sarah@eduflow.com', subjectSpecialty: 'Physics', baseSalary: 2000, commissionPerStudent: 50 },
  { id: 't2', instituteId: 'inst-1', name: 'Prof. Alan Grant', email: 'alan@eduflow.com', subjectSpecialty: 'Biology', baseSalary: 1800, commissionPerStudent: 45 },
  { id: 't3', instituteId: 'inst-1', name: 'Ms. Katherine Johnson', email: 'katherine@eduflow.com', subjectSpecialty: 'Mathematics', baseSalary: 2200, commissionPerStudent: 60 },
];

export const MOCK_CLASSES: ClassSession[] = [
  { id: 'c1', instituteId: 'inst-1', name: 'Physics 101', code: 'PHY101', gradeYear: 'Year 1', teacherId: 'teacher-1', schedule: 'Mon/Wed 10:00 AM', feePerMonth: 100, studentIds: ['s1', 's2', 's5'] },
  { id: 'c2', instituteId: 'inst-1', name: 'Advanced Math', code: 'MAT201', gradeYear: 'Year 2', teacherId: 't3', schedule: 'Tue/Thu 2:00 PM', feePerMonth: 120, studentIds: ['s1', 's3', 's4'] },
  { id: 'c3', instituteId: 'inst-1', name: 'Biology Basics', code: 'BIO101', gradeYear: 'Year 1', teacherId: 't2', schedule: 'Fri 9:00 AM', feePerMonth: 90, studentIds: ['s2', 's3', 's5'] },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', instituteId: 'inst-1', classId: 'c1', date: '2023-10-01', studentId: 's1', status: 'PRESENT' },
  { id: 'a2', instituteId: 'inst-1', classId: 'c1', date: '2023-10-01', studentId: 's2', status: 'PRESENT' },
  { id: 'a3', instituteId: 'inst-1', classId: 'c1', date: '2023-10-01', studentId: 's5', status: 'ABSENT' },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'p1', instituteId: 'inst-1', studentId: 's1', classId: 'c1', month: '2023-10', amount: 100, status: 'PAID', datePaid: '2023-10-05' },
  { id: 'p2', instituteId: 'inst-1', studentId: 's2', classId: 'c1', month: '2023-10', amount: 100, status: 'PENDING' },
];
