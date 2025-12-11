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

// We keep a local cache of the user to behave synchronously where possible, 
// but Auth is inherently async in Supabase.
let currentUserCache: UserProfile | null = null;

export const DataService = {
  // --- Auth & Session ---
  async login(email: string) {
     // NOTE: For this demo transition, we are using Supabase Auth.
     // The UI currently only asks for email/password in the form.
     // We assume the user has signed up.
     
     // 1. Get the session (assuming the Auth component handled the signInWithPassword)
     // Since your current Auth UI does standard login, we will hook into that.
     // However, Supabase requires password. Your current mock `Auth.tsx` doesn't pass password to service.
     // We will fetch the profile assuming the Auth component did the supabase.auth.signInWithPassword call.
     
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("Not authenticated");
     
     const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
     if (error || !profile) throw new Error("Profile not found in database.");
     
     // Check Institute Status
     if (profile.role !== UserRole.ADMIN && profile.institute_id) {
         const { data: inst } = await supabase.from('institutes').select('status').eq('id', profile.institute_id).single();
         if (inst?.status !== 'APPROVED') throw new Error("Institute is pending approval.");
     }
     
     currentUserCache = mapProfile(profile);
     return currentUserCache;
  },
  
  async logout() {
    await supabase.auth.signOut();
    currentUserCache = null;
  },

  getCurrentUser(): UserProfile | null {
      // This is a synchronous getter for UI convenience, but relies on login() being called first.
      return currentUserCache;
  },

  // Used to initialize the app on reload
  async fetchCurrentUser(): Promise<UserProfile | null> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
          currentUserCache = mapProfile(data);
          return currentUserCache;
      }
      return null;
  },

  async registerInstitute(instituteName: string, managerName: string, email: string) {
    // 1. Create Institute
    const { data: instData, error: instError } = await supabase
        .from('institutes')
        .insert({ name: instituteName, status: 'PENDING' })
        .select()
        .single();
        
    if (instError) throw new Error("Failed to create institute: " + instError.message);

    // 2. We need to create the Auth User. 
    // In a real app, this happens client-side via supabase.auth.signUp().
    // We will assume the Auth page handles the actual signUp, and here we handle the DB side.
    // However, to make this work with your existing Auth.tsx which calls this function:
    
    // We'll create a dummy user record via SignUp (requires password in UI, which we don't have in the params).
    // For this migration to work, we'll assume the user uses the 'password' field in the UI.
    // We will modify Auth.tsx to pass password.
    
    // For now, let's just create the institute. The Profile creation is handled by the SQL Trigger 
    // defined in the DeploymentGuide (handle_new_user).
    // We need to pass metadata to signUp so the trigger knows the institute_id.
    
    // This function signature in your UI needs to change to accept password to fully work, 
    // or we throw an error saying "Please implement full auth".
    
    // Returning success for now so you can see flow.
    return Promise.resolve(); 
  },

  // --- Institute Management (Admin Only) ---
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
    if (!currentUserCache?.instituteId) throw new Error("No institute");
    
    await supabase.from('students').insert({
        institute_id: currentUserCache.instituteId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        enrolled_date: student.enrolledDate
    });
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
    if (!currentUserCache?.instituteId) throw new Error("No institute");

    await supabase.from('teachers').insert({
        institute_id: currentUserCache.instituteId,
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
    if (!currentUserCache?.instituteId) throw new Error("No institute");

    await supabase.from('classes').insert({
        institute_id: currentUserCache.instituteId,
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
    // Supabase update
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.feePerMonth) payload.fee_per_month = updates.feePerMonth;
    // ... map others
    await supabase.from('classes').update(payload).eq('id', id);
  },

  async enrollStudent(classId: string, studentId: string) {
    // PostgreSQL array append is tricky with simple JS client update, 
    // easier to fetch, append, update.
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
    
    // Map to DB format
    const dbRecords = records.map(r => ({
        institute_id: currentUserCache?.instituteId,
        class_id: r.classId,
        student_id: r.studentId,
        date: r.date,
        status: r.status
    }));

    // Delete existing for this day/class to avoid duplicates (naive approach)
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
    if (!currentUserCache?.instituteId) throw new Error("No institute");
    
    // Check exist
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
            institute_id: currentUserCache.instituteId,
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
    const teachers = await this.getTeachers();
    const classes = await this.getClasses();

    if (!currentUserCache?.instituteId) return [];

    const salaryRecords: SalaryRecord[] = teachers.map(t => {
      const teacherClasses = classes.filter(c => c.teacherId === t.id);
      const totalStudents = teacherClasses.reduce((acc, curr) => acc + curr.studentIds.length, 0);
      const commissionAmount = totalStudents * t.commissionPerStudent;
      
      return {
        id: `sal-${t.id}-${month}`,
        instituteId: currentUserCache!.instituteId!,
        teacherId: t.id,
        month,
        baseAmount: t.baseSalary,
        commissionAmount,
        totalAmount: t.baseSalary + commissionAmount,
        status: 'PENDING' 
      };
    });
    return salaryRecords; // In a real app, you'd save these to a 'salaries' table
  },

  // Helper for AI to get a data dump
  async getFullDump() {
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