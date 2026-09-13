import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Tag, Loader2, CreditCard, Banknote, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 599 ? 0 : 79;
  const tax = Math.round((subtotal - couponDiscount) * 0.18);
  const total = subtotal - couponDiscount + shipping + tax;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user?.addresses?.find(a => a.isDefault) || {},
  });

  // Check Razorpay SDK loaded
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayReady(true);
    } else {
      // Try loading dynamically as fallback
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayReady(true);
      script.onerror = () => setRazorpayReady(false);
      document.head.appendChild(script);
    }
  }, []);

  if (items.length === 0) {
    navigate('/shop');
    return null;
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, amount: subtotal });
      setCouponDiscount(data.coupon.discount);
      setAppliedCoupon(data.coupon.code);
      toast.success(`Coupon applied! ₹${data.coupon.discount} off 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => {
    setCouponDiscount(0); setAppliedCoupon(''); setCouponCode('');
    toast.success('Coupon removed');
  };

  const onAddressSubmit = (data) => {
    setAddress(data); setStep(2); window.scrollTo(0, 0);
  };

  // ─── Create order on backend ────────────────────────────────────────────────
  const createOrder = async () => {
    const { data } = await api.post('/orders', {
      items: items.map(i => ({
        product: i.product._id,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
      })),
      shippingAddress: address,
      payment: { method: paymentMethod },
      couponCode: appliedCoupon || undefined,
    });
    return data.order;
  };

  // ─── COD flow ────────────────────────────────────────────────────────────────
  const placeCOD = async () => {
    setLoading(true);
    try {
      const order = await createOrder();
      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/order-success/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ─── Razorpay flow ───────────────────────────────────────────────────────────
  const placeRazorpay = async () => {
    if (!razorpayReady) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }
    setLoading(true);
    let order = null;
    try {
      // Step 1: Create order in DB
      order = await createOrder();

      // Step 2: Create Razorpay order
      const { data: rpData } = await api.post('/payment/razorpay/create', { amount: total });

      setLoading(false); // Stop spinner — Razorpay modal takes over

      // Step 3: Open Razorpay checkout
      const options = {
        key: rpData.key,
        amount: rpData.order.amount,
        currency: 'INR',
        name: 'RUDROHAM',
        description: 'Premium T-Shirts',
        image: '/favicon.svg',
        order_id: rpData.order.id,
        // ✅ Success handler
        handler: async function (response) {
          try {
            // Verify payment signature on backend
            await api.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Update order status to confirmed + paid
            await api.put(`/orders/${order._id}/status`, {
              status: 'confirmed',
              note: `Payment successful. Razorpay ID: ${response.razorpay_payment_id}`,
            });
            clearCart();
            toast.success('Payment successful! 🎉');
            navigate(`/order-success/${order._id}`);
          } catch (verifyErr) {
            toast.error('Payment verification failed. Contact support with your order ID: ' + order.orderId);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: address?.phone || '',
        },
        notes: {
          order_id: order._id,
          address: `${address?.city}, ${address?.state}`,
        },
        theme: { color: '#E8351A' },
        modal: {
          // ✅ Handle modal dismiss / payment failure
          ondismiss: async function () {
            toast.error('Payment cancelled. Your order has been saved — complete payment from My Orders.');
            // Don't clear cart, navigate to orders so user can see pending order
            navigate('/orders');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure
      rzp.on('payment.failed', async function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        // Mark order payment as failed
        try {
          await api.put(`/orders/${order._id}/status`, {
            status: 'placed',
            note: `Payment failed: ${response.error.description}`,
          });
        } catch {}
        navigate('/orders');
      });

      rzp.open();

    } catch (err) {
      setLoading(false);
      // If order was created but Razorpay init failed, still tell user
      if (order) {
        toast.error('Payment gateway error. Your order is saved. Try again from My Orders.');
        clearCart();
        navigate(`/orders`);
      } else {
        toast.error(err.response?.data?.message || 'Order failed. Please try again.');
      }
    }
  };

  const placeOrder = () => {
    if (paymentMethod === 'cod') placeCOD();
    else placeRazorpay();
  };

  return (
    <div className="min-h-screen bg-black py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <h1 className="font-display text-4xl text-cream">CHECKOUT</h1>
          <div className="flex items-center gap-2">
            {[{ n: 1, label: 'Address' }, { n: 2, label: 'Payment' }].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-label font-semibold tracking-wider uppercase transition-colors ${step >= n ? 'bg-accent border-accent text-white' : 'border-border text-muted'}`}>
                  {step > n ? <Check size={12} /> : n} {label}
                </div>
                {n < 2 && <ChevronRight size={14} className="text-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Main */}
          <div className="lg:col-span-3">
            {/* Step 1 — Address */}
            {step === 1 && (
              <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-5">
                <h2 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm mb-6">Shipping Address</h2>
                {user?.addresses?.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <p className="text-xs text-muted font-label uppercase tracking-wider mb-3">Saved Addresses</p>
                    {user.addresses.map((addr, i) => (
                      <label key={i} className="flex items-start gap-3 p-4 border border-border hover:border-accent cursor-pointer transition-colors">
                        <input type="radio" name="savedAddr" className="mt-1 accent-accent" />
                        <div className="text-sm text-muted">
                          <p className="text-cream font-medium">{addr.fullName}</p>
                          <p>{addr.addressLine1}, {addr.city}, {addr.state} — {addr.pincode}</p>
                          <p>{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                    <p className="text-xs text-muted mt-2">Or fill a new address below:</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <input {...register('fullName', { required: 'Required' })} className="input-field" placeholder="Your full name" />
                    {errors.fullName && <p className="text-accent text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Phone *</label>
                    <input {...register('phone', { required: 'Required' })} className="input-field" placeholder="10-digit number" />
                    {errors.phone && <p className="text-accent text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Address Line 1 *</label>
                  <input {...register('addressLine1', { required: 'Required' })} className="input-field" placeholder="House/Flat no, Building, Street" />
                  {errors.addressLine1 && <p className="text-accent text-xs mt-1">{errors.addressLine1.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Address Line 2</label>
                  <input {...register('addressLine2')} className="input-field" placeholder="Area, Colony, Landmark (optional)" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">City *</label>
                    <input {...register('city', { required: 'Required' })} className="input-field" placeholder="Bhopal" />
                    {errors.city && <p className="text-accent text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">State *</label>
                    <input {...register('state', { required: 'Required' })} className="input-field" placeholder="MP" />
                    {errors.state && <p className="text-accent text-xs mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-label text-muted uppercase tracking-wider mb-1.5 block">Pincode *</label>
                    <input {...register('pincode', { required: 'Required' })} className="input-field" placeholder="462001" />
                    {errors.pincode && <p className="text-accent text-xs mt-1">{errors.pincode.message}</p>}
                  </div>
                </div>
                <button type="submit" className="btn-primary mt-4">
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* Step 2 — Payment */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm mb-6">Payment Method</h2>

                {/* Address summary */}
                <div className="p-4 border border-border bg-surface2 mb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-label text-muted uppercase tracking-wider mb-1">Delivering to</p>
                      <p className="text-cream text-sm font-medium">{address?.fullName}</p>
                      <p className="text-muted text-xs">{address?.addressLine1}, {address?.city}, {address?.state} — {address?.pincode}</p>
                      <p className="text-muted text-xs">{address?.phone}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs text-accent hover:underline">Change</button>
                  </div>
                </div>

                {/* Payment options */}
                {[
                  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when your order arrives at your door' },
                  { id: 'razorpay', label: 'Pay Online (Razorpay)', icon: CreditCard, desc: 'UPI, Cards, Net Banking, Wallets — 100% secure' },
                ].map(({ id, label, icon: Icon, desc }) => (
                  <label key={id} className={`flex items-center gap-4 p-5 border cursor-pointer transition-colors ${paymentMethod === id ? 'border-accent bg-accent/5' : 'border-border hover:border-muted'}`}>
                    <input type="radio" checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="accent-accent" />
                    <Icon size={20} className={paymentMethod === id ? 'text-accent' : 'text-muted'} />
                    <div className="flex-1">
                      <p className="text-cream font-medium text-sm">{label}</p>
                      <p className="text-muted text-xs">{desc}</p>
                    </div>
                    {paymentMethod === id && <Check size={16} className="text-accent flex-shrink-0" />}
                  </label>
                ))}

                {/* Razorpay not loaded warning */}
                {paymentMethod === 'razorpay' && !razorpayReady && (
                  <div className="flex items-center gap-2 p-3 border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-xs">
                    <AlertCircle size={14} /> Payment gateway is loading... Please wait or refresh the page.
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                  <button
                    onClick={placeOrder}
                    disabled={loading || (paymentMethod === 'razorpay' && !razorpayReady)}
                    className="btn-primary flex-1 justify-center"
                  >
                    {loading
                      ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      : `Place Order • ₹${total.toLocaleString()}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border p-6 sticky top-24">
              <h3 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm mb-5">Order Summary</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto mb-5 pr-1">
                {items.map(item => {
                  const price = item.product?.discountPrice || item.product?.price || 0;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.product?.images?.[0]?.url} alt="" className="w-14 h-16 object-cover bg-surface2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-cream text-xs font-medium truncate">{item.product?.name}</p>
                        <p className="text-muted text-xs mt-0.5">{item.color} / {item.size} × {item.quantity}</p>
                        <p className="text-accent text-xs font-semibold mt-1">₹{(price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              {!appliedCoupon ? (
                <div className="flex gap-2 mb-5">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code" className="input-field pl-9 text-xs py-2.5"
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
                  </div>
                  <button onClick={applyCoupon} disabled={couponLoading} className="btn-outline text-xs py-2.5 px-4">
                    {couponLoading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-5 p-3 bg-green-400/10 border border-green-400/30">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-400" />
                    <span className="text-green-400 text-xs font-label font-semibold tracking-wider">{appliedCoupon}</span>
                    <span className="text-green-400 text-xs">— ₹{couponDiscount} off</span>
                  </div>
                  <button onClick={removeCoupon} className="text-muted hover:text-accent text-xs">✕</button>
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2.5 text-sm border-t border-border pt-4">
                <div className="flex justify-between text-muted">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="text-cream">₹{subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span><span>−₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-400' : 'text-cream'}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>GST (18%)</span><span className="text-cream">₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-cream text-base border-t border-border pt-3 mt-1">
                  <span>Total Payable</span>
                  <span className="text-accent text-lg">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="mt-3 text-xs text-muted">
                  🚚 Add ₹{(599 - subtotal).toLocaleString()} more for free shipping
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
