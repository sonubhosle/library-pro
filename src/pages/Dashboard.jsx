import React, { useEffect, useState } from 'react';
import {
    Book,
    Users,
    Calendar,
    AlertTriangle,
    IndianRupee,
    Clock,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Layers,
    CheckCircle2,
    BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, icon: Icon, gradient, textColor, bgColor, trend, trendLabel }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group cursor-default`}>
        {/* Subtle gradient accent top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${gradient}`} />

        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1 group-hover:text-slate-900 transition-colors">{value}</h3>
                {trendLabel && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                        {trend === 'up' && <TrendingUp size={12} />}
                        {trend === 'down' && <TrendingDown size={12} />}
                        <span>{trendLabel}</span>
                    </div>
                )}
            </div>
            <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={22} className={textColor} />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalStudents: 0,
        issuedToday: 0,
        overdueBooks: 0,
        finesCollected: 0,
        pendingFines: 0
    });
    const [recentIssues, setRecentIssues] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [trends, setTrends] = useState({
        booksAddedThisMonth: 0,
        studentGrowth: 0,
        studentsAddedThisMonth: 0,
        currentlyIssued: 0,
        catalogCoverage: 0
    });
    const [inventoryHealth, setInventoryHealth] = useState({
        totalCopies: 0,
        availableCopies: 0,
        totalIssuesEver: 0,
        totalReturned: 0,
        overdueRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
  const fetchStats = async () => {
    // If running inside Electron, use IPC; otherwise fallback to mock data for web dev.
    if (window && window.electron && typeof window.electron.ipc?.invoke === 'function') {
      const result = await window.electron.ipc.invoke('dashboard:getStats');
      if (result.success) {
        setStats(result.stats);
        setRecentIssues(result.recentIssues);
        setPieData(result.categories);
        if (result.weeklyActivity) setActivityData(result.weeklyActivity);
        if (result.trends) setTrends(result.trends);
        if (result.inventoryHealth) setInventoryHealth(result.inventoryHealth);
      }
    } else {
      // Mock data for development without Electron
      setStats({
        totalBooks: 1200,
        totalStudents: 350,
        issuedToday: 45,
        overdueBooks: 12,
        finesCollected: 1500,
        pendingFines: 300,
      });
      setRecentIssues([]);
      setPieData([]);
      setActivityData([]);
      setTrends({ booksAddedThisMonth: 0, studentGrowth: 0, studentsAddedThisMonth: 0, currentlyIssued: 0, catalogCoverage: 0 });
      setInventoryHealth({ totalCopies: 0, availableCopies: 0, totalIssuesEver: 0, totalReturned: 0, overdueRate: 0 });
    }
    setLoading(false);
  };
  fetchStats();
}, []);

    const availablePct = inventoryHealth.totalCopies > 0
        ? Math.round((inventoryHealth.availableCopies / inventoryHealth.totalCopies) * 100)
        : 0;

    const returnPct = inventoryHealth.totalIssuesEver > 0
        ? Math.round((inventoryHealth.totalReturned / inventoryHealth.totalIssuesEver) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center animate-pulse shadow-lg shadow-teal-500/30">
                    <BookOpen size={24} className="text-white" />
                </div>
                <p className="text-slate-400 text-sm font-medium animate-pulse">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-0">

            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white shadow-lg shadow-teal-500/20">
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -right-2 top-8 w-24 h-24 bg-white/10 rounded-full" />
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-teal-100 text-sm font-medium mb-1">Good morning 👋</p>
                        <h2 className="text-2xl font-black tracking-tight">MIT College Library</h2>
                        <p className="text-teal-100 text-sm mt-1 font-medium">Cs & It Basmath — Admin Dashboard</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-center">
                        <div>
                            <p className="text-3xl font-black">{stats.totalBooks}</p>
                            <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Books</p>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div>
                            <p className="text-3xl font-black">{stats.totalStudents}</p>
                            <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Students</p>
                        </div>
                        <div className="w-px h-12 bg-white/20" />
                        <div>
                            <p className="text-3xl font-black">{stats.issuedToday}</p>
                            <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Issued Today</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Books"
                    value={stats.totalBooks}
                    icon={Book}
                    gradient="bg-gradient-to-r from-teal-400 to-teal-500"
                    bgColor="bg-teal-50"
                    textColor="text-teal-600"
                    trend={trends.booksAddedThisMonth > 0 ? 'up' : null}
                    trendLabel={trends.booksAddedThisMonth > 0 ? `+${trends.booksAddedThisMonth} this month` : 'No new books'}
                />
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={Users}
                    gradient="bg-gradient-to-r from-emerald-400 to-emerald-500"
                    bgColor="bg-emerald-50"
                    textColor="text-emerald-600"
                    trend={trends.studentGrowth > 0 ? 'up' : trends.studentGrowth < 0 ? 'down' : null}
                    trendLabel={trends.studentGrowth !== 0 ? `${trends.studentGrowth > 0 ? '+' : ''}${trends.studentGrowth}% vs last month` : `+${trends.studentsAddedThisMonth} this month`}
                />
                <StatCard
                    title="Issued Today"
                    value={stats.issuedToday}
                    icon={Calendar}
                    gradient="bg-gradient-to-r from-blue-400 to-blue-500"
                    bgColor="bg-blue-50"
                    textColor="text-blue-600"
                    trend={trends.currentlyIssued > 0 ? 'up' : null}
                    trendLabel={`${trends.currentlyIssued} currently issued`}
                />
                <StatCard
                    title="Overdue Books"
                    value={stats.overdueBooks}
                    icon={AlertTriangle}
                    gradient="bg-gradient-to-r from-rose-400 to-rose-500"
                    bgColor="bg-rose-50"
                    textColor="text-rose-600"
                    trend={stats.overdueBooks > 5 ? 'down' : 'up'}
                    trendLabel={stats.overdueBooks > 5 ? 'Needs attention' : 'Under control'}
                />
                <StatCard
                    title="Fines Collected"
                    value={`₹${stats.finesCollected}`}
                    icon={IndianRupee}
                    gradient="bg-gradient-to-r from-violet-400 to-violet-500"
                    bgColor="bg-violet-50"
                    textColor="text-violet-600"
                    trendLabel="This month"
                />
                <StatCard
                    title="Pending Fines"
                    value={`₹${stats.pendingFines}`}
                    icon={Clock}
                    gradient="bg-gradient-to-r from-orange-400 to-orange-500"
                    bgColor="bg-orange-50"
                    textColor="text-orange-600"
                    trend={stats.pendingFines > 0 ? 'down' : null}
                    trendLabel={stats.pendingFines > 0 ? 'Outstanding' : 'All clear'}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Area Chart — Weekly Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp size={18} className="text-teal-500" />
                                Weekly Activity
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Books issued vs returned this week</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-teal-600"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />Issues</span>
                            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Returns</span>
                        </div>
                    </div>
                    <div className="h-52">
                        {activityData.length > 0 && activityData.some(d => d.issues > 0 || d.returns > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="issues" stroke="#f59e0b" strokeWidth={2.5} fill="url(#issueGrad)" dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
                                    <Area type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={2.5} fill="url(#returnGrad)" dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-2">
                                <TrendingUp size={40} className="text-slate-200" />
                                <span className="text-xs text-slate-400 font-medium">No activity in the last 7 days</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart — Category Share */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-800">Category Share</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Books by subject category</p>
                    </div>
                    <div className="h-44">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={72}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-2">
                                <Layers size={40} className="text-slate-200" />
                                <span className="text-xs text-slate-400 font-medium">No category data</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 mt-2">
                        {pieData.slice(0, 4).map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-xs text-slate-600 font-medium line-clamp-1">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row — Health + Recent Transactions */}
            <div className="grid grid-cols-1 ">


                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Latest book issues & returns</p>
                        </div>
                        <Link to="/transactions" className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors group">
                            View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/70">
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Book</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentIssues.length > 0 ? (
                                    recentIssues.map((issue, idx) => (
                                        <tr key={issue.id ?? idx} className="hover:bg-teal-50/40 transition-colors duration-200 group">
                                          <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-teal-500/20">
                                                {issue.student_name?.charAt(0).toUpperCase()}
                                              </div>
                                              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{issue.student_name ?? 'N/A'}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600 font-medium line-clamp-1">{issue.book_title ?? 'N/A'}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className="text-sm text-slate-400 font-medium">
                                              {issue.due_date ? new Date(issue.due_date * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${issue.status === 'issued' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}> {issue.status ?? 'unknown'} </span>
                                          </td>
                                        </tr>
                                      ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <Layers size={36} className="mx-auto text-slate-200 mb-3" />
                                            <p className="text-sm text-slate-400 font-medium">No recent transactions found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
