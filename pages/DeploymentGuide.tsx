import React from 'react';
import { Cloud, Database, Shield, Box, Terminal, Code } from 'lucide-react';

const Step = ({ number, title, children }: any) => (
  <div className="flex gap-4">
    <div className="flex-none">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
        {number}
      </div>
    </div>
    <div className="flex-1 pb-8 border-b border-slate-100 last:border-0">
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <div className="text-slate-600 space-y-2">{children}</div>
    </div>
  </div>
);

const CodeBlock = ({ children }: any) => (
  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto my-3">
    {children}
  </div>
);

export const DeploymentGuide = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Deployment & Security Guide</h1>
        <p className="text-blue-100 text-lg">
          Follow these steps to deploy EduFlow with <strong className="text-white">Multi-Tenancy Security</strong> (Row Level Security) enabled.
          <br/>
          <span className="font-mono text-sm bg-blue-800/50 px-2 py-1 rounded mt-2 inline-block">
             Supabase RLS • Isolation • Role Based Access
          </span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        
        <Step number="1" title="Database Schema with Isolation (Supabase)">
          <p>The "Unrestricted" warning exists because RLS is not enabled. We must enable it and add <code>institute_id</code> to every table.</p>
          <CodeBlock>
{`-- 1. Create Profile/Institute Tables
create table institutes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status text default 'PENDING', -- PENDING, APPROVED, REJECTED
  subscription_plan text default 'FREE',
  created_at timestamp with time zone default now()
);

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text default 'MANAGER', -- MANAGER, TEACHER, ADMIN
  institute_id uuid references institutes(id),
  avatar_url text
);

-- 2. Create Data Tables with institute_id
create table students (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references institutes(id) not null,
  name text not null,
  email text,
  -- ... other fields
);

-- 3. Teacher Salaries (For status tracking)
create table teacher_salaries (
  id uuid primary key default uuid_generate_v4(),
  institute_id uuid references institutes(id),
  teacher_id uuid references teachers(id),
  month text not null,
  amount numeric,
  status text default 'PAID',
  date_paid date default CURRENT_DATE
);
-- ... repeat for other tables (classes, attendance, payments)
`}
          </CodeBlock>
        </Step>

        <Step number="2" title="Enable Row Level Security (RLS)">
          <p>This is the critical step to separate data between institutes and roles. Run this in Supabase SQL Editor:</p>
          <CodeBlock>
{`-- Enable RLS on all tables
alter table institutes enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table teacher_salaries enable row level security;
-- ... repeat for all tables

-- POLICY 1: Managers can view EVERYTHING in their OWN institute
create policy "Managers view own institute data"
on students
for all
using (
  institute_id in (
    select institute_id from profiles 
    where id = auth.uid() 
    and role = 'MANAGER'
  )
);

-- POLICY 2: Teachers view classes assigned to them
create policy "Teachers view own classes"
on classes
for select
using (
  teacher_id in (select id from teachers where email = (select email from profiles where id = auth.uid()))
  -- simplistic mapping, usually requires linking auth.uid to teacher record
);

-- POLICY 3: Admin (You) can view everything
create policy "Admins view all"
on institutes
for all
using (
  auth.uid() in (select id from profiles where role = 'ADMIN')
);

-- POLICY 4: Allow Managers to manage salaries
create policy "Managers manage salaries"
on teacher_salaries
for all
using (
    institute_id in (
    select institute_id from profiles 
    where id = auth.uid() 
    and role = 'MANAGER'
  )
);`}
          </CodeBlock>
        </Step>

        <Step number="3" title="Authentication Trigger">
          <p>When a user signs up via Supabase Auth, we automatically create a Profile entry.</p>
          <CodeBlock>
{`create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, role, institute_id)
  values (new.id, new.email, 'MANAGER', null); -- Default or handled by metadata
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`}
          </CodeBlock>
        </Step>

        <Step number="4" title="Subscription & Approval Flow">
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            <li><strong>Registration:</strong> Use the App's registration form. This creates an `auth.user` and an `institute` record with status `PENDING`.</li>
            <li><strong>Approval:</strong> You (Admin) log in, query `institutes` where status is pending, and update to `APPROVED`.</li>
            <li><strong>Middleware:</strong> Your API/Backend should check `select status from institutes` before returning sensitive data.</li>
          </ul>
        </Step>

        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm mt-4">
            <strong>Security Critical:</strong> Never disable RLS on production. If RLS is off, any logged-in user with an API key can read all rows in the table, leaking data between institutes.
        </div>

      </div>
    </div>
  );
};