
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const panel =
  'rounded-xl border border-slate-800 bg-[#111827] p-5 shadow-lg';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

const number = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const field = (row: Row, ...keys: string[]) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row[key] !== null) {
      return row[key];
    }
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
    : date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
};

function MetricCard({
  label,
  value,
  detail,
  color = 'text-white',
}: {
  label: string;
  value: string;
  detail?: string;
  color?: string;
}) {
  return (
    <div className={panel}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-slate-100">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);

  const [summary, setSummary] = useState<Row | null>(null);
  const [departments, setDepartments] = useState<Row[]>([]);
  const [monthly, setMonthly] = useState<Row[]>([]);
  const [heatmap, setHeatmap] = useState<Row[]>([]);
  const [forecast, setForecast] = useState<Row[]>([]);
  const [waterfallInfo, setWaterfallInfo] = useState<Row | null>(null);

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDepartment, setSelectedDepartment] =
    useState('All Departments');

  const [selectedMonth, setSelectedMonth] =
    useState('All Months');

  // Load dashboard data whenever the department or month changes.
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

        const query = params.toString();
        const filterQuery = query ? `?${query}` : '';

        const requests = [
          fetch(`${API_URL}/api/summary`, { cache: 'no-store' }),
          fetch(`${API_URL}/api/department-breakdown`, { cache: 'no-store' }),
          fetch(`${API_URL}/api/monthly-trends${filterQuery}`, { cache: 'no-store' }),
          fetch(`${API_URL}/api/department-heatmap`, { cache: 'no-store' }),
          fetch(`${API_URL}/api/forecast${filterQuery}`, { cache: 'no-store' }),
          fetch(`${API_URL}/api/waterfall`, { cache: 'no-store' }),

          // Keep the complete month list available for the filter.
          fetch(`${API_URL}/api/monthly-trends`, { cache: 'no-store' }),
        ];

        const responses = await Promise.all(requests);

        for (const response of responses) {
          if (!response.ok) {
            throw new Error(
              `Backend request failed (${response.status})`
            );
          }
        }

        const [
          summaryData,
          departmentData,
          monthlyData,
          heatmapData,
          forecastData,
          waterfallData,
          allMonthlyData,
        ] = await Promise.all(
          responses.map((response) => response.json())
        );

        if (cancelled) return;

        setSummary(summaryData);

        setDepartments(
          rowsFrom(
            departmentData,
            'departments',
            'data',
            'results'
          )
        );

        setMonthly(
          rowsFrom(
            monthlyData,
            'monthly_trends',
            'trends',
            'data',
            'results'
          )
        );

        const allMonthRows = rowsFrom(
          allMonthlyData,
          'monthly_trends',
          'trends',
          'data',
          'results'
        );

        const monthOptions = Array.from(
          new Set(
            allMonthRows
              .map((row) =>
                String(field(row, 'month', 'period') || '')
              )
              .filter(Boolean)
          )
        );

        setAvailableMonths(monthOptions);

        setHeatmap(
          rowsFrom(
            heatmapData,
            'heatmap',
            'data',
            'results'
          )
        );

        setForecast(
          rowsFrom(
            forecastData,
            'forecast',
            'data',
            'results'
          )
        );

        setWaterfallInfo(waterfallData);
      } catch (err) {
        if (!cancelled) {
          console.error('Dashboard loading error:', err);

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to connect to the backend.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedDepartment, selectedMonth]);

  // Close dialogs with Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMetadataOpen(false);
        setDrawerOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const budget = number(
    field(summary || {}, 'total_budget', 'budget_total', 'budget_amount')
  );

  const actual = number(
    field(summary || {}, 'total_actual', 'actual_total', 'actual_amount')
  );

  const committed = number(
    field(summary || {}, 'total_committed', 'committed_total', 'committed_amount')
  );

  const forecastTotal = number(
    field(summary || {}, 'total_forecast', 'forecast_total', 'forecast_amount')
  );

  const variance = number(
    field(summary || {}, 'variance', 'total_variance')
  );

  const variancePct = number(
    field(summary || {}, 'variance_pct', 'variance_percentage')
  );

  const budgetStatus =
    field(summary || {}, 'status', 'budget_status') ||
    (variance > 0 ? 'Over Budget' : 'Within Budget');

  const departmentsList = useMemo(() => {
    return departments.filter((row) =>
      field(row, 'department', 'name')
    );
  }, [departments]);

  const monthsList = availableMonths;

  const filteredDepartments = useMemo(() => {
    return selectedDepartment === 'All Departments'
      ? departmentsList
      : departmentsList.filter(
          (row) =>
            field(row, 'department', 'name') === selectedDepartment
        );
  }, [departmentsList, selectedDepartment]);

  const filteredMonthly = useMemo(() => {
    return monthly.filter((row) => {
      const department = field(row, 'department');
      const month = String(field(row, 'month', 'period') || '');

      const departmentMatches =
        selectedDepartment === 'All Departments' ||
        !department ||
        department === selectedDepartment;

      const monthMatches =
        selectedMonth === 'All Months' ||
        month === selectedMonth;

      return departmentMatches && monthMatches;
    });
  }, [monthly, selectedDepartment, selectedMonth]);

  const filteredHeatmap = useMemo(() => {
    return heatmap.filter((row) => {
      const department = field(row, 'department');

      return (
        selectedDepartment === 'All Departments' ||
        department === selectedDepartment
      );
    });
  }, [heatmap, selectedDepartment]);

  const monthlyChartData = filteredMonthly.map((row) => ({
    month: formatMonth(
      String(field(row, 'month', 'period') || '')
    ),
    budget: number(
      field(row, 'budget_amount', 'budget')
    ),
    actual: number(
      field(row, 'actual_amount', 'actual')
    ),
    forecast: number(
      field(row, 'forecast_amount', 'forecast')
    ),
  }));

  const waterfallData = useMemo(() => {
    let runningTotal = budget;

    const departmentSteps = filteredDepartments.map((row) => {
      const department = String(
        field(row, 'department', 'name') || 'Department'
      );

      const amount = number(
        field(row, 'variance', 'variance_amount', 'total_variance')
      );

      const previous = runningTotal;
      runningTotal += amount;

      return {
        name: department,
        base: Math.min(previous, runningTotal),
        change: Math.abs(amount),
        color: amount >= 0 ? '#fb7185' : '#34d399',
        amount,
        total: 0,
      };
    });

    return [
      {
        name: 'Budget',
        base: 0,
        change: 0,
        total: budget,
        color: '#38bdf8',
        amount: budget,
      },
      ...departmentSteps,
      {
        name: 'Actual',
        base: 0,
        change: 0,
        total: actual,
        color: '#38bdf8',
        amount: actual,
      },
    ];
  }, [budget, actual, filteredDepartments]);

  const forecastChartData = forecast.map((row) => {
    const lower = number(
      field(row, 'lower_bound', 'lower', 'lower_forecast')
    );

    const upper = number(
      field(row, 'upper_bound', 'upper', 'upper_forecast')
    );

    return {
      month: formatMonth(
        String(field(row, 'month', 'period') || '')
      ),
      forecast: number(
        field(row, 'forecast_amount', 'forecast', 'value')
      ),
      lower,
      range: Math.max(0, upper - lower),
    };
  });

  const reconciliation =
    waterfallInfo?.reconciliation ||
    waterfallInfo?.reconciliation_check;

  const reconciles =
    typeof reconciliation === 'boolean'
      ? reconciliation
      : field(
          reconciliation || {},
          'reconciles',
          'is_reconciled'
        );

  const varianceColor =
    variance > 0
      ? 'text-rose-400'
      : 'text-emerald-400';

  const navigation = [
    { id: 'overview', icon: '◫', label: 'Overview & Variance' },
    { id: 'departments', icon: '▦', label: 'Department Analysis' },
    { id: 'trends', icon: '⌁', label: 'Monthly Trends' },
    { id: 'heatmap', icon: '▥', label: 'Department Heatmap' },
    { id: 'forecast', icon: '⌗', label: 'Forecast Analysis' },
  ];

  return (
    <div className="flex min-h-screen bg-[#080b12] font-sans text-slate-100">

      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] transition-all duration-300 md:flex`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            {sidebarOpen && (
              <span className="font-bold tracking-wider text-cyan-400">
                INFOCREON
              </span>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:text-white"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          <nav className="space-y-2 p-3">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                  activeTab === item.id
                    ? 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="w-5 text-center text-lg">
                  {item.icon}
                </span>

                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="min-w-0 flex-1">

        {/* HEADER */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-[#080b12]/95 px-5 py-4 backdrop-blur-lg md:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Infocreon Internship · Finance & Cash
            </p>

            <h1 className="mt-1 text-lg font-bold md:text-xl">
              Budget vs Actual Variance Navigator
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMetadataOpen(true)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300"
            >
              ⓘ Application Metadata
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20"
            >
              ⚡ Financial Insights
            </button>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-7">

          {/* FILTERS */}
          <section className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Filters
            </span>

            <select
              value={selectedDepartment}
              onChange={(event) =>
                setSelectedDepartment(event.target.value)
              }
              className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
            >
              <option>All Departments</option>

              {departmentsList.map((row) => {
                const name = String(
                  field(row, 'department', 'name')
                );

                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>

            <select
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
              className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
            >
              <option>All Months</option>

              {monthsList.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-500">
              Dataset: Jan – Mar 2026
            </span>
          </section>

          {/* LOADING */}
          {loading && (
            <div className={`${panel} py-16 text-center`}>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

              <p className="text-sm text-slate-400">
                Loading financial data from backend...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5">
              <h2 className="font-semibold text-rose-400">
                Unable to load dashboard data
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                {error}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Check that the FastAPI backend is running at {API_URL}.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/20"
              >
                Retry
              </button>
            </div>
          )}

          {/* DASHBOARD */}
          {!loading && !error && summary && (
            <>
              {/* SUMMARY CARDS */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total Budget"
                  value={money(budget)}
                  detail="Approved budget"
                />

                <MetricCard
                  label="Total Actual"
                  value={money(actual)}
                  detail="Recorded expenditure"
                />

                <MetricCard
                  label="Net Variance"
                  value={`${variance >= 0 ? '+' : ''}${money(variance)}`}
                  detail={`${variancePct.toFixed(2)}% against budget`}
                  color={varianceColor}
                />

                <MetricCard
                  label="Budget Status"
                  value={String(budgetStatus)}
                  detail="Based on actual vs budget"
                  color={
                    variance > 0
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }
                />
              </section>

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <section className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                    {/* WATERFALL */}
                    <div className={panel}>
                      <SectionTitle
                        title="Variance Waterfall"
                        description="Budget baseline, departmental variance contributions and actual total"
                      />

                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={waterfallData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: 10,
                              bottom: 10,
                            }}
                          >
                            <CartesianGrid
                              stroke="#263244"
                              strokeDasharray="3 3"
                              vertical={false}
                            />

                            <XAxis
                              dataKey="name"
                              tick={{
                                fill: '#94a3b8',
                                fontSize: 11,
                              }}
                              angle={-15}
                              textAnchor="end"
                              height={65}
                            />

                            <YAxis
                              tick={{
                                fill: '#94a3b8',
                                fontSize: 10,
                              }}
                              tickFormatter={(value) =>
                                `$${Math.round(value / 1000)}k`
                              }
                            />

                            <Tooltip
                              formatter={(value: any) =>
                                money(number(value))
                              }
                              contentStyle={{
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: 8,
                              }}
                            />

                            <Bar
                              dataKey="base"
                              stackId="waterfall"
                              fill="transparent"
                            />

                            <Bar
                              dataKey="change"
                              stackId="waterfall"
                              name="Variance contribution"
                              radius={[4, 4, 0, 0]}
                            >
                              {waterfallData.map((entry, index) => (
                                <Cell
                                  key={`change-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Bar>

                            <Bar
                              dataKey="total"
                              name="Budget / Actual"
                              radius={[4, 4, 0, 0]}
                            >
                              {waterfallData.map((entry, index) => (
                                <Cell
                                  key={`total-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {reconciles !== undefined && (
                        <p className="mt-3 text-xs text-slate-400">
                          Backend reconciliation:{' '}
                          <span
                            className={
                              reconciles
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }
                          >
                            {reconciles ? 'Passed' : 'Needs review'}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* MONTHLY TREND */}
                    <div className={panel}>
                      <SectionTitle
                        title="Monthly Financial Trend"
                        description="Budget, actual expenditure and forecast by month"
                      />

                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyChartData}>
                            <CartesianGrid
                              stroke="#263244"
                              strokeDasharray="3 3"
                              vertical={false}
                            />

                            <XAxis
                              dataKey="month"
                              tick={{
                                fill: '#94a3b8',
                                fontSize: 11,
                              }}
                            />

                            <YAxis
                              tick={{
                                fill: '#94a3b8',
                                fontSize: 10,
                              }}
                              tickFormatter={(value) =>
                                `$${Math.round(value / 1000)}k`
                              }
                            />

                            <Tooltip
                              formatter={(value: any) =>
                                money(number(value))
                              }
                              contentStyle={{
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: 8,
                              }}
                            />

                            <Legend />

                            <Line
                              type="monotone"
                              dataKey="budget"
                              name="Budget"
                              stroke="#38bdf8"
                              strokeWidth={2}
                            />

                            <Line
                              type="monotone"
                              dataKey="actual"
                              name="Actual"
                              stroke="#fb7185"
                              strokeWidth={2}
                            />

                            <Line
                              type="monotone"
                              dataKey="forecast"
                              name="Forecast"
                              stroke="#a78bfa"
                              strokeWidth={2}
                              strokeDasharray="5 5"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* HEATMAP */}
                    <div className={panel}>
                      <SectionTitle
                        title="Department Heatmap"
                        description="Variance percentage by department and account category"
                      />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {filteredHeatmap.map((row, index) => {
                          const department = String(
                            field(row, 'department') || 'Department'
                          );

                          const category = String(
                            field(
                              row,
                              'account_category',
                              'category'
                            ) || 'Account'
                          );

                          const amount = number(
                            field(row, 'variance', 'variance_amount')
                          );

                          const pct = number(
                            field(
                              row,
                              'variance_pct',
                              'variance_percentage'
                            )
                          );

                          return (
                            <div
                              key={`${department}-${category}-${index}`}
                              className={`rounded-lg border p-4 ${
                                amount > 0
                                  ? 'border-rose-500/30 bg-rose-500/10'
                                  : 'border-emerald-500/30 bg-emerald-500/10'
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-200">
                                {department}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {category}
                              </p>

                              <div className="mt-3 flex items-end justify-between gap-2">
                                <span
                                  className={`text-lg font-bold ${
                                    amount > 0
                                      ? 'text-rose-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {pct > 0 ? '+' : ''}
                                  {pct.toFixed(2)}%
                                </span>

                                <span className="text-xs text-slate-400">
                                  {amount > 0 ? '+' : ''}
                                  {money(amount)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {filteredHeatmap.length === 0 && (
                        <p className="text-sm text-slate-500">
                          No heatmap records for this selection.
                        </p>
                      )}
                    </div>

                    {/* FORECAST */}
                    <div className={panel}>
                      <SectionTitle
                        title="Forecast Range"
                        description="Forecast values with illustrative percentage-based bounds"
                      />

                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecastChartData}>
                            <CartesianGrid
                              stroke="#263244"
                              strokeDasharray="3 3"
                              vertical={false}
                            />

                            <XAxis
                              dataKey="month"
                              tick={{
                                fill: '#94a3b8',
                                fontSize: 11,
                              }}
                            />

                            <YAxis
                              tick={{
                                fill: '#94a3b8',
                                fontSize: 10,
                              }}
                              tickFormatter={(value) =>
                                `$${Math.round(value / 1000)}k`
                              }
                            />

                            <Tooltip
                              formatter={(value: any) =>
                                money(number(value))
                              }
                              contentStyle={{
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: 8,
                              }}
                            />

                            <Area
                              type="monotone"
                              dataKey="lower"
                              stackId="range"
                              stroke="none"
                              fill="transparent"
                            />

                            <Area
                              type="monotone"
                              dataKey="range"
                              stackId="range"
                              name="Illustrative range"
                              stroke="none"
                              fill="#818cf8"
                              fillOpacity={0.25}
                            />

                            <Line
                              type="monotone"
                              dataKey="forecast"
                              name="Forecast"
                              stroke="#a78bfa"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-300">
                        Illustrative percentage-based range only. This is not
                        a statistically validated confidence interval because
                        historical forecast-error data is unavailable.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* DEPARTMENTS */}
              {activeTab === 'departments' && (
                <section className={panel}>
                  <SectionTitle
                    title="Department Variance Breakdown"
                    description="Actual expenditure, committed amounts and budget variance by department"
                  />

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                        <tr>
                          <th className="pb-4">Department</th>
                          <th className="pb-4">Budget</th>
                          <th className="pb-4">Actual</th>
                          <th className="pb-4">Committed</th>
                          <th className="pb-4">Variance</th>
                          <th className="pb-4">Variance %</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-800">
                        {filteredDepartments.map((row, index) => {
                          const amount = number(
                            field(row, 'variance', 'variance_amount')
                          );

                          return (
                            <tr
                              key={index}
                              className="text-slate-300 hover:bg-slate-900/50"
                            >
                              <td className="py-4 font-medium text-white">
                                {field(row, 'department', 'name')}
                              </td>

                              <td className="py-4">
                                {money(
                                  number(
                                    field(row, 'budget', 'budget_amount')
                                  )
                                )}
                              </td>

                              <td className="py-4">
                                {money(
                                  number(
                                    field(row, 'actual', 'actual_amount')
                                  )
                                )}
                              </td>

                              <td className="py-4">
                                {money(
                                  number(
                                    field(
                                      row,
                                      'committed',
                                      'committed_amount'
                                    )
                                  )
                                )}
                              </td>

                              <td
                                className={`py-4 font-semibold ${
                                  amount > 0
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {amount > 0 ? '+' : ''}
                                {money(amount)}
                              </td>

                              <td className="py-4">
                                {number(
                                  field(
                                    row,
                                    'variance_pct',
                                    'variance_percentage'
                                  )
                                ).toFixed(2)}
                                %
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* MONTHLY TRENDS */}
              {activeTab === 'trends' && (
                <section className={panel}>
                  <SectionTitle
                    title="Monthly Financial Trends"
                    description="Compare the monthly budget, actual expenditure and forecast"
                  />

                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData}>
                        <CartesianGrid
                          stroke="#263244"
                          strokeDasharray="3 3"
                        />

                        <XAxis dataKey="month" stroke="#94a3b8" />

                        <YAxis
                          stroke="#94a3b8"
                          tickFormatter={(value) =>
                            `$${Math.round(value / 1000)}k`
                          }
                        />

                        <Tooltip
                          formatter={(value: any) =>
                            money(number(value))
                          }
                          contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #334155',
                          }}
                        />

                        <Legend />

                        <Line
                          dataKey="budget"
                          name="Budget"
                          stroke="#38bdf8"
                          strokeWidth={3}
                        />

                        <Line
                          dataKey="actual"
                          name="Actual"
                          stroke="#fb7185"
                          strokeWidth={3}
                        />

                        <Line
                          dataKey="forecast"
                          name="Forecast"
                          stroke="#a78bfa"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {/* HEATMAP */}
              {activeTab === 'heatmap' && (
                <section className={panel}>
                  <SectionTitle
                    title="Department & Account Heatmap"
                    description="Explore the variance contribution of each account category"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredHeatmap.map((row, index) => {
                      const amount = number(
                        field(row, 'variance', 'variance_amount')
                      );

                      const pct = number(
                        field(
                          row,
                          'variance_pct',
                          'variance_percentage'
                        )
                      );

                      return (
                        <div
                          key={index}
                          className={`rounded-xl border p-5 ${
                            amount > 0
                              ? 'border-rose-500/30 bg-rose-950/30'
                              : 'border-emerald-500/30 bg-emerald-950/30'
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">
                            {field(row, 'department')}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {field(
                              row,
                              'account_category',
                              'category'
                            )}
                          </p>

                          <p
                            className={`mt-5 text-2xl font-bold ${
                              amount > 0
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {pct > 0 ? '+' : ''}
                            {pct.toFixed(2)}%
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Variance: {amount > 0 ? '+' : ''}
                            {money(amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* FORECAST */}
              {activeTab === 'forecast' && (
                <section className={panel}>
                  <SectionTitle
                    title="Forecast Analysis"
                    description="Illustrative forecast values and percentage-based range"
                  />

                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastChartData}>
                        <CartesianGrid
                          stroke="#263244"
                          strokeDasharray="3 3"
                        />

                        <XAxis dataKey="month" stroke="#94a3b8" />

                        <YAxis
                          stroke="#94a3b8"
                          tickFormatter={(value) =>
                            `$${Math.round(value / 1000)}k`
                          }
                        />

                        <Tooltip
                          formatter={(value: any) =>
                            money(number(value))
                          }
                          contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #334155',
                          }}
                        />

                        <Area
                          dataKey="lower"
                          stackId="range"
                          stroke="none"
                          fill="transparent"
                        />

                        <Area
                          dataKey="range"
                          stackId="range"
                          name="Illustrative range"
                          stroke="none"
                          fill="#818cf8"
                          fillOpacity={0.25}
                        />

                        <Line
                          dataKey="forecast"
                          name="Forecast"
                          stroke="#a78bfa"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-sm font-semibold text-amber-300">
                      Forecast methodology disclosure
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      The displayed range is based on an illustrative
                      percentage assumption. With only three months of
                      records and no historical forecast-error series, it
                      must not be interpreted as a statistically validated
                      confidence interval.
                    </p>
                  </div>
                </section>
              )}

              {/* FOOTER */}
              <footer className="border-t border-slate-800 pt-4 text-xs text-slate-500">
                Budget vs Actual Variance Navigator · Finance & Cash ·
                Illustrative demonstration dataset · Jan–Mar 2026
              </footer>
            </>
          )}
        </div>
      </main>

      {/* APPLICATION METADATA MODAL */}
      {metadataOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setMetadataOpen(false)}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="metadata-title"
            className="w-full max-w-md animate-[modalIn_0.2s_ease-out] rounded-2xl border border-slate-700/80 bg-[#101827] p-5 shadow-2xl shadow-black/60 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xl text-emerald-400">
                  ⓘ
                </div>

                <div>
                  <h2
                    id="metadata-title"
                    className="text-base font-bold text-slate-100"
                  >
                    Application Metadata
                  </h2>

                  <p className="mt-0.5 text-[11px] font-medium text-emerald-400">
                    Infocreon Cinematic Rail Architecture
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMetadataOpen(false)}
                aria-label="Close application metadata"
                className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* METADATA DETAILS */}
            <div className="space-y-4 rounded-xl border border-slate-700/70 bg-[#050b19] p-4">
              <div className="flex items-start justify-between gap-4 text-xs">
                <span className="text-slate-400">Architect:</span>
                <span className="text-right font-semibold text-slate-100">
                  Jona Peter
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 text-xs">
                <span className="text-slate-400">PoC ID:</span>
                <span className="max-w-[70%] text-right font-semibold text-slate-100">
                  PoC 4 (Budget vs Actual Variance Navigator)
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 text-xs">
                <span className="text-slate-400">GitHub:</span>
                <a
                  href="https://github.com/jonahpeter2006-12"
                  target="_blank"
                  rel="noreferrer"
                  className="text-right font-semibold text-cyan-400 transition hover:text-cyan-300 hover:underline"
                >
                  @jonahpeter2006-12 ↗
                </a>
              </div>

              <div className="flex items-start justify-between gap-4 text-xs">
                <span className="text-slate-400">Tech Stack:</span>
                <span className="max-w-[70%] text-right font-semibold leading-relaxed text-slate-100">
                  Next.js 16, FastAPI, Tailwind CSS,
                  Pandas / DuckDB
                </span>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400">Program:</span>
                  <span className="text-right font-semibold text-emerald-400">
                    Infocreon Internship
                  </span>
                </div>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setMetadataOpen(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 active:scale-[0.99]"
            >
              Close Information
            </button>
          </section>
        </div>
      )}

      {/* FINANCIAL INSIGHTS DRAWER */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-slate-700 bg-[#0f172a] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-400">
                  Finance & Cash
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Financial Insights
                </h2>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close insights"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto py-5">
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Overall budget position
                </p>

                <p className={`mt-2 text-xl font-bold ${varianceColor}`}>
                  {String(budgetStatus)}
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  Actual expenditure is {money(actual)} against a budget of{' '}
                  {money(budget)}.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Variance observation
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  The overall variance is{' '}
                  <strong className={varianceColor}>
                    {variance > 0 ? '+' : ''}
                    {money(variance)}
                  </strong>{' '}
                  ({variancePct.toFixed(2)}%). This is calculated from
                  the supplied budget and actual values.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Department observation
                </p>

                {departmentsList.length > 0 ? (
                  <p className="mt-2 text-sm text-slate-300">
                    {String(
                      field(
                        [...departmentsList].sort(
                          (a, b) =>
                            number(
                              field(b, 'variance', 'variance_amount')
                            ) -
                            number(
                              field(a, 'variance', 'variance_amount')
                            )
                        )[0],
                        'department',
                        'name'
                      )
                    )}{' '}
                    has the largest positive departmental variance in
                    the current dataset.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    Department data is unavailable.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold uppercase text-amber-300">
                  Forecast limitation
                </p>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  The forecast range is illustrative and assumption-based.
                  It is not a statistically validated confidence interval.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Additional financial context
                </p>

                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Committed</span>
                    <strong>{money(committed)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Forecast</span>
                    <strong>{money(forecastTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
