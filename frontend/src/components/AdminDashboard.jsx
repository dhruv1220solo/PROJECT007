import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logoutUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false); // NEW: Dark Mode State
  
  // Data States
  const [employees, setEmployees] = useState([]); 
  const [allUsers, setAllUsers] = useState([]);   
  const [allLogs, setAllLogs] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]); 
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employee', department: '', designation: ''
  });

  const fetchAdminData = async () => {
    try {
      const [liveRes, logsRes, usersRes, leavesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance/admin/live-status'),
        axios.get('http://localhost:5000/api/attendance/admin/all-logs'),
        axios.get('http://localhost:5000/api/users'),
        axios.get('http://localhost:5000/api/attendance/admin/leaves')
      ]);

      if (liveRes.data.status === 'success') {
        setLiveCount(liveRes.data.activeEmployeesCount || 0);
        setEmployees(liveRes.data.activeEmployees || []);
      }
      if (logsRes.data.status === 'success') setAllLogs(logsRes.data.logs || []);
      if (usersRes.data.status === 'success') setAllUsers(usersRes.data.users || []);
      if (leavesRes.data.status === 'success') setAllLeaves(leavesRes.data.leaves || []);
      
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // Check local storage for theme preference on load
    if (localStorage.getItem('theme') === 'dark') setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const handleLeaveAction = async (leaveId, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/attendance/admin/leaves/${leaveId}`, { status: newStatus });
      if (res.data.status === 'success') fetchAdminData(); 
    } catch (error) {
      console.error("Failed to process leave request", error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/register', formData);
      if (res.data.status === 'success') {
        setFormMsg('Employee registered successfully!');
        setFormData({ name: '', email: '', password: '', role: 'employee', department: '', designation: '' });
        setTimeout(() => setIsModalOpen(false), 1500); 
        fetchAdminData(); 
      }
    } catch (error) {
      setFormMsg(error.response?.data?.message || 'Failed to register employee.');
    }
  };

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  if (loading) return <div className="p-8 font-sans text-sm text-slate-500">Loading system data...</div>;

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col py-8 px-4 fixed h-full z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-8 h-8 bg-[#1a365d] rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white leading-none">WorkforceOS</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">System Administration</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-none text-left cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#1a365d] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <span className="material-icons-outlined text-sm">dashboard</span> Dashboard
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-none text-left cursor-pointer ${activeTab === 'users' ? 'bg-[#1a365d] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <span className="material-icons-outlined text-sm">group</span> User Management
            </button>
            <button onClick={() => setActiveTab('logs')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-none text-left cursor-pointer ${activeTab === 'logs' ? 'bg-[#1a365d] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <span className="material-icons-outlined text-sm">event_note</span> Attendance Logs
            </button>
            <button onClick={() => setActiveTab('leaves')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border-none text-left cursor-pointer ${activeTab === 'leaves' ? 'bg-[#1a365d] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <span className="material-icons-outlined text-sm">event_busy</span> Leave Requests
            </button>
          </nav>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-1">
            {/* THEME TOGGLE BUTTON */}
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 bg-transparent border-none text-left cursor-pointer">
              <span className="material-icons-outlined text-lg">{darkMode ? 'light_mode' : 'dark_mode'}</span> 
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <button onClick={logoutUser} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 bg-transparent border-none text-left cursor-pointer">
              <span className="material-icons-outlined text-lg">logout</span> Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8 relative">
          <header className="flex justify-between items-center mb-8">
            <div className="relative w-96">
              <input type="text" placeholder="Search data records..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a365d] transition-colors" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Admin Session: <span className="font-bold text-slate-900 dark:text-white">{user?.name || 'Master Admin'}</span>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    System Management Console 
                    <span className="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full ml-3 font-bold uppercase tracking-wider border border-red-100 dark:border-red-800 align-middle">Role: Master Admin</span>
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Overview of system health, active personnel, and master controls.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-[#1a365d] text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-[#152c4d] transition-colors border-none cursor-pointer">
                  <span className="text-lg leading-none">+</span> Add New Employee
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden transition-colors">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Active On-Site Staff</span>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter">{liveCount}</span>
                    <span className="text-sm text-slate-400 font-medium">Employees Online</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-center transition-colors">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">System Safety Net</span>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Automated 10:00 PM Check-Out Watchdog Active</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ensuring automatic archival sequences for late operating sessions.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="animate-fade-in space-y-8">
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Employee Directory (Live)</h3>
                  <button onClick={() => setIsModalOpen(true)} className="text-[#1a365d] dark:text-blue-400 text-xs font-bold bg-transparent border-none cursor-pointer hover:underline">+ Register User</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {employees.length === 0 ? (
                        <tr><td colSpan="4" className="px-6 py-8 text-center text-xs text-slate-400 italic">No employees currently active on-site.</td></tr>
                      ) : (
                        employees.map((emp, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono">#{emp.id}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-xs">{emp.name}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{emp.email}</td>
                            <td className="px-6 py-4 text-right"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">Online</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Complete System Roster</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {allUsers.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-xs text-slate-400 italic">No users registered.</td></tr>
                      ) : (
                        allUsers.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono">#{u.id}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-xs">{u.name}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{u.email}</td>
                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{u.department || 'Unassigned'}</td>
                            <td className="px-6 py-4 text-right">
                               <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
                                  {u.role}
                               </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'logs' && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Global Clocking Ledger</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-3">Employee Name</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Check-In</th>
                      <th className="px-6 py-3">Check-Out</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {allLogs.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-xs text-slate-400 italic">No transaction records found.</td></tr>
                    ) : (
                      allLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-xs text-slate-800 dark:text-white">{log.employeeName}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{log.date.split('T')[0]}</td>
                          <td className="px-6 py-4 text-xs font-mono text-emerald-700 dark:text-emerald-400">{log.check_in || '--:--'}</td>
                          <td className="px-6 py-4 text-xs font-mono text-red-700 dark:text-red-400">{log.check_out || '--:--'}</td>
                          <td className="px-6 py-4 text-xs text-right font-medium text-slate-600 dark:text-slate-300 uppercase">{log.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'leaves' && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Employee Leave Requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-3">Employee Name</th>
                      <th className="px-6 py-3">Dates Requested</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {allLeaves.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-xs text-slate-400 italic">No pending leave requests.</td></tr>
                    ) : (
                      allLeaves.map((leave, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-xs text-slate-800 dark:text-white">{leave.employeeName}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{leave.start_date} <br/><span className="text-[10px] uppercase">to</span> {leave.end_date}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${leave.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : leave.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                               {leave.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {leave.status === 'Pending' ? (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleLeaveAction(leave.id, 'Approved')} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 border-none cursor-pointer">Approve</button>
                                <button onClick={() => handleLeaveAction(leave.id, 'Rejected')} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 border-none cursor-pointer">Reject</button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </main>

        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h2 className="font-bold text-slate-800 dark:text-white">Register New Personnel</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white bg-transparent border-none cursor-pointer text-lg">&times;</button>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
                {formMsg && (
                  <div className={`p-3 rounded text-xs font-medium ${formMsg.includes('success') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {formMsg}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a365d]" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleFormChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a365d]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Department</label>
                    <input type="text" name="department" value={formData.department} onChange={handleFormChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a365d]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Role</label>
                    <select name="role" value={formData.role} onChange={handleFormChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a365d]">
                      <option value="employee">Employee</option>
                      <option value="admin">Master Admin</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Temporary Password</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleFormChange} className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a365d]" />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-sm border-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-[#1a365d] text-white rounded-lg font-bold text-sm border-none cursor-pointer hover:bg-[#152c4d] transition-colors">Provision</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;