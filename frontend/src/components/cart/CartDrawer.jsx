import { X, ShoppingBag, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const shipping = subtotal > 0 && subtotal >= 599 ? 0 : subtotal > 0 ? 79 : 0;
  const total = subtotal + shipping;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface z-50 flex flex-col animate-slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-accent" />
            <span className="font-label font-semibold tracking-[0.1em] uppercase text-cream">Your Cart</span>
            {items.length > 0 && (
              <span className="bg-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-1.5 text-muted hover:text-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag size={48} className="text-border" />
            <div className="text-center">
              <p className="text-cream font-medium mb-1">Your cart is empty</p>
              <p className="text-sm text-muted">Add some fire pieces to your cart</p>
            </div>
            <button onClick={() => { closeCart(); navigate('/shop'); }} className="btn-primary">
              Shop Now
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => {
                const price = item.product?.discountPrice || item.product?.price || 0;
                return (
                  <div key={item.id} className="flex gap-4 py-4 border-b border-border last:border-0">
                    <Link to={`/product/${item.product?.slug || item.product?._id}`} onClick={closeCart}>
                      <img src={item.product?.images?.[0]?.url} alt={item.product?.name}
                        className="w-20 h-24 object-cover bg-surface2 flex-shrink-0" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product?.slug || item.product?._id}`} onClick={closeCart}>
                        <h4 className="text-sm text-cream font-medium truncate hover:text-accent transition-colors">
                          {item.product?.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-muted mt-0.5 font-label tracking-wider uppercase">
                        {item.color} / {item.size}
                      </p>
                      <p className="text-accent font-semibold mt-1">
                        ₹{(price * item.quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-muted hover:text-cream transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm text-cream">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-muted hover:text-cream transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.id)}
                          className="text-muted hover:text-accent transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="px-6 py-5 border-t border-border bg-surface2 space-y-3">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="text-cream">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-400' : 'text-cream'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Tag size={11} />
                  Add ₹{(599 - subtotal).toLocaleString()} more for free shipping
                </p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-cream">
                <span>Total</span>
                <span className="text-lg">₹{total.toLocaleString()}</span>
              </div>
              <button
                onClick={() => { closeCart(); if (isAuthenticated) navigate('/checkout'); else navigate('/login'); }}
                className="btn-primary w-full justify-center text-sm py-3.5">
                {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
              </button>
              <button onClick={() => { closeCart(); navigate('/shop'); }}
                className="btn-ghost w-full justify-center text-xs py-1">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
