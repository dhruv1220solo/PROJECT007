import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user, logoutUser } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false); // NEW: Dark Mode State

  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, historyRes, leavesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/attendance/metrics/${user.dbId}`),
        axios.get(`http://localhost:5000/api/attendance/history/${user.dbId}`),
        axios.get(`http://localhost:5000/api/attendance/leaves/${user.dbId}`)
      ]);

      if (metricsRes.data.status === 'success' && historyRes.data.status === 'success') {
        setMetrics({ ...metricsRes.data.metrics, logs: historyRes.data.logs });
      }
      if (leavesRes.data.status === 'success') setLeaveHistory(leavesRes.data.leaves);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.dbId) fetchDashboardData();
    if (localStorage.getItem('theme') === 'dark') setDarkMode(true);
  }, [user?.dbId]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const handleCheckIn = async () => {
    setActionMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/check-in', { userId: user.dbId });
      if (res.data.status === 'success') {
        setActionMessage(`Check-in recorded: ${res.data.statusAssigned}`);
        fetchDashboardData();
      }
    } catch (error) {
      setActionMessage(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    setActionMessage('');
    try {
      const res = await axios.put('http://localhost:5000/api/attendance/check-out', { userId: user.dbId });
      if (res.data.status === 'success') {
        setActionMessage('Check-out recorded successfully');
        fetchDashboardData();
      }
    } catch (error) {
      setActionMessage(error.response?.data?.message || 'Check-out failed');
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setActionMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/leaves/request', {
        userId: user.dbId, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason
      });
      if (res.data.status === 'success') {
        setActionMessage('Leave request submitted successfully.');
        setLeaveStart(''); setLeaveEnd(''); setLeaveReason('');
        fetchDashboardData();
      }
    } catch (error) {
      setActionMessage(error.response?.data?.message || 'Failed to submit request.');
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading profile data...</div>;

  const holidayPercentage = metrics?.yearlyHolidaysRemaining ? (metrics.yearlyHolidaysRemaining / 24) * 100 : 0;

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-[#f7fafc] dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col py-8 px-4 fixed h-full z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-8 h-8 bg-[#1a365d] rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white leading-none">Portal</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">HR Department</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem id="dashboard" icon="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} />
            <NavItem id="attendance" icon="calendar_today" label="Attendance" activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} />
            <NavItem id="leaves" icon="event_busy" label="Leave Requests" activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} />
          </nav>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-1">
            <button onClick={handleCheckIn} className="w-full bg-[#1a365d] text-white text-sm font-semibold py-3 rounded-lg mb-4 flex items-center justify-center gap-2 border-none cursor-pointer">
              <span className="text-lg">+</span> Quick Check-in
            </button>
            
            {/* THEME TOGGLE BUTTON */}
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 bg-transparent border-none text-left cursor-pointer">
              <span className="material-icons-outlined text-lg opacity-70">{darkMode ? 'light_mode' : 'dark_mode'}</span>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button onClick={logoutUser} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 bg-transparent border-none text-left cursor-pointer">
              <span className="material-icons-outlined text-xl opacity-70">logout</span> Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8 relative">
          {actionMessage && (
            <div className="absolute top-8 left-8 right-8 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400 text-sm rounded-r font-medium z-20">
              {actionMessage}
            </div>
          )}

          <div className={actionMessage ? "mt-16" : ""}>
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your attendance overview for today.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleCheckIn} className="px-6 py-2 bg-[#1a365d] text-white rounded-lg font-semibold border-none cursor-pointer">Check In</button>
                    <button onClick={handleCheckOut} className="px-6 py-2 bg-[#c53030] text-white rounded-lg font-semibold border-none cursor-pointer">Check Out</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <MetricCard title="Shift Metric" icon="schedule">
                    <div className="text-3xl font-bold text-[#1a365d] dark:text-blue-400 mb-1">{metrics?.logs?.[0]?.date === new Date().toISOString().split('T')[0] ? metrics.logs[0].status : 'Inactive'}</div>
                  </MetricCard>
                  <MetricCard title="Attendance" icon="calendar_today">
                    <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{metrics?.totalAttendanceThisMonth || 0} <span className="text-lg text-slate-400">days</span></div>
                  </MetricCard>
                  <MetricCard title="Paid Holidays" icon="flight_takeoff">
                    <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{metrics?.yearlyHolidaysRemaining || 0} <span className="text-lg text-slate-400">/ 24</span></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2"><div className="bg-[#1a365d] dark:bg-blue-400 h-full" style={{ width: `${holidayPercentage}%` }}></div></div>
                  </MetricCard>
                </div>

                <LogTable logs={metrics?.logs?.slice(0, 5)} title="Recent Logs" onViewAll={() => setActiveTab('attendance')} />
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Full Attendance History</h2>
                <LogTable logs={metrics?.logs} title="All Clock-in Records" />
              </div>
            )}

            {activeTab === 'leaves' && (
              <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Request Time Off</h3>
                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                        <input type="date" required value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                        <input type="date" required value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Reason</label>
                        <textarea required value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg h-24 resize-none dark:text-white"></textarea>
                      </div>
                      <button type="submit" className="w-full bg-[#1a365d] text-white py-2 rounded-lg font-bold border-none cursor-pointer">Submit Request</button>
                    </form>
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"><h3 className="font-bold text-slate-800 dark:text-white">Your Leave History</h3></div>
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50 text-[10px] text-slate-400 uppercase border-b dark:border-slate-700">
                          <th className="px-6 py-3">Dates</th>
                          <th className="px-6 py-3">Reason</th>
                          <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveHistory.length === 0 ? (
                          <tr><td colSpan="3" className="p-6 text-center text-slate-400 italic">No leaves requested yet.</td></tr>
                        ) : (
                          leaveHistory.map((leave, i) => (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 font-medium dark:text-slate-200">{leave.start_date} to {leave.end_date}</td>
                              <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{leave.reason}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${leave.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : leave.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                                  {leave.status}
                               </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ id, icon, label, activeTab, setActiveTab }) => (
  <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${activeTab === id ? 'bg-slate-100 dark:bg-slate-700 text-[#1a365d] dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 bg-transparent'}`}>
    <span className="material-icons-outlined text-xl opacity-70">{icon}</span> {label}
  </button>
);

const MetricCard = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-colors">
    <div className="flex justify-between items-start mb-6">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      <span className="material-icons-outlined text-slate-300 dark:text-slate-500">{icon}</span>
    </div>
    <div>{children}</div>
  </div>
);

const LogTable = ({ logs, title, onViewAll }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors">
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
      <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase">{title}</h3>
      {onViewAll && <button onClick={onViewAll} className="text-[#1a365d] dark:text-blue-400 text-xs font-bold bg-transparent border-none cursor-pointer hover:underline">View All</button>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-700">
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Check-In</th>
            <th className="px-6 py-4">Check-Out</th>
            <th className="px-6 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {!logs || logs.length === 0 ? (
            <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">No logs found.</td></tr>
          ) : (
            logs.map((log, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-3 font-medium dark:text-slate-200">{log.date}</td>
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{log.check_in || '--:--'}</td>
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{log.check_out || '--:--'}</td>
                <td className="px-6 py-3 text-right">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${log.status === 'Present' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800'}`}>{log.status}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default EmployeeDashboard;