import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => api.get(`/admin/users?keyword=${search}&page=${page}`).then(r => r.data),
  });
  const toggleStatus = async (id) => {
    try { await api.put(`/admin/users/${id}/status`); qc.invalidateQueries(['admin-customers']); toast.success('Updated'); } catch { toast.error('Failed'); }
  };
  const changeRole = async (id, role) => {
    try { await api.put(`/admin/users/${id}/role`, { role }); qc.invalidateQueries(['admin-customers']); toast.success('Role updated'); } catch { toast.error('Failed'); }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-cream">CUSTOMERS</h1>
        <p className="text-muted text-sm">{data?.total || 0} users</p>
      </div>
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers..." className="input-field pl-9 py-2.5 text-sm" />
      </div>
      <div className="bg-surface border border-border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            {['Customer', 'Phone', 'Orders', 'Spent', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-label text-muted uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading ? [...Array(10)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-8 skeleton" /></td></tr>) :
            data?.users?.map(u => (
              <tr key={u._id} className="hover:bg-surface2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.[0]?.toUpperCase()}</div>
                    <div><p className="text-cream text-xs font-medium">{u.name}</p><p className="text-muted text-xs">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-xs text-cream">{u.totalOrders || 0}</td>
                <td className="px-4 py-3 text-xs text-cream">₹{(u.totalSpent || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.role === 'admin' ? 'bg-gold/10 text-gold' : 'bg-surface2 text-muted'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.isActive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>{u.isActive ? 'Active' : 'Blocked'}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleStatus(u._id)} title={u.isActive ? 'Block user' : 'Activate user'} className="p-1.5 text-muted hover:text-accent transition-colors">
                      {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => changeRole(u._id, 'admin')} title="Make admin" className="p-1.5 text-muted hover:text-gold transition-colors">
                        <ShieldCheck size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}