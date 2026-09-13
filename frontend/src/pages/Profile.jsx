import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, MapPin, Lock, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'password', label: 'Password', icon: Lock },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const { user, updateUser } = useAuthStore();

  const { register: regProfile, handleSubmit: hsProfile } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const { register: regPass, handleSubmit: hsPass, reset: resetPass, watch } = useForm();
  const { register: regAddr, handleSubmit: hsAddr, reset: resetAddr } = useForm();

  const updateProfile = async (data) => {
    setLoading(true);
    try { const res = await api.put('/auth/profile', data); updateUser(res.data.user); toast.success('Profile updated!'); } catch (e) { toast.error('Failed'); } finally { setLoading(false); }
  };
  const changePassword = async (data) => {
    if (data.newPassword !== data.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try { await api.put('/auth/password', data); resetPass(); toast.success('Password changed!'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };
  const addAddress = async (data) => {
    setLoading(true);
    try { const res = await api.post('/auth/address', data); updateUser({ addresses: res.data.addresses }); resetAddr(); setAddingAddr(false); toast.success('Address saved!'); } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  const deleteAddress = async (id) => {
    try { const res = await api.delete(`/auth/address/${id}`); updateUser({ addresses: res.data.addresses }); toast.success('Address removed'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-accent flex items-center justify-center text-white font-display text-2xl">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 className="font-display text-4xl text-cream">{user?.name?.toUpperCase()}</h1>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-label font-semibold tracking-wider uppercase transition-colors ${activeTab === key ? 'bg-accent text-white' : 'text-muted hover:text-cream hover:bg-surface2'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <div className="md:col-span-3 bg-surface border border-border p-8">
            {activeTab === 'profile' && (
              <form onSubmit={hsProfile(updateProfile)} className="space-y-5">
                <h2 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm mb-6">Personal Info</h2>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-2 block">Full Name</label>
                  <input {...regProfile('name', { required: true })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-2 block">Email</label>
                  <input value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-2 block">Phone</label>
                  <input {...regProfile('phone')} className="input-field" placeholder="+91 XXXXX XXXXX" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">Save Changes</button>
              </form>
            )}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm">My Addresses</h2>
                  <button onClick={() => setAddingAddr(!addingAddr)} className="btn-outline text-xs py-2 px-4"><Plus size={13} /> Add New</button>
                </div>
                {addingAddr && (
                  <form onSubmit={hsAddr(addAddress)} className="mb-8 p-5 border border-accent/30 bg-accent/5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs text-muted uppercase tracking-wider mb-1.5 block font-label">Full Name</label><input {...regAddr('fullName', {required:true})} className="input-field" /></div>
                      <div><label className="text-xs text-muted uppercase tracking-wider mb-1.5 block font-label">Phone</label><input {...regAddr('phone', {required:true})} className="input-field" /></div>
                    </div>
                    <div><label className="text-xs text-muted uppercase tracking-wider mb-1.5 block font-label">Address</label><input {...regAddr('addressLine1', {required:true})} className="input-field" /></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><input {...regAddr('city', {required:true})} placeholder="City" className="input-field" /></div>
                      <div><input {...regAddr('state', {required:true})} placeholder="State" className="input-field" /></div>
                      <div><input {...regAddr('pincode', {required:true})} placeholder="Pincode" className="input-field" /></div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={loading} className="btn-primary text-xs py-2.5 px-5">Save</button>
                      <button type="button" onClick={() => setAddingAddr(false)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </form>
                )}
                <div className="space-y-3">
                  {user?.addresses?.map((addr) => (
                    <div key={addr._id} className="p-4 border border-border flex items-start justify-between gap-4">
                      <div className="text-sm">
                        <p className="text-cream font-medium flex items-center gap-2">{addr.fullName} {addr.isDefault && <span className="badge bg-accent/10 text-accent text-[10px]">Default</span>}</p>
                        <p className="text-muted mt-1">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-muted">{addr.phone}</p>
                      </div>
                      <button onClick={() => deleteAddress(addr._id)} className="text-muted hover:text-accent transition-colors flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {(!user?.addresses || user.addresses.length === 0) && <p className="text-muted text-sm">No addresses saved yet.</p>}
                </div>
              </div>
            )}
            {activeTab === 'password' && (
              <form onSubmit={hsPass(changePassword)} className="space-y-5">
                <h2 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm mb-6">Change Password</h2>
                {[
                  { key: 'currentPassword', label: 'Current Password' },
                  { key: 'newPassword', label: 'New Password' },
                  { key: 'confirm', label: 'Confirm New Password' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-label text-muted uppercase tracking-wider mb-2 block">{label}</label>
                    <input type="password" {...regPass(key, { required: true })} className="input-field" />
                  </div>
                ))}
                <button type="submit" disabled={loading} className="btn-primary">Update Password</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}