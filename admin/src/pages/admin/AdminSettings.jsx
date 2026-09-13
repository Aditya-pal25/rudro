import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, RotateCcw, Loader2, Save, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const [form, setForm] = useState(null);
  useEffect(() => { if (data?.settings) setForm({ ...data.settings }); }, [data]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMut = useMutation({
    mutationFn: (payload) => api.put('/settings', payload).then(r => r.data),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries(['admin-settings']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  if (isLoading || !form) return <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-24 skeleton"/>)}</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <span className="section-label">Store Configuration</span>
        <h1 className="font-display text-4xl text-cream">SETTINGS</h1>
      </div>

      {/* WhatsApp Support */}
      <div className="border border-border p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-[#25D366]/10 flex items-center justify-center">
            <MessageCircle size={16} className="text-[#25D366]"/>
          </div>
          <h2 className="font-label font-semibold text-cream uppercase tracking-wider">WhatsApp Support</h2>
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <div onClick={()=>set('whatsappEnabled',!form.whatsappEnabled)} className={`w-10 h-5 rounded-full transition-colors relative ${form.whatsappEnabled ? 'bg-[#25D366]' : 'bg-surface2 border border-border'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.whatsappEnabled ? 'left-5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-cream">{form.whatsappEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        <div>
          <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">WhatsApp Number (with country code)</label>
          <input value={form.whatsappNumber} onChange={e=>set('whatsappNumber',e.target.value)} placeholder="919876543210" className="input-field" disabled={!form.whatsappEnabled}/>
          <p className="text-xs text-muted mt-1">Include country code, no + or spaces. e.g. 919876543210 for India.</p>
        </div>
        <div>
          <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Default Message</label>
          <input value={form.whatsappMessage} onChange={e=>set('whatsappMessage',e.target.value)} className="input-field" disabled={!form.whatsappEnabled}/>
        </div>
      </div>

      {/* Return Policy */}
      <div className="border border-border p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-accent/10 flex items-center justify-center">
            <RotateCcw size={16} className="text-accent"/>
          </div>
          <h2 className="font-label font-semibold text-cream uppercase tracking-wider">Return Policy</h2>
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <div onClick={()=>set('returnEnabled',!form.returnEnabled)} className={`w-10 h-5 rounded-full transition-colors relative ${form.returnEnabled ? 'bg-accent' : 'bg-surface2 border border-border'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.returnEnabled ? 'left-5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-cream">{form.returnEnabled ? 'Returns Enabled' : 'Returns Disabled'}</span>
          </label>
        </div>
        <div>
          <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Default Return Window (days)</label>
          <input type="number" min={0} max={365} value={form.returnWindowDays} onChange={e=>set('returnWindowDays',Number(e.target.value))} className="input-field w-32"/>
        </div>
        <div>
          <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Return Policy Text</label>
          <textarea value={form.returnPolicy} onChange={e=>set('returnPolicy',e.target.value)} rows={3} className="input-field resize-none text-sm"/>
        </div>
      </div>

      {/* Exchange Policy */}
      <div className="border border-border p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-accent/10 flex items-center justify-center">
            <RotateCcw size={16} className="text-accent"/>
          </div>
          <h2 className="font-label font-semibold text-cream uppercase tracking-wider">Exchange Policy</h2>
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <div onClick={()=>set('exchangeEnabled',!form.exchangeEnabled)} className={`w-10 h-5 rounded-full transition-colors relative ${form.exchangeEnabled ? 'bg-accent' : 'bg-surface2 border border-border'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.exchangeEnabled ? 'left-5' : 'left-0.5'}`}/>
            </div>
            <span className="text-sm text-cream">{form.exchangeEnabled ? 'Exchanges Enabled' : 'Exchanges Disabled'}</span>
          </label>
        </div>
        <div>
          <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Default Exchange Window (days)</label>
          <input type="number" min={0} max={365} value={form.exchangeWindowDays} onChange={e=>set('exchangeWindowDays',Number(e.target.value))} className="input-field w-32"/>
        </div>
        <div>
          <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-1.5">Exchange Policy Text</label>
          <textarea value={form.exchangePolicy} onChange={e=>set('exchangePolicy',e.target.value)} rows={3} className="input-field resize-none text-sm"/>
        </div>
      </div>

      <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="btn-primary py-3 px-8">
        {saveMut.isPending ? <><Loader2 size={16} className="animate-spin"/>Saving...</> : <><Save size={16}/>Save Settings</>}
      </button>
    </div>
  );
}
