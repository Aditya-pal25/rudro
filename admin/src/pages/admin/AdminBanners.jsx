import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, X, Calendar, Link as LinkIcon } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BANNER_TYPES = ['PROMOTION','ANNOUNCEMENT','NEW_COLLECTION','FESTIVAL','FREE_SHIPPING','CUSTOM'];
const EMPTY_FORM = { title:'', subtitle:'', description:'', buttonText:'Shop Now', link:'/shop', type:'PROMOTION', isActive:true, startDate:'', endDate:'', priority:0, image:{ url:'', publicId:'' } };

function BannerForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative bg-surface border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-2xl text-cream">{initial._id ? 'EDIT BANNER' : 'NEW BANNER'}</h2>
          <button onClick={onCancel}><X size={20} className="text-muted hover:text-cream" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. GET 20% OFF" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Subtitle</label>
              <input value={form.subtitle} onChange={e=>set('subtitle',e.target.value)} placeholder="e.g. Limited Time Offer" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Type</label>
              <select value={form.type} onChange={e=>set('type',e.target.value)} className="input-field">
                {BANNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="Use code WELCOME20 on your first order" className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Button Text</label>
              <input value={form.buttonText} onChange={e=>set('buttonText',e.target.value)} placeholder="Shop Now" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Link</label>
              <input value={form.link} onChange={e=>set('link',e.target.value)} placeholder="/shop" className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Banner Image URL</label>
            <input value={form.image?.url||''} onChange={e=>set('image',{...form.image,url:e.target.value})} placeholder="https://..." className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Start Date</label>
              <input type="datetime-local" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">End Date</label>
              <input type="datetime-local" value={form.endDate} onChange={e=>set('endDate',e.target.value)} className="input-field text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Priority (higher = first)</label>
              <input type="number" value={form.priority} onChange={e=>set('priority',Number(e.target.value))} className="input-field" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={()=>set('isActive',!form.isActive)} className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? 'bg-accent' : 'bg-surface2 border border-border'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-cream">{form.isActive ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={()=>onSave(form)} disabled={saving || !form.title} className="btn-primary flex-1 justify-center py-3 disabled:opacity-50">
              {saving ? <><Loader2 size={14} className="animate-spin"/> Saving...</> : 'Save Banner'}
            </button>
            <button onClick={onCancel} className="btn-outline px-6">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/banners').then(r => r.data),
  });

  const createMut = useMutation({ mutationFn: d => api.post('/banners',d), onSuccess: () => { toast.success('Banner created'); qc.invalidateQueries(['admin-banners']); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({id,...d}) => api.put(`/banners/${id}`,d), onSuccess: () => { toast.success('Banner updated'); qc.invalidateQueries(['admin-banners']); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => api.delete(`/banners/${id}`), onSuccess: () => { toast.success('Banner deleted'); qc.invalidateQueries(['admin-banners']); } });
  const toggleMut = useMutation({ mutationFn: id => api.patch(`/banners/${id}/toggle`), onSuccess: () => qc.invalidateQueries(['admin-banners']) });

  const handleSave = (form) => {
    const payload = { ...form, startDate: form.startDate||undefined, endDate: form.endDate||undefined };
    if (editing) { updateMut.mutate({ id: editing._id, ...payload }); }
    else { createMut.mutate(payload); }
  };

  const banners = data?.banners || [];
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="section-label">Content Management</span>
          <h1 className="font-display text-4xl text-cream">BANNERS</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> New Banner
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 skeleton"/>)}</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <p className="text-muted text-sm font-label uppercase tracking-wider">No banners yet</p>
          <p className="text-muted/50 text-xs mt-1">Create your first banner to show promotions on the homepage</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => (
            <div key={banner._id} className="bg-surface border border-border p-4 sm:p-5 flex items-start sm:items-center gap-4">
              {banner.image?.url && <img src={banner.image.url} alt="" className="w-16 h-10 object-cover flex-shrink-0 hidden sm:block" />}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-label font-semibold text-cream text-sm">{banner.title}</span>
                  <span className={`text-xs font-label uppercase tracking-wider px-2 py-0.5 ${banner.isActive ? 'bg-green-400/10 text-green-400' : 'bg-surface2 text-muted'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 font-label uppercase tracking-wider">{banner.type}</span>
                </div>
                {banner.description && <p className="text-xs text-muted truncate">{banner.description}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-xs text-muted flex items-center gap-1"><LinkIcon size={10}/>{banner.link}</span>
                  {banner.endDate && <span className="text-xs text-muted flex items-center gap-1"><Calendar size={10}/>Ends {new Date(banner.endDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleMut.mutate(banner._id)} className={`p-2 transition-colors ${banner.isActive ? 'text-green-400 hover:text-muted' : 'text-muted hover:text-green-400'}`}>
                  {banner.isActive ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                </button>
                <button onClick={() => setEditing({ ...banner, startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0,16) : '', endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0,16) : '' })} className="p-2 text-muted hover:text-cream"><Edit2 size={16}/></button>
                <button onClick={() => { if(confirm('Delete this banner?')) deleteMut.mutate(banner._id); }} className="p-2 text-muted hover:text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <BannerForm
          initial={editing || EMPTY_FORM}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
