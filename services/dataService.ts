import { supabase } from './supabaseClient';
import { 
  Student, Teacher, ClassSession, AttendanceRecord, PaymentRecord, SalaryRecord, UserProfile, Institute, UserRole
} from '../types';

// Helper to map DB snake_case to TS camelCase
const mapProfile = (p: any): UserProfile => ({
  id: p.id,
  email: p.email,
  name: p.name,
  role: p.role as UserRole,
  instituteId: p.institute_id,
  avatarUrl: p.avatar_url
});

const mapInstitute = (i: any): Institute => ({
    id: i.id,
    name: i.name,
    status: i.status,
    subscriptionPlan: i.subscription_plan,
    createdAt: i.created_at
});

const mapStudent = (s: any): Student => ({
    id: s.id,
    instituteId: s.institute_id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    enrolledDate: s.enrolled_date || s.created_at
});

const mapTeacher = (t: any): Teacher => ({
    id: t.id,
    instituteId: t.institute_id,
    name: t.name,
    email: t.email,
    subjectSpecialty: t.subject_specialty,
    baseSalary: t.base_salary,
    commissionPerStudent: t.commission_per_student
});

const mapClass = (c: any): ClassSession => ({
    id: c.id,
    instituteId: c.institute_id,
    name: c.name,
    code: c.code,
    gradeYear: c.grade_year,
    teacherId: c.teacher_id,
    schedule: c.schedule,
    feePerMonth: c.fee_per_month,
    studentIds: c.student_ids || []
});

