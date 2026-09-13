import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['placed','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned','refunded'];
const STATUS_COLOR = { placed:'text-blue-400', confirmed:'text-blue-400', processing:'text-yellow-400', packed:'text-orange-400', shipped:'text-purple-400', out_for_delivery:'text-indigo-400', delivered:'text-green-400', cancelled:'text-red-400', returned:'text-red-400', refunded:'text-gray-400' };

export default function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => api.get(`/orders/all?status=${statusFilter}&page=${page}&limit=20`).then(r => r.data),
  });

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      qc.invalidateQueries(['admin-orders']);
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-cream">ORDERS</h1>
        <p className="text-muted text-sm">{data?.total || 0} total orders</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`font-label text-xs font-semibold tracking-wider uppercase px-3 py-1.5 border transition-colors ${statusFilter === s ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:text-cream'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-label text-muted uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading ? [...Array(10)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-8 skeleton" /></td></tr>) :
            data?.orders?.map(order => {
              const isExp = expanded === order._id;
              return <>
                <tr key={order._id} className="hover:bg-surface2 transition-colors">
                  <td className="px-4 py-3 text-xs text-accent font-mono">{order.orderId}</td>
                  <td className="px-4 py-3">
                    <p className="text-cream text-xs font-medium">{order.user?.name}</p>
                    <p className="text-muted text-xs">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{order.items?.length} item(s)</td>
                  <td className="px-4 py-3 text-sm text-cream font-semibold">₹{order.pricing?.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${order.payment?.status === 'paid' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                      {order.payment?.status} • {order.payment?.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={order.status} onChange={e => updateStatus(order._id, e.target.value)}
                      className={`bg-surface2 border border-border text-xs font-label px-2 py-1 focus:outline-none ${STATUS_COLOR[order.status]}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setExpanded(isExp ? null : order._id)} className="text-muted hover:text-cream transition-colors">
                      {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {isExp && (
                  <tr key={`${order._id}-exp`} className="bg-surface2">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-label font-semibold tracking-wider text-muted uppercase mb-2">Items</p>
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex gap-3 mb-2">
                              <img src={item.image} alt="" className="w-10 h-12 object-cover bg-surface" />
                              <div className="text-xs">
                                <p className="text-cream">{item.name}</p>
                                <p className="text-muted">{item.color} / {item.size} × {item.quantity}</p>
                                <p className="text-accent">₹{((item.discountPrice||item.price)*item.quantity).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-label font-semibold tracking-wider text-muted uppercase mb-2">Shipping Address</p>
                          <div className="text-xs text-muted space-y-0.5">
                            <p className="text-cream">{order.shippingAddress?.fullName}</p>
                            <p>{order.shippingAddress?.addressLine1}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                            <p>{order.shippingAddress?.phone}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>;
            })}
          </tbody>
        </table>
      </div>
      {data?.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(data.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i+1)} className={`w-8 h-8 text-xs font-label font-semibold border transition-colors ${page === i+1 ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:text-cream'}`}>{i+1}</button>
          ))}
        </div>
      )}
    </div>
  );
}