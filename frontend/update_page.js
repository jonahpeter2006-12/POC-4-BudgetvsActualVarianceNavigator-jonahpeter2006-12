const fs = require('fs');
const path = 'src/app/page.tsx';

const content = `"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Layers } from "lucide-react";

interface SummaryData {
  total_budget: number;
  total_actual: number;
  total_committed: number;
  variance: number;
  variance_pct: number;
  status: string;
}

interface DeptData {
  department: string;
  budget: number;
  actual: number;
  committed: number;
  variance: number;
  variance_pct: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [departments, setDepartments] = useState<DeptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, deptRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/summary"),
          fetch("http://127.0.0.1:8000/api/department-breakdown")
        ]);

        const sumData = await sumRes.json();
        const deptData = await deptRes.json();

        setSummary(sumData);
        setDepartments(deptData.departments || []);
      } catch (err) {
        console.error("Failed to fetch API data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-xl font-medium animate-pulse">Loading Financial Intelligence Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Budget vs Actual Variance Navigator
        </h1>
        <p className="text-slate-400 mt-1">Real-time financial variance tracking & department performance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Total Budget</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">\${summary?.total_budget.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Total Actual</span>
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">\${summary?.total_actual.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Net Variance</span>
            {summary && summary.variance > 0 ? (
              <TrendingUp className="w-5 h-5 text-rose-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <p className={\`text-2xl font-bold \${summary && summary.variance > 0 ? "text-rose-400" : "text-emerald-400"}\`}>
            \${summary?.variance.toLocaleString()} ({summary?.variance_pct}%)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Budget Status</span>
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{summary?.status}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Department Variance Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Actual</th>
                <th className="py-3 px-4">Committed</th>
                <th className="py-3 px-4">Variance (\$)</th>
                <th className="py-3 px-4">Variance (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {departments.map((dept, index) => (
                <tr key={index} className="hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-medium text-slate-100">{dept.department}</td>
                  <td className="py-3 px-4">\${dept.budget.toLocaleString()}</td>
                  <td className="py-3 px-4">\${dept.actual.toLocaleString()}</td>
                  <td className="py-3 px-4">\${dept.committed.toLocaleString()}</td>
                  <td className={\`py-3 px-4 font-semibold \${dept.variance > 0 ? "text-rose-400" : "text-emerald-400"}\`}>
                    \${dept.variance.toLocaleString()}
                  </td>
                  <td className={\`py-3 px-4 font-semibold \${dept.variance_pct > 0 ? "text-rose-400" : "text-emerald-400"}\`}>
                    {dept.variance_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully wrote page.tsx cleanly!");
`;

fs.writeFileSync('update_page.js', content, 'utf8');
console.log("Created update_page.js");