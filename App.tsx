import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatsRow } from './components/StatsRow';
import { ChartSection } from './components/ChartSection';
import { CampaignManager } from './components/CampaignManager';
import { AccountManager } from './components/AccountManager';
import { UserManager } from './components/UserManager';
import { CampaignTable } from './components/CampaignTable';
import { Login } from './components/Login';
import { Menu, Megaphone, Activity, Trash2, Users, Archive, Folder, Shield, Calendar } from 'lucide-react';
import { Campaign, Account, DashboardUser, Permission } from './types';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

// Default Admin User
const defaultAdmin: DashboardUser = {
  id: 'admin',
  name: 'John Don',
  email: 'johndon@company.com',
  password: 'admin',
  permissions: ['manage_campaigns', 'delete_campaigns', 'manage_accounts', 'view_accounts', 'manage_users'],
  createdAt: Date.now()
};

function App() {
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([defaultAdmin]);
  const [totalCreated, setTotalCreated] = useState(0);
  const [currentView, setCurrentView] = useState<'home' | 'campaigns' | 'active' | 'deleted' | 'accounts' | 'users'>('home');
  
  // Filtering State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'Active' | 'Deleted' | null>(null);

  // --- Auth Handlers ---
  const handleLogin = (email: string, pass: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setLoginError(undefined);
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setSelectedMonthIndex(null);
    setSelectedStatusFilter(null);
  };

  // --- Campaign Handlers ---
  const handleAddCampaign = (keyword: string, link: string, continuous: boolean) => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      keyword,
      link,
      clicks: 0,
      status: 'Active',
      trend: 0,
      createdAt: Date.now(),
      continuous
    };
    setCampaigns(prev => [newCampaign, ...prev]);
    setTotalCreated(prev => prev + 1);
  };

  const handleDeleteAllActive = () => {
    if (window.confirm('Are you sure you want to delete all active campaigns?')) {
      setCampaigns(prev => prev.map(c => 
        c.status === 'Active' ? { ...c, status: 'Deleted' } : c
      ));
    }
  };

  const handleDeleteOne = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'Deleted' } : c
    ));
  };

  const handleRestoreOne = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'Active' } : c
    ));
  };

  // --- Account Handlers ---
  const handleAddAccount = (data: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      id: Date.now().toString(),
      ...data,
      createdAt: Date.now()
    };
    setAccounts(prev => [newAccount, ...prev]);
  };

  const handleBulkAddAccounts = (newAccountsData: Omit<Account, 'id' | 'createdAt'>[]) => {
    const timestamp = Date.now();
    const newAccounts: Account[] = newAccountsData.map((data, i) => ({
      id: `${timestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: timestamp
    }));
    setAccounts(prev => [...newAccounts, ...prev]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // --- User Handlers ---
  const handleAddUser = (name: string, email: string, permissions: Permission[], password?: string) => {
    const newUser: DashboardUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In a real app, hash this
      permissions,
      createdAt: Date.now()
    };
    setUsers(prev => [newUser, ...prev]);
  };

  const handleEditUser = (id: string, name: string, email: string, permissions: Permission[], password?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return {
          ...u,
          name,
          email,
          permissions,
          password: password || u.password // Keep old password if not provided
        };
      }
      return u;
    }));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    // If the logged-in user deletes themselves, log them out immediately
    if (currentUser && currentUser.id === id) {
      handleLogout();
    }
  };

  // --- Derived State ---
  const activeCampaigns = campaigns.filter(c => c.status !== 'Deleted');
  const deletedCampaigns = campaigns.filter(c => c.status === 'Deleted');
  const activeCount = activeCampaigns.length;
  const deletedCount = deletedCampaigns.length;

  // Chart Data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const barChartData = useMemo(() => {
    const data = months.map(name => ({ name, active: 0, deleted: 0 }));
    campaigns.forEach(c => {
      const date = new Date(c.createdAt);
      const monthIndex = date.getMonth();
      if (c.status === 'Deleted') {
        data[monthIndex].deleted++;
      } else {
        data[monthIndex].active++;
      }
    });
    return data;
  }, [campaigns]);

  // Handle Chart Click
  const handleChartClick = (index: number, type?: 'Active' | 'Deleted') => {
    setSelectedMonthIndex(index);
    setSelectedStatusFilter(type || null);
  };

  const handleCloseDetailView = () => {
    setSelectedMonthIndex(null);
    setSelectedStatusFilter(null);
  };

  // Table Data: Filters by Month AND Status (if specific bar clicked)
  const filteredCampaignsByMonth = useMemo(() => {
    if (selectedMonthIndex === null) return [];
    return campaigns.filter(c => {
      const d = new Date(c.createdAt);
      const matchesMonth = d.getMonth() === selectedMonthIndex;
      const matchesStatus = selectedStatusFilter ? c.status === selectedStatusFilter : true;
      return matchesMonth && matchesStatus;
    });
  }, [campaigns, selectedMonthIndex, selectedStatusFilter]);

  // Pie Chart Data Logic - Syncs ONLY with Month Selection (ignores specific status bar click)
  const pieStats = useMemo(() => {
    if (selectedMonthIndex === null) {
      // Global stats
      return {
        active: activeCount,
        deleted: deletedCount,
        total: activeCount + deletedCount
      };
    } else {
      // Filtered by month ONLY (ignores selectedStatusFilter)
      const activeInMonth = campaigns.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === selectedMonthIndex && c.status !== 'Deleted';
      }).length;
      
      const deletedInMonth = campaigns.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === selectedMonthIndex && c.status === 'Deleted';
      }).length;

      return {
        active: activeInMonth,
        deleted: deletedInMonth,
        total: activeInMonth + deletedInMonth
      };
    }
  }, [campaigns, selectedMonthIndex, activeCount, deletedCount]); // Removed selectedStatusFilter dependency

  const pieChartData = [
    { name: 'Active', value: pieStats.active, color: '#111f36' },
    { name: 'Deleted', value: pieStats.deleted, color: '#F59E0B' },
  ];

  const getPageTitle = () => {
    switch (currentView) {
      case 'home': return 'MRo';
      case 'campaigns': return 'Campaign Management';
      case 'active': return 'Active Campaigns';
      case 'deleted': return 'Deleted Campaigns';
      case 'accounts': return 'Account Management';
      case 'users': return 'User Management';
      default: return 'MRo';
    }
  };

  // Helper title for the detail view
  const getDetailTitle = () => {
    if (selectedMonthIndex === null) return '';
    const month = months[selectedMonthIndex];
    if (selectedStatusFilter === 'Active') return `Active Campaigns in ${month}`;
    if (selectedStatusFilter === 'Deleted') return `Deleted Campaigns in ${month}`;
    return `Campaigns in ${month}`;
  };

  // --- Render Login if not authenticated ---
  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="flex min-h-screen bg-[#EEF1F5] text-slate-800 font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        user={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 lg:p-10 transition-all">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Welcome back, {currentUser.name.split(' ')[0]}</p>
          </div>
          <button className="md:hidden p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        {/* --- HOME VIEW --- */}
        {currentView === 'home' && (
          <div className="animate-fade-in">
            <StatsRow 
               totalCampaigns={totalCreated} 
               activeCount={activeCount}
               deletedCount={deletedCount}
               totalAccounts={accounts.length}
               onNavigate={setCurrentView}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
               <div className="lg:col-span-2">
                  <ChartSection 
                    data={barChartData} 
                    onBarClick={handleChartClick} 
                  />
               </div>
               <div className="lg:col-span-1 flex flex-col">
                  <div className="bg-white rounded-3xl p-6 shadow-lg flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                     <h3 className="text-gray-700 font-semibold mb-2 self-start">
                        Campaign Report
                        {selectedMonthIndex !== null && <span className="text-brand-accent ml-2">({months[selectedMonthIndex]})</span>}
                     </h3>
                     <div className="w-full h-48 relative">
                        {pieStats.total === 0 ? (
                           <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No data available</div>
                        ) : (
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={pieChartData}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {pieChartData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                 </Pie>
                                 <Tooltip />
                              </PieChart>
                           </ResponsiveContainer>
                        )}
                        {pieStats.total > 0 && (
                           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                              <span className="text-2xl font-bold text-brand-dark">
                                {Math.round((pieStats.active / (pieStats.total || 1)) * 100)}%
                              </span>
                              <span className="block text-xs text-gray-400">Active</span>
                           </div>
                        )}
                     </div>
                     <div className="mt-4 space-y-3 w-full px-4">
                        <div className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-brand-dark"></div>
                             <span className="text-gray-500">Active</span>
                          </div>
                          <span className="font-bold text-gray-700">{pieStats.active}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-brand-accent"></div>
                             <span className="text-gray-500">Deleted</span>
                          </div>
                          <span className="font-bold text-gray-700">{pieStats.deleted}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Selected Month Detail View */}
            {selectedMonthIndex !== null && (
               <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 min-h-[300px] animate-fade-in mb-12">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-brand-dark rounded-lg text-white">
                          <Calendar size={20} />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-brand-dark">{getDetailTitle()}</h3>
                          <p className="text-xs text-gray-400">Monthly breakdown</p>
                       </div>
                    </div>
                    <button 
                      onClick={handleCloseDetailView}
                      className="text-gray-400 hover:text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-100 text-sm"
                    >
                      Close View
                    </button>
                  </div>
                  
                  {filteredCampaignsByMonth.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                       <Folder size={40} className="mb-4 text-gray-200" />
                       <p>No {selectedStatusFilter ? selectedStatusFilter.toLowerCase() : ''} campaigns found for {months[selectedMonthIndex]}.</p>
                    </div>
                  ) : (
                    <CampaignTable 
                      data={filteredCampaignsByMonth} 
                      onDelete={handleDeleteOne}
                      onRestore={handleRestoreOne}
                    />
                  )}
               </div>
            )}
          </div>
        )}

        {/* --- CAMPAIGNS MANAGER VIEW --- */}
        {currentView === 'campaigns' && (
          <div className="animate-fade-in">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-brand-dark rounded-lg text-white">
                    <Megaphone size={20} />
                 </div>
                 <h2 className="text-2xl font-bold text-brand-dark">Manager</h2>
             </div>
             <CampaignManager 
                campaigns={campaigns}
                onAdd={handleAddCampaign}
                onDeleteAll={handleDeleteAllActive}
                onDeleteOne={handleDeleteOne}
             />
          </div>
        )}

        {/* --- ACTIVE CAMPAIGNS VIEW --- */}
        {currentView === 'active' && (
          <div className="animate-fade-in">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-brand-dark rounded-lg text-white">
                    <Activity size={20} />
                 </div>
                 <h2 className="text-2xl font-bold text-brand-dark">Active Campaigns List</h2>
             </div>
             <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 min-h-[400px]">
                {activeCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-center h-full">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Folder size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">No active campaigns.</p>
                  </div>
                ) : (
                  <CampaignTable 
                    data={activeCampaigns} 
                    onDelete={handleDeleteOne} 
                  />
                )}
             </div>
          </div>
        )}

        {/* --- DELETED CAMPAIGNS VIEW --- */}
        {currentView === 'deleted' && (
          <div className="animate-fade-in">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-brand-dark rounded-lg text-white">
                    <Trash2 size={20} />
                 </div>
                 <h2 className="text-2xl font-bold text-brand-dark">Deleted Campaigns History</h2>
             </div>
             <div className="bg-gray-50 rounded-3xl shadow-inner overflow-hidden border border-gray-200 min-h-[400px]">
                {deletedCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 text-center h-full">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                      <Archive size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">Trash is empty.</p>
                  </div>
                ) : (
                  <CampaignTable 
                    data={deletedCampaigns} 
                    onRestore={handleRestoreOne} 
                  />
                )}
             </div>
          </div>
        )}

        {/* --- ACCOUNTS VIEW --- */}
        {currentView === 'accounts' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-brand-dark rounded-lg text-white">
                    <Shield size={20} />
                 </div>
                 <h2 className="text-2xl font-bold text-brand-dark">Account Settings</h2>
            </div>
            <AccountManager 
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onBulkAddAccounts={handleBulkAddAccounts}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        )}

        {/* --- USERS VIEW --- */}
        {currentView === 'users' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-brand-dark rounded-lg text-white">
                    <Users size={20} />
                 </div>
                 <h2 className="text-2xl font-bold text-brand-dark">User Management</h2>
            </div>
            <UserManager 
              users={users}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;