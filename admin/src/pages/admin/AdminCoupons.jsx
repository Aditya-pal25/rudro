import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { code: '', description: '', type: 'percentage', value: '', minOrderAmount: 0, maxDiscount: '', usageLimit: '', perUserLimit: 1, endDate: '', isActive: true };

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { data } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api.get('/coupons').then(r => r.data) });

  const save = async () => {
    try {
      if (form._id) await api.put(`/coupons/${form._id}`, form);
      else await api.post('/coupons', form);
      qc.invalidateQueries(['admin-coupons']); setModal(false); setForm(emptyForm);
      toast.success(form._id ? 'Coupon updated!' : 'Coupon created!');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete coupon?')) return;
    try { await api.delete(`/coupons/${id}`); qc.invalidateQueries(['admin-coupons']); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-cream">COUPONS</h1>
        <button onClick={() => { setForm(emptyForm); setModal(true); }} className="btn-primary text-xs py-2.5 px-5"><Plus size={14} /> Add Coupon</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.coupons?.map(c => (
          <div key={c._id} className="bg-surface border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-display text-2xl text-accent">{c.code}</p>
                <p className="text-muted text-xs mt-0.5">{c.description}</p>
              </div>
              <span className={`badge ${c.isActive && new Date(c.endDate) > new Date() ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>{c.isActive && new Date(c.endDate) > new Date() ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="space-y-1.5 text-xs text-muted mb-4">
              <p>Discount: <span className="text-cream">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</span> {c.maxDiscount ? `(max ₹${c.maxDiscount})` : ''}</p>
              <p>Min order: <span className="text-cream">₹{c.minOrderAmount}</span></p>
              <p>Used: <span className="text-cream">{c.usedCount}</span>{c.usageLimit ? ` / ${c.usageLimit}` : ''}</p>
              <p>Expires: <span className="text-cream">{new Date(c.endDate).toLocaleDateString('en-IN')}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({...c, endDate: c.endDate?.slice(0,10)}); setModal(true); }} className="btn-ghost text-xs"><Edit2 size={12} /> Edit</button>
              <button onClick={() => del(c._id)} className="btn-ghost text-xs text-red-400 hover:text-red-300"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="bg-surface border border-border w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-label font-semibold tracking-wider uppercase text-cream">{form._id ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button onClick={() => setModal(false)} className="text-muted hover:text-cream text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Code *</label>
                  <input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="input-field font-mono" placeholder="SAVE20" />
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Type</label>
                  <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} className="input-field">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm(f=>({...f,value:e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm(f=>({...f,maxDiscount:e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Min Order (₹)</label>
                  <input type="number" value={form.minOrderAmount} onChange={e => setForm(f=>({...f,minOrderAmount:e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Expiry Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Description</label>
                <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="input-field" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))} className={`w-4 h-4 border cursor-pointer flex items-center justify-center ${form.isActive ? 'bg-accent border-accent' : 'border-border'}`}>
                  {form.isActive && <div className="w-2 h-2 bg-white" />}
                </div>
                <span className="text-sm text-muted cursor-pointer" onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}>Active</span>
              </label>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={save} className="btn-primary">Save Coupon</button>
              <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}