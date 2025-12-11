import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, BookOpen, UserCheck, Sparkles } from 'lucide-react';
import { DataService } from '../services/dataService';
import { GeminiService } from '../services/geminiService';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, revenue: 0 });
  const [graphData, setGraphData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
      const data = await DataService.getDashboardData();
      setStats(data.counts);
      setGraphData(data.revenueTrend);
      
      // Filter out zero values for cleaner pie chart
      const validPie = data.pieData.filter((d: any) => d.value > 0);
      setPieData(validPie.length > 0 ? validPie : [{ name: 'No Data', value: 1 }]); 
  };

  const handleGetInsights = async () => {
    setLoadingAi(true);
    const data = await DataService.getFullDump();
    const insight = await GeminiService.getInsights(data);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const COLORS = ['#0088FE', '#FFBB28', '#FF8042', '#00C49F'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <button 
          onClick={handleGetInsights}
          disabled={loadingAi}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {loadingAi ? 'Analyzing...' : 'Ask AI Advisor'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.students} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Teachers" value={stats.teachers} icon={BookOpen} color="bg-emerald-500" />
        <StatCard title="Total Classes" value={stats.classes} icon={UserCheck} color="bg-violet-500" />
        <StatCard title="Total Revenue" value={`$${stats.revenue}`} icon={DollarSign} color="bg-amber-500" />
      </div>

      {aiInsight && (
        <div className="bg-white border-l-4 border-violet-500 p-6 rounded-r-xl shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                <Sparkles className="w-5 h-5 text-violet-500 mr-2" /> 
                AI Executive Summary
            </h3>
            <div className="prose prose-sm max-w-none text-slate-600">
                <pre className="whitespace-pre-wrap font-sans">{aiInsight}</pre>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="uv" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Fee Collection Status (Current Month)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};