import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export const useCartStore = create(persist(
  (set, get) => ({
    items: [], isOpen: false,
    addItem: (product, color, size, quantity = 1) => {
      const key = `${product._id}-${color}-${size}`;
      const items = get().items;
      const existing = items.find(i => i.id === key);
      if (existing) set({ items: items.map(i => i.id === key ? { ...i, quantity: i.quantity + quantity } : i) });
      else set({ items: [...items, { id: key, product, color, size, quantity }] });
      set({ isOpen: true });
      toast.success(`${product.name} added to cart!`);
    },
    removeItem: (key) => set(s => ({ items: s.items.filter(i => i.id !== key) })),
    updateQuantity: (key, qty) => {
      if (qty < 1) { get().removeItem(key); return; }
      set(s => ({ items: s.items.map(i => i.id === key ? { ...i, quantity: qty } : i) }));
    },
    clearCart: () => set({ items: [] }),
    openCart: () => set({ isOpen: true }),
    closeCart: () => set({ isOpen: false }),
    getSubtotal: () => get().items.reduce((sum, i) => sum + (i.product?.discountPrice || i.product?.price || 0) * i.quantity, 0),
    getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  }),
  { name: 'rudroham-cart', partialize: s => ({ items: s.items }) }
));
