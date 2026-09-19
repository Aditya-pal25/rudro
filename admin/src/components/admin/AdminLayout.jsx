import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart3, LogOut, Menu, X, ChevronRight, Shield, Image, RotateCcw, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products',  label: 'Products',  icon: Package },
  { to: '/orders',    label: 'Orders',    icon: ShoppingBag },
  { to: '/returns',   label: 'Returns & Cancellations', icon: RotateCcw },
  { to: '/banners',   label: 'Banners',   icon: Image },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/coupons',   label: 'Coupons',   icon: Tag },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/';

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <div className={`${open ? 'w-56' : 'w-14'} bg-surface border-r border-border flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {open && <div className="flex items-center gap-2"><div className="w-6 h-6 bg-accent flex items-center justify-center"><Shield size={12} className="text-white"/></div><span className="font-display text-lg text-cream">RUDROHAM</span></div>}
          <button onClick={()=>setOpen(v=>!v)} className="p-1.5 text-muted hover:text-cream ml-auto">{open ? <X size={16}/> : <Menu size={16}/>}</button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 text-xs font-label font-semibold tracking-wider uppercase transition-all ${isActive(to, exact) ? 'bg-accent text-white' : 'text-muted hover:text-cream hover:bg-surface2'}`}>
              <Icon size={16} className="flex-shrink-0"/>{open && label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          {open && user && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user.name?.[0]?.toUpperCase()}</div>
              <div className="min-w-0"><p className="text-cream text-xs font-medium truncate">{user.name}</p><p className="text-muted text-[10px] uppercase font-label tracking-wider">Admin</p></div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted hover:text-accent transition-colors text-xs font-label uppercase tracking-wider w-full">
            <LogOut size={14} className="flex-shrink-0"/>{open && 'Logout'}
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-surface border-b border-border flex items-center px-6 gap-2 text-xs text-muted font-label tracking-wider flex-shrink-0">
          <span>Rudroham</span><ChevronRight size={12}/>
          <span className="text-cream capitalize">{navItems.find(n => isActive(n.to, n.exact))?.label || 'Dashboard'}</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>Admin Server Active
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-black"><Outlet /></div>
      </div>
    </div>
  );
}