export const DataService = {
  // --- Auth & Session ---
  async login(email: string) {
     // NOTE: We are using Password login. Make sure your Auth component sends password.
     // For this architecture, we rely on Supabase handling the session.
     // This method is mainly used to fetch the profile AFTER auth or check existing session.
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("Not authenticated");
     
     const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
     if (error || !profile) throw new Error("Profile not found");
     
     // Check Institute Status
     if (profile.role !== UserRole.ADMIN && profile.institute_id) {
         const { data: inst } = await supabase.from('institutes').select('status').eq('id', profile.institute_id).single();
         if (inst?.status !== 'APPROVED') throw new Error("Institute is pending approval.");
     }
     
     return mapProfile(profile);
  },
  
  async logout() {
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<UserProfile | null> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      return data ? mapProfile(data) : null;
  },

  // --- Registration Flow ---
  async registerInstitute(instituteName: string, managerName: string, email: string, password: string) {
    // 1. Create Institute (Needs RLS policy allowing public insert, or use Edge Function)
    const { data: instData, error: instError } = await supabase
        .from('institutes')
        .insert({ name: instituteName, status: 'PENDING' })
        .select()
        .single();
        
    if (instError) throw new Error("Failed to create institute: " + instError.message);

    // 2. Sign Up User linked to this Institute
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: managerName,
                role: 'MANAGER',
                institute_id: instData.id
            }
        }
    });

    if (authError) throw new Error("Failed to create user: " + authError.message);
    return authData;
  },

  // --- Admin ---
  async getAllInstitutes() {
    const { data } = await supabase.from('institutes').select('*');
    return (data || []).map(mapInstitute);
  },

  async approveInstitute(id: string) {
    await supabase.from('institutes').update({ status: 'APPROVED' }).eq('id', id);
  },

  // --- Data Access ---
  
  async getStudents() {
    const { data } = await supabase.from('students').select('*');
    return (data || []).map(mapStudent);
  },
  
  async addStudent(student: any) {
    const user = await this.getCurrentUser();
    if (!user?.instituteId) throw new Error("No institute");
    
    const { error } = await supabase.from('students').insert({
        institute_id: user.instituteId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        enrolled_date: student.enrolledDate
    });
    if (error) console.error(error);
  },

  async updateStudent(id: string, updates: any) {
    await supabase.from('students').update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone
    }).eq('id', id);
  },

  async getTeachers() {
    const { data } = await supabase.from('teachers').select('*');
    return (data || []).map(mapTeacher);
  },

  async addTeacher(teacher: any) {
    const user = await this.getCurrentUser();
    if (!user?.instituteId) throw new Error("No institute");

    await supabase.from('teachers').insert({
        institute_id: user.instituteId,
        name: teacher.name,
        email: teacher.email,
        subject_specialty: teacher.subjectSpecialty,
        base_salary: teacher.baseSalary,
        commission_per_student: teacher.commissionPerStudent
    });
  },

  async updateTeacher(id: string, updates: any) {
    await supabase.from('teachers').update({
        name: updates.name,
        email: updates.email,
        subject_specialty: updates.subjectSpecialty,
        base_salary: updates.baseSalary
    }).eq('id', id);
  },

  async getClasses() {
    const { data } = await supabase.from('classes').select('*');
    return (data || []).map(mapClass);
  },

  async addClass(cls: any) {
    const user = await this.getCurrentUser();
    if (!user?.instituteId) throw new Error("No institute");

    await supabase.from('classes').insert({
        institute_id: user.instituteId,
        name: cls.name,
        code: cls.code,
        grade_year: cls.gradeYear,
        teacher_id: cls.teacherId,
        schedule: cls.schedule,
        fee_per_month: cls.feePerMonth,
        student_ids: []
    });
  },

  async updateClass(id: string, updates: any) {
    // Map camelCase updates back to snake_case if necessary
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.feePerMonth) payload.fee_per_month = updates.feePerMonth;
    if (updates.teacherId) payload.teacher_id = updates.teacherId;
    
    await supabase.from('classes').update(payload).eq('id', id);
  },

  async enrollStudent(classId: string, studentId: string) {
    // This is tricky with arrays in Postgres.
    // simpler to fetch, append, update.
    const { data: cls } = await supabase.from('classes').select('student_ids').eq('id', classId).single();
    if (cls) {
        const currentIds = cls.student_ids || [];
        if (!currentIds.includes(studentId)) {
            await supabase.from('classes').update({ student_ids: [...currentIds, studentId] }).eq('id', classId);
        }
    }
  },

  // --- Attendance ---
  async getAllAttendance() {
    const { data } = await supabase.from('attendance').select('*');
    return (data || []).map(a => ({
        id: a.id,
        instituteId: a.institute_id,
        classId: a.class_id,
        studentId: a.student_id,
        date: a.date,
        status: a.status
    }));
  },

  async markAttendance(records: AttendanceRecord[]) {
    if (records.length === 0) return;
    const user = await this.getCurrentUser();

    // Transform to DB format
    const dbRecords = records.map(r => ({
        institute_id: user?.instituteId,
        class_id: r.classId,
        student_id: r.studentId,
        date: r.date,
        status: r.status
    }));

    // Upsert isn't directly supported nicely for batch with conflict on constraints unless configured.
    // For simplicity, we delete existing for this date/class and insert new.
    const classId = records[0].classId;
    const date = records[0].date;
    
    await supabase.from('attendance').delete().match({ class_id: classId, date: date });
    await supabase.from('attendance').insert(dbRecords);
  },

  // --- Finance ---
  async getPayments(month: string) {
    const { data } = await supabase.from('payments').select('*').eq('month', month);
    return (data || []).map(p => ({
        id: p.id,
        instituteId: p.institute_id,
        studentId: p.student_id,
        classId: p.class_id,
        month: p.month,
        amount: p.amount,
        status: p.status,
        datePaid: p.date_paid
    }));
  },
  
  async togglePaymentStatus(studentId: string, classId: string, month: string, amount: number) {
    const user = await this.getCurrentUser();
    // Check if exists
    const { data: existing } = await supabase.from('payments')
        .select('*')
        .match({ student_id: studentId, class_id: classId, month: month })
        .single();

    if (existing) {
        const newStatus = existing.status === 'PAID' ? 'PENDING' : 'PAID';
        await supabase.from('payments').update({
            status: newStatus,
            date_paid: newStatus === 'PAID' ? new Date().toISOString() : null
        }).eq('id', existing.id);
    } else {
        await supabase.from('payments').insert({
            institute_id: user?.instituteId,
            student_id: studentId,
            class_id: classId,
            month,
            amount,
            status: 'PAID',
            date_paid: new Date().toISOString()
        });
    }
  },
  
  async calculateSalaries(month: string): Promise<SalaryRecord[]> {
    // This logic is complex to do purely in SQL without a function.
    // We fetch data and calculate in JS for now (client-side aggregation).
    // In production, use a Postgres Function or Edge Function.
    
    const teachers = await this.getTeachers();
    const classes = await this.getClasses();
    const user = await this.getCurrentUser();

    if (!user?.instituteId) return [];

    return teachers.map(t => {
      const teacherClasses = classes.filter(c => c.teacherId === t.id);
      const totalStudents = teacherClasses.reduce((acc, curr) => acc + curr.studentIds.length, 0);
      const commissionAmount = totalStudents * t.commissionPerStudent;
      
      return {
        id: `sal-${t.id}-${month}`,
        instituteId: user.instituteId!,
        teacherId: t.id,
        month,
        baseAmount: t.baseSalary,
        commissionAmount,
        totalAmount: t.baseSalary + commissionAmount,
        status: 'PENDING' 
      };
    });
  },

  async getFullDump() {
    // Parallel fetch for Gemini
    const [s, t, c, a, p] = await Promise.all([
        this.getStudents(),
        this.getTeachers(),
        this.getClasses(),
        this.getAllAttendance(),
        this.getPayments(new Date().toISOString().slice(0, 7))
    ]);
    return { students: s, teachers: t, classes: c, attendance: a, payments: p };
  }
};
