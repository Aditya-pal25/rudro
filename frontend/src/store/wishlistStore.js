import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

export const useWishlistStore = create(persist(
  (set, get) => ({
    items: [],
    toggle: async (productId) => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) { toast.error('Please login to use wishlist'); return; }
      try {
        const { data } = await api.put(`/auth/wishlist/${productId}`);
        const { data: wData } = await api.get('/users/wishlist');
        set({ items: wData.wishlist || [] });
        toast.success(data.action === 'added' ? 'Added to wishlist ❤️' : 'Removed from wishlist');
      } catch { toast.error('Failed to update wishlist'); }
    },
    isWishlisted: (productId) => get().items.some(item => (item?._id || item)?.toString() === productId?.toString()),
    fetchWishlist: async () => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;
      try { const { data } = await api.get('/users/wishlist'); set({ items: data.wishlist || [] }); } catch {}
    },
    clear: () => set({ items: [] }),
  }),
  { name: 'rudroham-wishlist', partialize: s => ({ items: s.items }) }
));
