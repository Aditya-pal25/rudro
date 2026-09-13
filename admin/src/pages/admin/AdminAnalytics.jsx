import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#E8351A', '#FFB800', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];

export default function AdminAnalytics() {
  const { data } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => api.get('/admin/analytics').then(r => r.data) });
  const { data: stats } = useQuery({ queryKey: ['order-stats'], queryFn: () => api.get('/orders/stats').then(r => r.data) });

  const categoryData = (data?.categoryStats || []).map(d => ({ name: d._id, value: d.count, revenue: Math.round(d.revenue) }));
  const sizeData = (data?.sizeStats || []).map(d => ({ size: d._id, count: d.count }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-cream">ANALYTICS</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['Total Revenue', `₹${(stats?.stats?.totalRevenue || 0).toLocaleString()}`, 'text-accent'],
          ['Today\'s Orders', stats?.stats?.todayOrders || 0, 'text-blue-400'],
          ['This Month', stats?.stats?.monthOrders || 0, 'text-green-400'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-surface border border-border p-5">
            <p className="text-xs font-label text-muted uppercase tracking-wider mb-2">{label}</p>
            <p className={`font-display text-4xl ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border p-5">
          <h3 className="font-label font-semibold text-sm tracking-wider uppercase text-cream mb-6">Sales by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#161616', border: '1px solid #202020', color: '#F2EDE4', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-muted text-sm">No data yet</div>}
        </div>
        <div className="bg-surface border border-border p-5">
          <h3 className="font-label font-semibold text-sm tracking-wider uppercase text-cream mb-6">Sales by Size</h3>
          {sizeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sizeData}>
                <XAxis dataKey="size" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#161616', border: '1px solid #202020', color: '#F2EDE4', fontSize: 12 }} />
                <Bar dataKey="count" fill="#E8351A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-muted text-sm">No data yet</div>}
        </div>
      </div>

      <div className="bg-surface border border-border p-5">
        <h3 className="font-label font-semibold text-sm tracking-wider uppercase text-cream mb-4">Order Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(stats?.stats?.statusStats || []).map(({ _id, count }) => (
            <div key={_id} className="bg-surface2 border border-border p-4 text-center">
              <p className="font-display text-3xl text-cream">{count}</p>
              <p className="text-muted text-xs font-label uppercase tracking-wider mt-1">{_id?.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}