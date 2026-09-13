import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      loadUser: async () => {
        const { token } = get();

        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return;
        }

        try {
          const { data } = await api.get('/auth/me');

          // Admin API returns data.admin
          if (data.admin?.role !== 'admin') {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
            return;
          }

          set({
            user: data.admin,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('ADMIN SESSION ERROR:', error);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      setAuth: (user, token) => {
        if (user?.role !== 'admin' || !token) {
          console.error('Invalid admin authentication response');
          return;
        }

        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (u) =>
        set((state) => ({
          user: {
            ...state.user,
            ...u,
          },
        })),
    }),

    {
      name: 'rudroham-admin-auth',

      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);