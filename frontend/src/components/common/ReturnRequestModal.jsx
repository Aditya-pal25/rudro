import { useState } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RETURN_REASONS = [
  'Product is damaged','Product is defective','Wrong product received',
  'Wrong size / fit','Product doesn\'t match description',
  'Quality isn\'t as expected','Changed my mind','Ordered by mistake','Other',
];

const EXCHANGE_REASONS = [
  'Wrong size / fit','Wrong color','Product is damaged',
  'Product is defective','Wrong product received','Quality issue','Other',
];

export default function ReturnRequestModal({ order, itemIndex, type, onClose }) {
  const item = order?.items?.[itemIndex];
  const policy = item?.policy || {};
  const qc = useQueryClient();

  const [reason, setReason]           = useState('');
  const [note, setNote]               = useState('');
  const [images, setImages]           = useState([]);
  const [previews, setPreviews]       = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [requestedColor, setReqColor] = useState('');
  const [requestedSize, setReqSize]   = useState('');

  const reasons = type === 'RETURN' ? RETURN_REASONS : EXCHANGE_REASONS;

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/returns', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(`${type === 'RETURN' ? 'Return' : 'Exchange'} request submitted!`);
      qc.invalidateQueries(['my-orders']);
      qc.invalidateQueries(['my-returns']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to submit request'),
  });

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages(prev => [...prev, ...data.images]);
      setPreviews(prev => [...prev, ...data.images.map(i => i.url)]);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!reason) { toast.error('Please select a reason'); return; }
    if (!note.trim()) { toast.error('Please describe your issue'); return; }
    if (type === 'EXCHANGE' && (!requestedColor || !requestedSize)) {
      toast.error('Please select replacement color and size'); return;
    }
    const payload = {
      orderId: order._id,
      itemIndex,
      type,
      reason,
      customerNote: note.trim(),
      images,
      ...(type === 'EXCHANGE' ? { requestedVariant: { color: requestedColor, size: requestedSize } } : {}),
    };
    mutation.mutate(payload);
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-label text-xs text-accent uppercase tracking-widest mb-1">{type === 'RETURN' ? 'Return Request' : 'Exchange Request'}</p>
            <h3 className="font-display text-xl text-cream">{item.name}</h3>
            <p className="text-muted text-xs mt-0.5">{item.color} · {item.size} · Qty {item.quantity}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-cream transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Reason selection */}
          <div>
            <p className="text-sm font-label font-semibold text-cream uppercase tracking-wider mb-3">
              Why are you {type === 'RETURN' ? 'returning' : 'exchanging'} this item?
            </p>
            <div className="space-y-2">
              {reasons.map(r => (
                <label key={r} className={`flex items-center gap-3 p-3 cursor-pointer border transition-colors ${reason === r ? 'border-accent bg-accent/5' : 'border-border hover:border-muted'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${reason === r ? 'border-accent' : 'border-border'}`}>
                    {reason === r && <div className="w-2 h-2 rounded-full bg-accent" />}
                  </div>
                  <span className="text-sm text-cream">{r}</span>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={e => setReason(e.target.value)} className="sr-only" />
                </label>
              ))}
            </div>
          </div>

          {/* Customer note */}
          <div>
            <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-2">Tell us more *</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Describe what happened in detail..."
              rows={3}
              className="w-full bg-surface2 border border-border text-cream text-sm px-4 py-3 outline-none focus:border-accent transition-colors resize-none placeholder:text-muted/50"
            />
          </div>

          {/* Exchange variant selection */}
          {type === 'EXCHANGE' && (
            <div className="p-4 bg-surface2 border border-border space-y-3">
              <p className="text-xs font-label font-semibold text-cream uppercase tracking-wider">Select Replacement</p>
              <div>
                <label className="text-xs text-muted block mb-1">Color</label>
                <input value={requestedColor} onChange={e => setReqColor(e.target.value)}
                  placeholder="e.g. Black, Navy" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {['XS','S','M','L','XL','XXL'].map(s => (
                    <button key={s} onClick={() => setReqSize(s)}
                      className={`px-3 py-1.5 text-xs font-label font-semibold uppercase tracking-wider border transition-colors ${requestedSize === s ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-muted hover:text-cream'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="text-xs font-label font-semibold text-muted uppercase tracking-wider block mb-2">Add Photos (optional)</label>
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">×</button>
                  </div>
                ))}
              </div>
            )}
            {previews.length < 4 && (
              <label className={`flex items-center gap-2 cursor-pointer border border-dashed border-border hover:border-accent transition-colors p-3 text-sm text-muted hover:text-cream ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : `Add Photos (${previews.length}/4)`}
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="sr-only" disabled={uploading} />
              </label>
            )}
          </div>

          {/* Policy info */}
          <div className="p-3 bg-surface2 border border-border/50">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                {type === 'RETURN' ? policy.returnConditions || 'Items must be in original condition with tags attached.' : policy.exchangeConditions || 'Exchanges subject to stock availability.'}
              </p>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={mutation.isPending || uploading}
            className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
            {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Submit {type === 'RETURN' ? 'Return' : 'Exchange'} Request</>}
          </button>
        </div>
      </div>
    </div>
  );
}
