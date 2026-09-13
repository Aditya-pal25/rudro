import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Eye, X, Loader2, ChevronDown, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  PENDING:          'bg-yellow-400/10 text-yellow-400',
  APPROVED:         'bg-blue-400/10 text-blue-400',
  PICKUP_SCHEDULED: 'bg-indigo-400/10 text-indigo-400',
  PICKED_UP:        'bg-purple-400/10 text-purple-400',
  RECEIVED:         'bg-cyan-400/10 text-cyan-400',
  INSPECTED:        'bg-orange-400/10 text-orange-400',
  COMPLETED:        'bg-green-400/10 text-green-400',
  REJECTED:         'bg-red-400/10 text-red-400',
  CANCELLED:        'bg-gray-400/10 text-gray-400',
};

const TRANSITIONS = {
  PENDING:          ['APPROVED','REJECTED'],
  APPROVED:         ['PICKUP_SCHEDULED','CANCELLED'],
  PICKUP_SCHEDULED: ['PICKED_UP','CANCELLED'],
  PICKED_UP:        ['RECEIVED'],
  RECEIVED:         ['INSPECTED'],
  INSPECTED:        ['COMPLETED','REJECTED'],
};

function RequestDetail({ request, onClose }) {
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState(request.adminNote || '');
  const [refundAmount, setRefundAmount] = useState(request.refundAmount || 0);
  const qc = useQueryClient();

  const updateMut = useMutation({
    mutationFn: (payload) => api.put(`/returns/admin/${request._id}/status`, payload).then(r => r.data),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['admin-returns']); qc.invalidateQueries(['returns-summary']); onClose(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const allowed = TRANSITIONS[request.status] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label text-xs font-semibold uppercase tracking-wider text-accent">{request.type}</span>
              <span className={`text-xs px-2 py-0.5 font-label uppercase tracking-wider ${STATUS_COLORS[request.status]}`}>{request.status}</span>
            </div>
            <h2 className="font-display text-2xl text-cream">{request.requestNumber}</h2>
          </div>
          <button onClick={onClose}><X size={20} className="text-muted hover:text-cream" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface2 border border-border p-4 space-y-2">
              <p className="text-xs font-label font-semibold text-muted uppercase tracking-wider">Customer</p>
              <p className="text-sm text-cream font-medium">{request.user?.name}</p>
              <p className="text-xs text-muted">{request.user?.email}</p>
              {request.user?.phone && <p className="text-xs text-muted">{request.user.phone}</p>}
            </div>
            <div className="bg-surface2 border border-border p-4 space-y-2">
              <p className="text-xs font-label font-semibold text-muted uppercase tracking-wider">Order</p>
              <p className="text-sm text-cream font-medium">{request.order?.orderId}</p>
              <p className="text-xs text-muted">{request.order?.createdAt ? new Date(request.order.createdAt).toLocaleDateString() : ''}</p>
              <p className="text-xs text-muted">₹{request.order?.pricing?.total?.toLocaleString()}</p>
            </div>
          </div>

          {/* Item */}
          <div className="bg-surface2 border border-border p-4 flex gap-4">
            {request.itemSnapshot?.image && <img src={request.itemSnapshot.image} alt="" className="w-16 h-20 object-cover flex-shrink-0" />}
            <div>
              <p className="text-sm font-medium text-cream">{request.itemSnapshot?.productName}</p>
              <p className="text-xs text-muted mt-1">{request.itemSnapshot?.color} · {request.itemSnapshot?.size} · Qty {request.itemSnapshot?.quantity}</p>
              <p className="text-sm text-accent font-semibold mt-1">₹{request.itemSnapshot?.price?.toLocaleString()}</p>
            </div>
          </div>

          {/* ── CRITICAL: Exact customer reason + explanation ── */}
          <div className="border border-accent/30 bg-accent/5 p-4 space-y-3">
            <p className="text-xs font-label font-semibold text-accent uppercase tracking-wider">Customer Reason</p>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-label font-semibold mb-1">Selected Reason</p>
              <p className="text-sm text-cream font-medium">{request.reason}</p>
            </div>
            {request.customerNote && (
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-label font-semibold mb-1">Customer Explanation</p>
                <p className="text-sm text-cream leading-relaxed bg-black/30 p-3 border border-border/50">
                  "{request.customerNote}"
                </p>
              </div>
            )}
          </div>

          {/* Exchange variant */}
          {request.type === 'EXCHANGE' && request.requestedVariant && (
            <div className="bg-surface2 border border-border p-4">
              <p className="text-xs font-label font-semibold text-muted uppercase tracking-wider mb-2">Requested Replacement</p>
              <p className="text-sm text-cream">Color: <span className="text-accent">{request.requestedVariant.color}</span></p>
              <p className="text-sm text-cream">Size: <span className="text-accent">{request.requestedVariant.size}</span></p>
            </div>
          )}

          {/* Customer photos */}
          {request.images?.length > 0 && (
            <div>
              <p className="text-xs font-label font-semibold text-muted uppercase tracking-wider mb-2">Customer Photos</p>
              <div className="flex gap-2 flex-wrap">
                {request.images.map((img, i) => (
                  <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt="" className="w-20 h-20 object-cover border border-border hover:border-accent transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status history */}
          {request.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-label font-semibold text-muted uppercase tracking-wider mb-2">Status History</p>
              <div className="space-y-2">
                {request.statusHistory.map((h, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <span className={`px-2 py-0.5 font-label uppercase tracking-wider flex-shrink-0 ${STATUS_COLORS[h.status]}`}>{h.status}</span>
                    <span className="text-muted">{new Date(h.timestamp).toLocaleString()}</span>
                    {h.note && <span className="text-muted/70">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update status */}
          {allowed.length > 0 && (
            <div className="border border-border p-4 space-y-3">
              <p className="text-xs font-label font-semibold text-muted uppercase tracking-wider">Update Status</p>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field text-sm">
                <option value="">Select new status...</option>
                {allowed.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Admin note (optional)..." rows={2} className="input-field text-sm resize-none" />
              {newStatus === 'COMPLETED' && (
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider block mb-1">Refund Amount (₹)</label>
                  <input type="number" value={refundAmount} onChange={e => setRefundAmount(Number(e.target.value))} className="input-field text-sm" />
                </div>
              )}
              <button onClick={() => updateMut.mutate({ status: newStatus, adminNote, refundAmount })}
                disabled={!newStatus || updateMut.isPending}
                className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-50">
                {updateMut.isPending ? <><Loader2 size={14} className="animate-spin"/> Updating...</> : 'Update Status'}
              </button>
            </div>
          )}

          {request.adminNote && (
            <div className="bg-surface2 border border-border p-3">
              <p className="text-xs font-label text-muted uppercase tracking-wider mb-1">Admin Note</p>
              <p className="text-sm text-cream">{request.adminNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReturns() {
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-returns', statusFilter, typeFilter, page],
    queryFn: () => api.get(`/returns/admin/all?status=${statusFilter}&type=${typeFilter}&page=${page}&limit=20`).then(r => r.data),
  });

  const requests = data?.requests || [];

  return (
    <div className="space-y-6">
      <div>
        <span className="section-label">After-Sale Management</span>
        <h1 className="font-display text-4xl text-cream">RETURNS & EXCHANGES</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}} className="input-field text-sm py-2 w-36">
          <option value="">All Types</option>
          <option value="RETURN">Returns</option>
          <option value="EXCHANGE">Exchanges</option>
        </select>
        <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}} className="input-field text-sm py-2 w-44">
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {(statusFilter||typeFilter) && (
          <button onClick={()=>{setStatusFilter('');setTypeFilter('');setPage(1);}} className="text-xs text-muted hover:text-cream border border-border px-3 py-2 flex items-center gap-1">
            <X size={12}/> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="h-16 skeleton"/>)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <RotateCcw size={32} className="mx-auto text-muted mb-3"/>
          <p className="text-muted text-sm font-label uppercase tracking-wider">No requests found</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req._id} className="bg-surface border border-border p-4 flex items-center gap-4 hover:border-muted transition-colors cursor-pointer" onClick={()=>setSelected(req)}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-label font-semibold text-cream text-sm">{req.requestNumber}</span>
                    <span className={`text-xs px-2 py-0.5 font-label uppercase tracking-wider ${req.type==='RETURN'?'bg-orange-400/10 text-orange-400':'bg-blue-400/10 text-blue-400'}`}>{req.type}</span>
                    <span className={`text-xs px-2 py-0.5 font-label uppercase tracking-wider ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                  </div>
                  <p className="text-xs text-muted truncate">{req.itemSnapshot?.productName} · {req.user?.name}</p>
                  {/* Show reason preview */}
                  <p className="text-xs text-muted/70 mt-0.5 truncate">"{req.reason}{req.customerNote ? ` — ${req.customerNote.slice(0,60)}...` : ''}"</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted">{new Date(req.createdAt).toLocaleDateString()}</p>
                  <button className="text-xs text-accent hover:underline mt-1 flex items-center gap-1"><Eye size={11}/>View</button>
                </div>
              </div>
            ))}
          </div>

          {data?.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 border border-border text-muted text-sm disabled:opacity-40 hover:border-accent hover:text-cream">←</button>
              <span className="text-muted text-sm">{page} / {data.pages}</span>
              <button onClick={()=>setPage(p=>Math.min(data.pages,p+1))} disabled={page===data.pages} className="px-3 py-1.5 border border-border text-muted text-sm disabled:opacity-40 hover:border-accent hover:text-cream">→</button>
            </div>
          )}
        </>
      )}

      {selected && <RequestDetail request={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}
