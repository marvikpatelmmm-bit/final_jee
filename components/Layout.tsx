import React from 'react';
import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, UserCircle, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (!currentUser) return <>{children}</>;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
            : 'text-gray-400 hover:bg-bg-tertiary hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary text-gray-100 font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-bg-secondary border-b border-white/5 sticky top-0 z-50">
        <div className="font-bold text-xl tracking-tight text-white">JEE<span className="text-accent-blue">Tracker</span></div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-bg-secondary border-r border-white/5 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">JEE<span className="text-accent-blue">Tracker</span></h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Accountability</p>
          </div>

          <div className="px-4 py-2">
            <div className="flex items-center gap-3 p-3 mb-6 bg-bg-tertiary rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold text-lg">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/leaderboard" icon={Trophy} label="Leaderboard" />
              <NavItem to="/profile" icon={UserCircle} label="Profile" />
            </nav>
          </div>

          <div className="absolute bottom-0 w-full p-4 border-t border-white/5">
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-bg-primary relative w-full">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            {children}
          </div>
        </main>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
};