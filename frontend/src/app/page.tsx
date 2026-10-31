'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
} from 'recharts';

type Row = Record<string, any>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const number = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const field = (row: Row, ...keys: string[]) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
};

const rowsFrom = (data: any, ...keys: string[]): Row[] => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

const formatMonth = (value: string) => {
  const date = new Date(`${value} 1`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const panel =
  'rounded-2xl border border-[#343044] bg-[#11101a]/90 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)]';
const chartColor = {
  grid: '#302c3d',
  tick: '#a6a0b5',
  budget: '#8b9bb4',
  actual: '#e58b9b',
  forecast: '#b7a4ef',
  accent: '#a99ae8',
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          {eyebrow}
        </p>
      )}
      <h2 className="text-base font-semibold tracking-wide text-[#f1edf8]">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 text-xs leading-relaxed text-[#9e98ad]">
          {description}
        </p>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'violet';
  onClick: () => void;
}) {
  const toneClass = {
    neutral: 'text-[#f2eef8]',
    positive: 'text-emerald-300',
    negative: 'text-rose-300',
    violet: 'text-violet-200',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-2xl border border-[#393448] bg-gradient-to-br from-[#1b1927] to-[#12111a] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/40 hover:shadow-[0_14px_35px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a49db3]">
          {label}
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-violet-300/70 transition group-hover:scale-150" />
      </div>
      <p className={`mt-4 break-words text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-[#8f899e]">{detail}</p>
      <p className="mt-4 text-[10px] font-medium uppercase tracking-wider text-violet-300/70">
        View insight ↗
      </p>
    </button>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#484158] bg-[#171521] px-3 py-2 shadow-xl">
      {label && <p className="mb-2 text-xs font-semibold text-[#eee9f6]">{label}</p>}
      {payload.map((item: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: item.color || '#eee9f6' }}>
          {item.name || item.dataKey}: {typeof item.value === 'number' ? money(item.value) : item.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Row | null>(null);

  const [summary, setSummary] = useState<Row | null>(null);
  const [departments, setDepartments] = useState<Row[]>([]);
  const [monthly, setMonthly] = useState<Row[]>([]);
  const [heatmap, setHeatmap] = useState<Row[]>([]);
  const [forecast, setForecast] = useState<Row[]>([]);
  const [waterfallInfo, setWaterfallInfo] = useState<Row | null>(null);

  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const openInsight = (data?: Row, title?: string) => {
    setSelectedInsight(data ? { ...data, _insightTitle: title || 'Selected data point' } : null);
    setDrawerOpen(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (selectedDepartment !== 'All Departments') {
          params.set('department', selectedDepartment);
        }
        if (selectedMonth !== 'All Months') {
          params.set('month', selectedMonth);
        }
        const filterQuery = params.toString() ? `?${params.toString()}` : '';
        const forecastParams = new URLSearchParams(params);
        forecastParams.set('range_pct', '10');

        const urls = [
          `${API_URL}/api/summary${filterQuery}`,
          `${API_URL}/api/department-breakdown${filterQuery}`,
          `${API_URL}/api/monthly-trends${filterQuery}`,
          `${API_URL}/api/department-heatmap${filterQuery}`,
          `${API_URL}/api/forecast?${forecastParams.toString()}`,
          `${API_URL}/api/waterfall${filterQuery}`,
          `${API_URL}/api/department-breakdown`,
          `${API_URL}/api/monthly-trends`,
        ];

        const responses = await Promise.all(
          urls.map((url) => fetch(url, { cache: 'no-store' }))
        );

        for (const response of responses) {
          if (!response.ok) {
            let message = `Backend request failed (${response.status})`;
            try {
              const data = await response.json();
              if (data?.detail) {
                message = typeof data.detail === 'string'
                  ? data.detail
                  : JSON.stringify(data.detail);
              }
            } catch {
              // Retain the HTTP status message.
            }
            throw new Error(message);
          }
        }

        const [
          summaryData,
          departmentData,
          monthlyData,
          heatmapData,
          forecastData,
          waterfallData,
          allDepartmentData,
          allMonthlyData,
        ] = await Promise.all(responses.map((response) => response.json()));

        if (cancelled) return;

        setSummary(summaryData);
        setDepartments(rowsFrom(departmentData, 'departments', 'data', 'results'));
        setMonthly(rowsFrom(monthlyData, 'monthly_trends', 'trends', 'data', 'results'));
        setHeatmap(rowsFrom(heatmapData, 'heatmap', 'data', 'results'));
        setForecast(rowsFrom(forecastData, 'forecast', 'data', 'results'));
        setWaterfallInfo(waterfallData);

        const allDepartmentRows = rowsFrom(
          allDepartmentData, 'departments', 'data', 'results'
        );
        setAvailableDepartments(
          Array.from(new Set(
            allDepartmentRows
              .map((row) => String(field(row, 'department', 'name') || ''))
              .filter(Boolean)
          ))
        );

        const allMonthRows = rowsFrom(
          allMonthlyData, 'monthly_trends', 'trends', 'data', 'results'
        );
        setAvailableMonths(
          Array.from(new Set(
            allMonthRows
              .map((row) => String(field(row, 'month', 'period') || ''))
              .filter(Boolean)
          ))
        );
      } catch (err) {
        if (!cancelled) {
          console.error('Dashboard loading error:', err);
          setError(err instanceof Error ? err.message : 'Unable to connect to the backend.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [selectedDepartment, selectedMonth]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMetadataOpen(false);
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const budget = number(field(summary || {}, 'total_budget', 'budget_total', 'budget_amount'));
  const actual = number(field(summary || {}, 'total_actual', 'actual_total', 'actual_amount'));
  const committed = number(field(summary || {}, 'total_committed', 'committed_total', 'committed_amount'));
  const forecastTotal = number(field(summary || {}, 'total_forecast', 'forecast_total', 'forecast_amount'));
  const variance = number(field(summary || {}, 'variance', 'total_variance'));
  const variancePct = number(field(summary || {}, 'variance_pct', 'variance_percentage'));
  const budgetStatus = String(
    field(summary || {}, 'status', 'budget_status') ||
    (variance > 0 ? 'Over Budget' : 'Within Budget')
  );

  const monthlyChartData = monthly.map((row) => ({
    ...row,
    month: formatMonth(String(field(row, 'month', 'period') || '')),
    budget: number(field(row, 'budget_amount', 'budget')),
    actual: number(field(row, 'actual_amount', 'actual')),
    forecast: number(field(row, 'forecast_amount', 'forecast')),
  }));

  const waterfallData = useMemo(() => {
    let running = budget;
    const steps = departments.map((row) => {
      const amount = number(field(row, 'variance', 'variance_amount', 'total_variance'));
      const previous = running;
      running += amount;
      return {
        name: String(field(row, 'department', 'name') || 'Department'),
        base: Math.min(previous, running),
        change: Math.abs(amount),
        amount,
        total: 0,
        color: amount > 0 ? '#df899b' : '#77c6a8',
      };
    });

    return [
      { name: 'Budget', base: 0, change: 0, total: budget, amount: budget, color: '#9cadd0' },
      ...steps,
      { name: 'Actual', base: 0, change: 0, total: actual, amount: actual, color: '#b7a4ef' },
    ];
  }, [budget, actual, departments]);

  const forecastChartData = forecast.map((row) => {
    const lower = number(field(row, 'lower_bound', 'lower', 'lower_forecast'));
    const upper = number(field(row, 'upper_bound', 'upper', 'upper_forecast'));
    return {
      ...row,
      month: formatMonth(String(field(row, 'month', 'period') || selectedMonth)),
      forecast: number(field(row, 'forecast_amount', 'forecast', 'value')),
      lower,
      range: Math.max(0, upper - lower),
    };
  });

  const reconciliation =
    waterfallInfo?.reconciliation || waterfallInfo?.reconciliation_check;
  const reconciles = typeof reconciliation === 'boolean'
    ? reconciliation
    : field(reconciliation || {}, 'reconciles', 'is_reconciled');

  const varianceTone = variance > 0 ? 'negative' : 'positive';
  const navItems = [
    { id: 'overview', label: 'Overview', short: '01' },
    { id: 'departments', label: 'Departments', short: '02' },
    { id: 'trends', label: 'Trends', short: '03' },
    { id: 'heatmap', label: 'Heatmap', short: '04' },
    { id: 'forecast', label: 'Forecast', short: '05' },
  ];

  const filterLabel = [
    selectedDepartment === 'All Departments' ? 'All departments' : selectedDepartment,
    selectedMonth === 'All Months' ? 'All periods' : selectedMonth,
  ].join(' / ');

  return (
    <main className="min-h-screen overflow-hidden bg-[#090810] text-[#eeeaf5]">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -right-40 -top-48 h-[520px] w-[520px] rounded-full bg-violet-500/[0.07] blur-[120px]" />
        <div className="absolute -bottom-56 -left-40 h-[480px] w-[480px] rounded-full bg-indigo-500/[0.06] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(180,170,210,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(180,170,210,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[1800px]">
        <header className="border-b border-[#302b3c] bg-[#0b0a12]/85 px-4 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-300/[0.08] text-sm font-bold tracking-tight text-violet-200">
                IN
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-violet-300">
                  Infocreon Internship
                </p>
                <h1 className="mt-1 truncate text-sm font-semibold tracking-wide text-[#f2eef8] sm:text-base">
                  Infocreon Internship - Budget vs Actual Variance Navigator
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-[#3a3548] px-3 py-2 text-[10px] uppercase tracking-wider text-[#a49db3] sm:inline-flex">
                PoC-4 · Batch 8
              </span>
              <button
                type="button"
                onClick={() => setMetadataOpen(true)}
                aria-label="Open application metadata"
                className="flex h-10 items-center gap-2 rounded-xl border border-[#464054] bg-[#171521] px-3 text-xs font-medium text-[#d9d2e5] transition hover:border-violet-300/50 hover:text-white"
              >
                <span className="text-violet-200">ⓘ</span>
                <span className="hidden sm:inline">Project details</span>
              </button>
            </div>
          </div>

          <nav aria-label="Dashboard sections" className="mt-5 flex gap-1 overflow-x-auto border-t border-[#292536] pt-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                  activeTab === item.id
                    ? 'bg-violet-300/[0.12] text-violet-100 ring-1 ring-inset ring-violet-300/25'
                    : 'text-[#918a9f] hover:bg-white/[0.04] hover:text-[#e9e3f1]'
                }`}
              >
                <span className="text-[9px] opacity-60">{item.short}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="space-y-6 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-300/80">
                Financial intelligence / Control room
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f4f0f8] sm:text-3xl">
                {activeTab === 'overview' ? 'Financial position' : navItems.find((item) => item.id === activeTab)?.label}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9b95a9]">
                A focused view of budget performance, variance drivers and forecast movement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#383346] bg-[#14121d]/90 p-2">
              <span className="px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8f899e]">
                Scope
              </span>
              <select
                aria-label="Filter by department"
                value={selectedDepartment}
                onChange={(event) => setSelectedDepartment(event.target.value)}
                className="max-w-[180px] rounded-lg border border-[#393447] bg-[#0e0d15] px-3 py-2 text-xs text-[#e8e2f0] outline-none focus:border-violet-300/60"
              >
                <option>All Departments</option>
                {availableDepartments.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <select
                aria-label="Filter by month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="max-w-[150px] rounded-lg border border-[#393447] bg-[#0e0d15] px-3 py-2 text-xs text-[#e8e2f0] outline-none focus:border-violet-300/60"
              >
                <option>All Months</option>
                {availableMonths.map((month) => <option key={month} value={month}>{formatMonth(month)}</option>)}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSelectedDepartment('All Departments');
                  setSelectedMonth('All Months');
                }}
                className="rounded-lg px-3 py-2 text-xs text-[#aaa2b8] transition hover:bg-white/[0.06] hover:text-white"
              >
                Reset
              </button>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-[#2d2939] py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8f899e]">
              Active view <span className="ml-2 text-[#d8d1e3]">{filterLabel}</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#817b8f]">
              Demonstration dataset · Jan–Mar 2026
            </p>
          </div>

          {loading && (
            <div className={`${panel} flex min-h-64 flex-col items-center justify-center`}>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#464054] border-t-violet-300" />
              <p className="mt-4 text-xs text-[#a39caf]">Synchronising financial data…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-950/20 p-6">
              <h2 className="font-semibold text-rose-200">Dashboard connection issue</h2>
              <p className="mt-2 text-sm text-[#d0c7d4]">{error}</p>
              <p className="mt-2 text-xs text-[#a49aaa]">Confirm that the FastAPI service is running at {API_URL}.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg border border-rose-300/30 px-4 py-2 text-xs text-rose-200 hover:bg-rose-400/10"
              >
                Retry connection
              </button>
            </div>
          )}

          {!loading && !error && summary && (
            <>
              {activeTab === 'overview' && (
                <>
                  <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Approved budget" value={money(budget)} detail="Selected reporting scope" onClick={() => openInsight({ budget }, 'Approved budget')} />
                    <MetricCard label="Actual expenditure" value={money(actual)} detail="Recorded actual spend" tone="violet" onClick={() => openInsight({ actual }, 'Actual expenditure')} />
                    <MetricCard label="Net variance" value={`${variance > 0 ? '+' : ''}${money(variance)}`} detail={`${variancePct.toFixed(2)}% against budget`} tone={varianceTone} onClick={() => openInsight({ variance, variancePct }, 'Net variance')} />
                    <MetricCard label="Budget status" value={budgetStatus} detail="Actual compared with budget" tone={variance > 0 ? 'negative' : 'positive'} onClick={() => openInsight({ budgetStatus, budget, actual, variance }, 'Budget status')} />
                  </section>

                  <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className={panel}>
                      <SectionHeading eyebrow="01 / Reconciliation" title="Variance bridge" description="Budget baseline, departmental variance contributions and actual total. Select a bar to inspect its value." />
                      <div className="h-[310px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={waterfallData} margin={{ top: 10, right: 8, left: 0, bottom: 12 }} onClick={(state: any) => {
                            const point = state?.activePayload?.[0]?.payload;
                            if (point) openInsight(point, `Variance bridge · ${point.name}`);
                          }}>
                            <CartesianGrid stroke={chartColor.grid} strokeDasharray="3 5" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: chartColor.tick, fontSize: 10 }} angle={-12} textAnchor="end" height={55} />
                            <YAxis tick={{ fill: chartColor.tick, fontSize: 10 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#b7a4ef', fillOpacity: 0.06 }} />
                            <Bar dataKey="base" stackId="bridge" fill="transparent" />
                            <Bar dataKey="change" stackId="bridge" name="Variance contribution" radius={[4, 4, 0, 0]}>
                              {waterfallData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Bar>
                            <Bar dataKey="total" name="Budget / Actual" radius={[4, 4, 0, 0]}>
                              {waterfallData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-[#302b3c] pt-3 text-[10px] text-[#9b95a9]">
                        <span>Backend reconciliation</span>
                        <span className={reconciles === undefined ? 'text-[#aaa2b8]' : reconciles ? 'text-emerald-300' : 'text-amber-300'}>
                          {reconciles === undefined ? 'Not reported' : reconciles ? 'Passed' : 'Review required'}
                        </span>
                      </div>
                    </div>

                    <div className={panel}>
                      <SectionHeading eyebrow="02 / Performance" title="Monthly movement" description="Budget, actual expenditure and forecast by reporting month." />
                      <div className="h-[310px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyChartData} onClick={(state: any) => {
                            const point = state?.activePayload?.[0]?.payload;
                            if (point) openInsight(point, `Monthly movement · ${point.month}`);
                          }}>
                            <CartesianGrid stroke={chartColor.grid} strokeDasharray="3 5" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: chartColor.tick, fontSize: 10 }} />
                            <YAxis tick={{ fill: chartColor.tick, fontSize: 10 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: chartColor.tick }} />
                            <Line type="monotone" dataKey="budget" name="Budget" stroke={chartColor.budget} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="actual" name="Actual" stroke={chartColor.actual} strokeWidth={2.5} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="forecast" name="Forecast" stroke={chartColor.forecast} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className={panel}>
                      <SectionHeading eyebrow="03 / Drivers" title="Variance by account" description="Department and account-category variance. Select a tile to inspect its contribution." />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {heatmap.map((row, index) => {
                          const department = String(field(row, 'department') || 'Department');
                          const category = String(field(row, 'account_category', 'category') || 'Account');
                          const amount = number(field(row, 'variance', 'variance_amount'));
                          const pct = number(field(row, 'variance_pct', 'variance_percentage'));
                          const adverse = amount > 0;
                          return (
                            <button
                              type="button"
                              key={`${department}-${category}-${index}`}
                              onClick={() => openInsight(row, `${department} · ${category}`)}
                              className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${adverse ? 'border-rose-300/20 bg-rose-300/[0.06] hover:border-rose-300/40' : 'border-emerald-300/20 bg-emerald-300/[0.05] hover:border-emerald-300/40'}`}
                            >
                              <p className="text-xs font-semibold text-[#e9e3f0]">{department}</p>
                              <p className="mt-1 text-[11px] text-[#9992a7]">{category}</p>
                              <div className="mt-4 flex items-end justify-between gap-2">
                                <span className={`text-xl font-semibold ${adverse ? 'text-rose-200' : 'text-emerald-200'}`}>{pct > 0 ? '+' : ''}{pct.toFixed(2)}%</span>
                                <span className="text-[11px] text-[#aaa2b8]">{amount > 0 ? '+' : ''}{money(amount)}</span>
                              </div>
                            </button>
                          );
                        })}
                        {heatmap.length === 0 && <p className="text-xs text-[#918a9f]">No heatmap records for this selection.</p>}
                      </div>
                    </div>

                    <div className={panel}>
                      <SectionHeading eyebrow="04 / Outlook" title="Forecast envelope" description="Forecast values with illustrative percentage-based bounds." />
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecastChartData} onClick={(state: any) => {
                            const point = state?.activePayload?.[0]?.payload;
                            if (point) openInsight(point, `Forecast · ${point.month}`);
                          }}>
                            <CartesianGrid stroke={chartColor.grid} strokeDasharray="3 5" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: chartColor.tick, fontSize: 10 }} />
                            <YAxis tick={{ fill: chartColor.tick, fontSize: 10 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area dataKey="lower" stackId="range" stroke="none" fill="transparent" />
                            <Area dataKey="range" stackId="range" name="Illustrative range" stroke="none" fill="#a99ae8" fillOpacity={0.22} />
                            <Line dataKey="forecast" name="Forecast" stroke={chartColor.forecast} strokeWidth={2.5} dot={{ r: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-[11px] leading-relaxed text-amber-100/80">
                        Illustrative percentage-based range only. It is not a statistically validated confidence interval because historical forecast-error data is unavailable.
                      </p>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'departments' && (
                <section className={panel}>
                  <SectionHeading eyebrow="Department performance" title="Variance breakdown" description="Actual expenditure, committed amounts and budget variance by department." />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-xs">
                      <thead className="border-b border-[#3a3547] text-[10px] uppercase tracking-wider text-[#a49db3]">
                        <tr>{['Department', 'Budget', 'Actual', 'Committed', 'Variance', 'Variance %'].map((heading) => <th key={heading} className="pb-4 pr-4 font-medium">{heading}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-[#302b3c]">
                        {departments.map((row, index) => {
                          const amount = number(field(row, 'variance', 'variance_amount'));
                          return (
                            <tr key={index} onClick={() => openInsight(row, String(field(row, 'department', 'name') || 'Department'))} className="cursor-pointer text-[#d8d1e2] transition hover:bg-white/[0.035]">
                              <td className="py-4 pr-4 font-semibold text-white">{field(row, 'department', 'name')}</td>
                              <td className="py-4 pr-4">{money(number(field(row, 'budget', 'budget_amount')))}</td>
                              <td className="py-4 pr-4">{money(number(field(row, 'actual', 'actual_amount')))}</td>
                              <td className="py-4 pr-4">{money(number(field(row, 'committed', 'committed_amount')))}</td>
                              <td className={`py-4 pr-4 font-semibold ${amount > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>{amount > 0 ? '+' : ''}{money(amount)}</td>
                              <td className="py-4">{number(field(row, 'variance_pct', 'variance_percentage')).toFixed(2)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {departments.length === 0 && <p className="py-8 text-center text-xs text-[#918a9f]">No department records for this selection.</p>}
                  </div>
                </section>
              )}

              {activeTab === 'trends' && (
                <section className={panel}>
                  <SectionHeading eyebrow="Time series" title="Monthly financial trends" description="Compare budget, actual expenditure and forecast for the selected scope." />
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData} onClick={(state: any) => {
                        const point = state?.activePayload?.[0]?.payload;
                        if (point) openInsight(point, `Monthly movement · ${point.month}`);
                      }}>
                        <CartesianGrid stroke={chartColor.grid} strokeDasharray="3 5" />
                        <XAxis dataKey="month" stroke={chartColor.tick} />
                        <YAxis stroke={chartColor.tick} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                        <Line dataKey="budget" name="Budget" stroke={chartColor.budget} strokeWidth={3} />
                        <Line dataKey="actual" name="Actual" stroke={chartColor.actual} strokeWidth={3} />
                        <Line dataKey="forecast" name="Forecast" stroke={chartColor.forecast} strokeWidth={3} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {activeTab === 'heatmap' && (
                <section className={panel}>
                  <SectionHeading eyebrow="Variance drivers" title="Department and account heatmap" description="Explore each account-category contribution within the selected reporting scope." />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {heatmap.map((row, index) => {
                      const amount = number(field(row, 'variance', 'variance_amount'));
                      const pct = number(field(row, 'variance_pct', 'variance_percentage'));
                      return (
                        <button type="button" key={index} onClick={() => openInsight(row, 'Account variance')} className={`rounded-xl border p-5 text-left transition hover:-translate-y-0.5 ${amount > 0 ? 'border-rose-300/20 bg-rose-300/[0.05]' : 'border-emerald-300/20 bg-emerald-300/[0.05]'}`}>
                          <p className="text-sm font-semibold text-white">{field(row, 'department') || 'Department'}</p>
                          <p className="mt-1 text-xs text-[#9c95aa]">{field(row, 'account_category', 'category') || 'Account category'}</p>
                          <p className={`mt-5 text-2xl font-semibold ${amount > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>{pct > 0 ? '+' : ''}{pct.toFixed(2)}%</p>
                          <p className="mt-1 text-xs text-[#aaa2b8]">Variance: {amount > 0 ? '+' : ''}{money(amount)}</p>
                        </button>
                      );
                    })}
                    {heatmap.length === 0 && <p className="text-xs text-[#918a9f]">No heatmap records for this selection.</p>}
                  </div>
                </section>
              )}

              {activeTab === 'forecast' && (
                <section className={panel}>
                  <SectionHeading eyebrow="Planning outlook" title="Forecast analysis" description="Forecast values and assumption-based range for the selected scope." />
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastChartData} onClick={(state: any) => {
                        const point = state?.activePayload?.[0]?.payload;
                        if (point) openInsight(point, `Forecast · ${point.month}`);
                      }}>
                        <CartesianGrid stroke={chartColor.grid} strokeDasharray="3 5" />
                        <XAxis dataKey="month" stroke={chartColor.tick} />
                        <YAxis stroke={chartColor.tick} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area dataKey="lower" stackId="range" stroke="none" fill="transparent" />
                        <Area dataKey="range" stackId="range" name="Illustrative range" stroke="none" fill="#a99ae8" fillOpacity={0.25} />
                        <Line dataKey="forecast" name="Forecast" stroke={chartColor.forecast} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Forecast methodology disclosure</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#c9c1d0]">
                      The displayed range is based on an illustrative percentage assumption. With only three months of records and no historical forecast-error series, it must not be interpreted as a statistically validated confidence interval.
                    </p>
                  </div>
                </section>
              )}

              <footer className="flex flex-col gap-2 border-t border-[#302b3c] pt-5 text-[10px] leading-relaxed text-[#817b8f] sm:flex-row sm:items-center sm:justify-between">
                <span>Illustrative demonstration dataset · Jan–Mar 2026 · Finance & Cash</span>
                <span className="text-[#a69db5]">Developed by: Jona Peter · PoC ID: PoC-4 · GitHub: @jonahpeter2006-12 · Infocreon Internship</span>
              </footer>
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/65 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <aside role="dialog" aria-modal="true" aria-label="Financial insights" onClick={(event) => event.stopPropagation()} className="flex h-full w-full max-w-md flex-col border-l border-[#484158] bg-[#12111b] p-5 shadow-2xl shadow-black/60 animate-[slideIn_0.22s_ease-out] sm:p-6">
            <div className="flex items-start justify-between border-b border-[#383346] pb-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-300">Interactive intelligence</p>
                <h2 className="mt-2 text-lg font-semibold text-[#f0ebf6]">Financial insights</h2>
                <p className="mt-1 text-xs text-[#9c95aa]">{selectedInsight?._insightTitle || 'Current budget position'}</p>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close insights panel" className="rounded-lg border border-[#403a4d] px-3 py-2 text-xs text-[#b8b0c5] hover:bg-white/[0.06]">✕</button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto py-5">
              <div className="rounded-xl border border-[#3b3549] bg-[#1a1825] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#a49db3]">Selected budget position</p>
                <p className={`mt-2 text-xl font-semibold ${variance > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>{budgetStatus}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#c2bbce]">Actual expenditure is {money(actual)} against a budget of {money(budget)}.</p>
                <p className="mt-3 text-[10px] text-[#918a9f]">{selectedDepartment} · {selectedMonth}</p>
              </div>
              {selectedInsight && (
                <div className="rounded-xl border border-violet-300/25 bg-violet-300/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-violet-200">Selected data point</p>
                  <div className="mt-3 space-y-2">
                    {Object.entries(selectedInsight)
                      .filter(([key, value]) => !key.startsWith('_') && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'))
                      .slice(0, 10)
                      .map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-4 text-xs">
                          <span className="capitalize text-[#a49db3]">{key.replaceAll('_', ' ')}</span>
                          <strong className="max-w-[60%] break-words text-right text-[#eee8f5]">{typeof value === 'number' && /budget|actual|variance|forecast|amount|lower|upper|change|total/i.test(key) ? money(value) : String(value)}</strong>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-[#3b3549] bg-[#1a1825] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#a49db3]">Variance observation</p>
                <p className="mt-2 text-xs leading-relaxed text-[#c2bbce]">The selected variance is <strong className={variance > 0 ? 'text-rose-200' : 'text-emerald-200'}>{variance > 0 ? '+' : ''}{money(variance)}</strong> ({variancePct.toFixed(2)}%). This is calculated from the supplied budget and actual values.</p>
              </div>
              <div className="rounded-xl border border-[#3b3549] bg-[#1a1825] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#a49db3]">Additional context</p>
                <div className="mt-3 space-y-2 text-xs text-[#c2bbce]">
                  <div className="flex justify-between"><span>Committed</span><strong>{money(committed)}</strong></div>
                  <div className="flex justify-between"><span>Forecast</span><strong>{money(forecastTotal)}</strong></div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                <p className="text-[10px] uppercase tracking-wider text-amber-200">Forecast limitation</p>
                <p className="mt-2 text-xs leading-relaxed text-[#c9c1d0]">The forecast range is illustrative and assumption-based. It is not a statistically validated confidence interval.</p>
              </div>
            </div>
            <p className="border-t border-[#383346] pt-3 text-[9px] text-[#817b8f]">Select a chart point, table row or metric card to inspect its data.</p>
          </aside>
        </div>
      )}

      {metadataOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" onClick={() => setMetadataOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="metadata-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#484158] bg-[#15131f] p-5 shadow-2xl shadow-black/60 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-violet-300">Infocreon Internship</p>
                <h2 id="metadata-title" className="mt-2 text-lg font-semibold">Application metadata</h2>
              </div>
              <button type="button" onClick={() => setMetadataOpen(false)} aria-label="Close metadata" className="rounded-lg border border-[#403a4d] px-3 py-2 text-xs text-[#b8b0c5] hover:bg-white/[0.06]">✕</button>
            </div>
            <div className="mt-5 space-y-4 rounded-xl border border-[#393447] bg-[#0d0c14] p-4 text-xs">
              {[
                ['Architect', 'Jona Peter'],
                ['Batch', 'Batch 8'],
                ['PoC ID', 'PoC-4'],
                ['Project', 'Budget vs Actual Variance Navigator'],
                ['Tech stack', 'Next.js, FastAPI, Tailwind CSS, Recharts'],
                ['Program', 'Infocreon Internship'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-[#928b9f]">{label}</span>
                  <span className="max-w-[68%] text-right font-medium text-[#eee8f5]">{value}</span>
                </div>
              ))}
              <div className="flex items-start justify-between gap-4 border-t border-[#302b3c] pt-4">
                <span className="text-[#928b9f]">GitHub</span>
                <a href="https://github.com/jonahpeter2006-12" target="_blank" rel="noreferrer" className="font-medium text-violet-200 hover:underline">@jonahpeter2006-12 ↗</a>
              </div>
            </div>
            <button type="button" onClick={() => setMetadataOpen(false)} className="mt-5 w-full rounded-xl border border-violet-300/30 bg-violet-300/[0.12] px-4 py-3 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/[0.2]">Close project details</button>
          </section>
        </div>
      )}
    </main>
  );
}
