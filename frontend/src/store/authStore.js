import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(persist(
  (set, get) => ({
    user: null, token: null, loading: false, isAuthenticated: false,
    loadUser: async () => {
      const { token } = get();
      if (!token) return;
      try {
        const { data } = await api.get('/auth/me');
        set({ user: data.user, isAuthenticated: true });
      } catch { set({ user: null, token: null, isAuthenticated: false }); }
    },
    setAuth: (user, token) => set({ user, token, isAuthenticated: true, loading: false }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
    updateUser: (u) => set(s => ({ user: { ...s.user, ...u } })),
  }),
  {
    name: 'rudroham-auth',
    partialize: s => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
  }
));
