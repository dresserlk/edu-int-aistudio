import React, { useState } from 'react';
import { Cloud, Database, Shield, Github, Terminal, CheckCircle, Copy, ChevronDown, ChevronRight } from 'lucide-react';

const CodeBlock = ({ label, code }: { label: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-300 font-bold">{label}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <CheckCircle className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? 'Copied' : 'Copy SQL'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs font-mono text-blue-100 leading-relaxed whitespace-pre">{code}</pre>
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children, isOpenDefault = false }: any) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="p-6 pt-0 border-t border-slate-100">
          <div className="pt-4 space-y-4 text-slate-600 leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DeploymentGuide = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Production Deployment Guide</h1>
        </div>
        <p className="text-slate-300 text-lg max-w-2xl">
          A complete step-by-step guide to deploying EduFlow Manager with <strong>Multi-Tenancy</strong>, <strong>Role-Based Access Control (RBAC)</strong>, and <strong>Automated CI/CD</strong>.
        </p>
      </div>

      <Section title="Phase 1: Database Schema (Supabase)" icon={Database} isOpenDefault={true}>
        <p>
          We need to create the tables to support institutes, users, and educational data. 
          Go to the <strong>Supabase Dashboard &gt; SQL Editor</strong> and run the following script.
        </p>
        
        <CodeBlock 
          label="1_create_tables.sql"
          code={`-- Enable UUID extension for unique IDs
create extension if not exists "uuid-ossp";

-- 1. Institutes Table (Tenants)
create table public.institutes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  subscription_plan text default 'FREE' check (subscription_plan in ('FREE', 'PRO')),
  created_at timestamp with time zone default now()
);

-- 2. Profiles Table (Links Supabase Auth Users to Institutes)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text default 'MANAGER' check (role in ('ADMIN', 'MANAGER', 'TEACHER')),
  institute_id uuid references public.institutes(id),
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 3. Teachers Table
create table public.teachers (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references public.institutes(id) not null,
  name text not null,
  email text,
  subject_specialty text,
  base_salary numeric default 0,
  commission_per_student numeric default 0,
  created_at timestamp with time zone default now()
);

-- 4. Students Table
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references public.institutes(id) not null,
  name text not null,
  email text,
  phone text,
  enrolled_date date default CURRENT_DATE,
  created_at timestamp with time zone default now()
);

-- 5. Classes Table
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references public.institutes(id) not null,
  name text not null,
  code text,
  grade_year text,
  teacher_id uuid references public.teachers(id),
  schedule text,
  fee_per_month numeric default 0,
  student_ids text[] default '{}',
  created_at timestamp with time zone default now()
);

-- 6. Attendance Table
create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references public.institutes(id) not null,
  class_id uuid references public.classes(id) not null,
  student_id uuid references public.students(id) not null,
  date date not null,
  status text check (status in ('PRESENT', 'ABSENT', 'LATE')),
  created_at timestamp with time zone default now()
);

-- 7. Payments Table
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references public.institutes(id) not null,
  student_id uuid references public.students(id) not null,
  class_id uuid references public.classes(id) not null,
  month text not null, -- Format YYYY-MM
  amount numeric not null,
  status text default 'PENDING' check (status in ('PAID', 'PENDING', 'OVERDUE')),
  date_paid date,
  created_at timestamp with time zone default now()
);`}
        />
      </Section>

      <Section title="Phase 2: Security & Multi-Tenancy (RLS)" icon={Shield}>
        <p className="mb-4">
          This is the most critical step. We enable <strong>Row Level Security (RLS)</strong> so Managers only see their own Institute's data.
        </p>

        <CodeBlock 
          label="2_security_policies.sql"
          code={`-- 1. Enable RLS on all tables
alter table public.institutes enable row level security;
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;

-- 2. Helper Functions
create or replace function get_my_institute_id()
returns uuid as $$
  select institute_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'ADMIN'
  );
$$ language sql security definer;

-- ==========================================
-- POLICIES
-- ==========================================

-- INSTITUTES: Allow public registration! (Critical for Sign Up)
create policy "Allow public registration" on public.institutes
  for insert with check (true);

create policy "Managers see own institute" on public.institutes
  for select using ( id = get_my_institute_id() );

-- PROFILES
create policy "Users can see own profile" on public.profiles
  for select using ( auth.uid() = id );

-- DATA TABLES
create policy "View own institute students" on public.students
  for all using ( institute_id = get_my_institute_id() );

create policy "View own institute teachers" on public.teachers
  for all using ( institute_id = get_my_institute_id() );

create policy "View own institute classes" on public.classes
  for all using ( institute_id = get_my_institute_id() );

create policy "View own institute payments" on public.payments
  for all using ( institute_id = get_my_institute_id() );

create policy "View own institute attendance" on public.attendance
  for all using ( institute_id = get_my_institute_id() );
`}
        />
      </Section>

      <Section title="Phase 3: Auth Triggers" icon={Terminal}>
        <p>Automatically create a user profile when they sign up.</p>
        <CodeBlock 
            label="3_auth_triggers.sql"
            code={`create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, institute_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'MANAGER'),
    (new.raw_user_meta_data->>'institute_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`} 
        />
      </Section>

      <Section title="Phase 4: Cloudflare & Environment Variables" icon={Cloud}>
        <p>In your Cloudflare Pages dashboard (Settings &gt; Environment Variables), add these 3 keys:</p>
        <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-sm mt-2 space-y-2">
            <div>
                <span className="text-blue-400">VITE_SUPABASE_URL</span>
                <span className="block text-slate-500 text-xs">From Supabase Settings &gt; API</span>
            </div>
            <div>
                <span className="text-blue-400">VITE_SUPABASE_ANON_KEY</span>
                <span className="block text-slate-500 text-xs">From Supabase Settings &gt; API</span>
            </div>
            <div>
                <span className="text-blue-400">API_KEY</span>
                <span className="block text-slate-500 text-xs">Google Gemini Key (For AI Advisor)</span>
            </div>
        </div>
      </Section>
    </div>
  );
};
