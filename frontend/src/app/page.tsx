'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // State for backend data
  const [summary, setSummary] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from FastAPI backend on load
  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        
        const summaryRes = await fetch(`${apiUrl}/api/summary`);
        const summaryData = await summaryRes.json();
        setSummary(summaryData);

        const deptRes = await fetch(`${apiUrl}/api/department-breakdown`);
        const deptData = await deptRes.json();
        setDepartments(deptData);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch backend telemetry:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 font-sans overflow-hidden">
      
      {/* PERSISTENT SIDEBAR */}
      <aside className={`bg-[#0f172a] border-r border-slate-800 transition-all duration-300 flex flex-col justify-between ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            {sidebarOpen && <span className="font-bold text-cyan-400 tracking-wider">INFOCREON</span>}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span>📊</span>
              {sidebarOpen && <span>Overview & Variance</span>}
            </button>
            
            <button 
              onClick={() => setActiveTab('departments')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'departments' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span>🏢</span>
              {sidebarOpen && <span>Department Breakdown</span>}
            </button>

            <button 
              onClick={() => setActiveTab('trends')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'trends' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span>📈</span>
              {sidebarOpen && <span>Monthly Trends</span>}
            </button>
          </nav>
        </div>

        {/* DEVELOPER SIGNATURE (Pinned cleanly at the bottom) */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-[#0b0f19]/40">
          {sidebarOpen ? (
            <div>
              <p className="text-slate-300 font-medium">Infocreon Internship</p>
              <p className="text-cyan-400 font-semibold mt-0.5">Developer: Jona Peter</p>
              <p className="text-slate-500 text-[10px] mt-1">Batch 8 | PoC 4 Navigator</p>
            </div>
          ) : (
            <span className="text-cyan-400 font-bold block text-center">JP</span>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-widest block">Infocreon Internship — Financial Intelligence Rail</span>
            <h1 className="text-lg font-bold text-slate-100">Budget vs Actual Variance Navigator</h1>
          </div>
          <button 
            onClick={() => setDrawerOpen(true)}
            className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all"
          >
            ⚡ Open Intelligence Panel
          </button>
        </header>

        {/* Dynamic Dashboard Body */}
        <div className="p-6 flex-1 space-y-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Budget</p>
                  <h3 className="text-2xl font-bold text-white mt-1">$6,01,000</h3>
                </div>
                <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Actual</p>
                  <h3 className="text-2xl font-bold text-white mt-1">$6,33,000</h3>
                </div>
                <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Net Variance</p>
                  <h3 className="text-2xl font-bold text-rose-400 mt-1">$32,000 (5.32%)</h3>
                </div>
                <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Budget Status</p>
                  <h3 className="text-2xl font-bold text-rose-400 mt-1">Over Budget</h3>
                </div>
              </div>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-200 mb-1">Monthly Performance Trajectory</h3>
                    <p className="text-xs text-slate-400 mb-6">Jan 2026 – Mar 2026 Budget vs Actual Spend</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>January</span>
                        <span className="text-emerald-400">Under Budget (-2.1%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                        <div className="bg-cyan-500 h-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>February</span>
                        <span className="text-emerald-400">On Track (0.0%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                        <div className="bg-cyan-500 h-full" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>March</span>
                        <span className="text-rose-400">Over Budget (+7.4%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                        <div className="bg-rose-500 h-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-200">Variance Waterfall Bridge</h3>
                      <p className="text-xs text-slate-400">Baseline vs Net Variance Impact</p>
                    </div>
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">Live Bridge</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-sm">
                      <span className="text-slate-300">Baseline Budget</span>
                      <span className="font-semibold text-white">$6,01,000</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-rose-950/20 rounded-lg border border-rose-500/20 text-sm">
                      <span className="text-slate-300">Engineering Variance</span>
                      <span className="font-semibold text-rose-400">+$13,000</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-rose-950/20 rounded-lg border border-rose-500/20 text-sm">
                      <span className="text-slate-300">Marketing Variance</span>
                      <span className="font-semibold text-rose-400">+$12,000</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-sm">
                      <span className="text-slate-300">Total Actual Impact</span>
                      <span className="font-semibold text-white">$6,33,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-200">Department Variance Breakdown</h3>
                <div className="flex gap-2 text-xs">
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">All Departments</span>
                  <span className="px-3 py-1 bg-slate-800 rounded-md text-slate-400">Engineering</span>
                  <span className="px-3 py-1 bg-slate-800 rounded-md text-slate-400">Sales</span>
                  <span className="px-3 py-1 bg-slate-800 rounded-md text-slate-400">Marketing</span>
                </div>
              </div>

              <table className="w-full text-left text-sm text-slate-300 min-w-[650px]">
                <thead className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Budget</th>
                    <th className="pb-3">Actual</th>
                    <th className="pb-3">Committed</th>
                    <th className="pb-3">Variance ($)</th>
                    <th className="pb-3">Variance (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-3 font-medium text-white flex items-center gap-2">
                      Engineering <span className="text-xs text-cyan-400 cursor-pointer underline">Inspect</span>
                    </td>
                    <td className="py-3">$1,95,000</td>
                    <td className="py-3">$2,08,000</td>
                    <td className="py-3">$9,000</td>
                    <td className="py-3 text-rose-400">+$13,000</td>
                    <td className="py-3 text-rose-400">6.67%</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-3 font-medium text-white flex items-center gap-2">
                      Sales <span className="text-xs text-cyan-400 cursor-pointer underline">Inspect</span>
                    </td>
                    <td className="py-3">$1,50,000</td>
                    <td className="py-3">$1,45,000</td>
                    <td className="py-3">$5,000</td>
                    <td className="py-3 text-emerald-400">-$5,000</td>
                    <td className="py-3 text-emerald-400">-3.33%</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-3 font-medium text-white flex items-center gap-2">
                      Marketing <span className="text-xs text-cyan-400 cursor-pointer underline">Inspect</span>
                    </td>
                    <td className="py-3">$1,20,000</td>
                    <td className="py-3">$1,32,000</td>
                    <td className="py-3">$4,000</td>
                    <td className="py-3 text-rose-400">+$12,000</td>
                    <td className="py-3 text-rose-400">10.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* MONTHLY TRENDS TAB */}
          {activeTab === 'trends' && (
            <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg space-y-6">
              <h3 className="text-base font-semibold text-slate-200">Monthly Financial Trends & Projections</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Jan Burn Rate</span>
                  <p className="text-xl font-bold text-white">$1,98,000</p>
                  <span className="text-xs text-emerald-400 mt-1 block">↓ 2.1% under projected limit</span>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Feb Burn Rate</span>
                  <p className="text-xl font-bold text-white">$2,01,000</p>
                  <span className="text-xs text-emerald-400 mt-1 block">→ On target projection</span>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Mar Burn Rate</span>
                  <p className="text-xl font-bold text-white">$2,34,000</p>
                  <span className="text-xs text-rose-400 mt-1 block">↑ 7.4% surge detected</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* SLIDE-OVER INTELLIGENCE DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-96 bg-[#0f172a] border-l border-slate-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="font-semibold text-cyan-400">Intelligence Drawer ⚡</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 py-4 space-y-4 text-sm text-slate-300 overflow-y-auto">
              <p className="text-xs text-slate-400">Real-time financial variance tracking & slide-over intelligence engine telemetry.</p>
              
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg">
                <span className="text-xs text-rose-400 font-semibold block mb-1">CRITICAL ANOMALY DETECTED</span>
                Engineering overrun exceeded threshold by 6.67% driven by unbudgeted server instances.
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="text-xs text-cyan-400 font-semibold block mb-1">AI RECOMMENDATION</span>
                Reallocate $10,000 surplus from Sales department buffer into Marketing digital acquisition pool.
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="text-xs text-amber-400 font-semibold block mb-1">FORECAST ALERT</span>
                Q2 projections indicate a potential 8.5% deficit if cloud scaling policies remain unoptimized.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}