export enum UserRole {
  ADMIN = 'ADMIN',       // Platform Owner (You)
  MANAGER = 'MANAGER',   // Institute Admin
  TEACHER = 'TEACHER',   // Instructor
  STUDENT = 'STUDENT'    // (Optional future use)
}

export interface Institute {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  subscriptionPlan: 'FREE' | 'PRO';
  createdAt: string;
}

export interface UserProfile {
  id: string; // matches auth.uid
  email: string;
  name: string;
  role: UserRole;
  instituteId: string | null; // Null for Super Admin
  avatarUrl?: string;
}

export interface Student {
  id: string;
  instituteId: string;
  name: string;
  email: string;
  phone: string;
  enrolledDate: string;
  avatarUrl?: string;
}

export interface Teacher {
  id: string;
  instituteId: string;
  name: string;
  email: string;
  subjectSpecialty: string;
  baseSalary: number;
  commissionPerStudent: number; 
  avatarUrl?: string;
}

export interface ClassSession {
  id: string;
  instituteId: string;
  name: string; 
  code: string; 
  gradeYear: string; 
  teacherId: string;
  schedule: string; 
  feePerMonth: number;
  studentIds: string[];
}

export interface AttendanceRecord {
  id: string;
  instituteId: string;
  classId: string;
  date: string; 
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface PaymentRecord {
  id: string;
  instituteId: string;
  studentId: string;
  classId: string;
  month: string; 
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  datePaid?: string;
}

export interface SalaryRecord {
  id: string;
  instituteId: string;
  teacherId: string;
  month: string; 
  baseAmount: number;
  commissionAmount: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING';
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalRevenue: number;
  attendanceRate: number;
}
