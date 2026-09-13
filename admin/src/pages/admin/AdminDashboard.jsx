import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Users, Package, ArrowUp, ArrowDown, Clock, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const COLORS = ['#E8351A', '#FFB800', '#3b82f6', '#10b981', '#8b5cf6'];
const STATUS_COLOR = { placed:'bg-blue-400', confirmed:'bg-blue-500', processing:'bg-yellow-400', shipped:'bg-purple-400', delivered:'bg-green-400', cancelled:'bg-red-400' };

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/admin/dashboard').then(r => r.data) });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="h-32 skeleton" />)}
    </div>
  );

  const { stats, recentOrders, topProducts, revenueChart, orderChart } = data;

  const statCards = [
    { label: 'Total Revenue', value: `₹${(stats?.revenue?.total || 0).toLocaleString()}`, sub: `₹${(stats?.revenue?.month || 0).toLocaleString()} this month`, icon: TrendingUp, growth: stats?.revenue?.growth },
    { label: 'Total Orders', value: stats?.orders?.total?.toLocaleString(), sub: `${stats?.orders?.today} today`, icon: ShoppingBag },
    { label: 'Customers', value: stats?.users?.total?.toLocaleString(), sub: `${stats?.users?.new} new this month`, icon: Users },
    { label: 'Products', value: stats?.products?.total?.toLocaleString(), sub: `${stats?.products?.lowStock} low stock`, icon: Package, alert: stats?.products?.lowStock > 0 },
  ];

  const chartData = (revenueChart || []).map(d => ({
    name: `${d._id.month}/${String(d._id.year).slice(-2)}`,
    revenue: Math.round(d.revenue),
    orders: d.orders,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-cream">DASHBOARD</h1>
        <p className="text-muted text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, growth, alert }) => (
          <div key={label} className={`bg-surface border p-5 ${alert ? 'border-yellow-500/50' : 'border-border'}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-label tracking-wider text-muted uppercase">{label}</p>
              <div className={`p-2 ${alert ? 'bg-yellow-500/10' : 'bg-surface2'}`}>
                {alert ? <AlertTriangle size={16} className="text-yellow-400" /> : <Icon size={16} className="text-accent" />}
              </div>
            </div>
            <p className="font-display text-3xl text-cream">{value}</p>
            <p className="text-xs text-muted mt-1">{sub}</p>
            {growth !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growth >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {Math.abs(growth)}% vs last month
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-border p-5">
          <h3 className="font-label font-semibold text-sm tracking-wider uppercase text-cream mb-5">Revenue (12 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid #202020', color: '#F2EDE4', fontSize: 12 }} formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#E8351A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface border border-border p-5">
          <h3 className="font-label font-semibold text-sm tracking-wider uppercase text-cream mb-5">Top Products</h3>
          <div className="space-y-3">
            {(topProducts || []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={p.image} alt="" className="w-10 h-12 object-cover bg-surface2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-cream text-xs font-medium truncate">{p.name}</p>
                  <p className="text-muted text-xs">{p.totalSold} sold</p>
                </div>
                <p className="text-accent text-xs font-semibold">₹{Math.round(p.revenue).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-label font-semibold text-sm tracking-wider uppercase text-cream">Recent Orders</h3>
          <Link to="/admin/orders" className="text-xs text-accent hover:underline font-label">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-label text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(recentOrders || []).map(order => (
                <tr key={order._id} className="hover:bg-surface2 transition-colors">
                  <td className="px-6 py-3 text-xs text-accent font-mono">{order.orderId}</td>
                  <td className="px-6 py-3 text-xs text-cream">{order.user?.name}</td>
                  <td className="px-6 py-3 text-xs text-cream">₹{order.pricing?.total?.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`badge text-white ${STATUS_COLOR[order.status] || 'bg-muted'}`}>
                      {order.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}