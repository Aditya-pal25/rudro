import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, MapPin, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function OrderSuccess() {
  const { orderId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then(r => r.data),
    retry: 2,
  });

  const order = data?.order;

  return (
    <div className="min-h-screen bg-black py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h1 className="font-display text-6xl text-cream mb-3">ORDER PLACED!</h1>
          <p className="text-muted mb-2">Thank you for shopping with Rudroham 🔥</p>
          {order && (
            <p className="font-label font-semibold tracking-[0.15em] text-accent uppercase">
              Order ID: {order.orderId}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : order ? (
          <div className="bg-surface border border-border space-y-0">
            {/* Items */}
            <div className="p-6 border-b border-border">
              <p className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted mb-4">
                Items Ordered
              </p>
              <div className="space-y-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-14 h-16 object-cover bg-surface2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-cream text-sm font-medium">{item.name}</p>
                      <p className="text-muted text-xs mt-0.5">
                        {item.color} / {item.size} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-accent text-sm font-semibold">
                      ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="p-6 border-b border-border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>₹{order.pricing?.subtotal?.toLocaleString()}</span>
                </div>
                {order.pricing?.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span>
                    <span>−₹{order.pricing.couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className={order.pricing?.shippingCharge === 0 ? 'text-green-400' : ''}>
                    {order.pricing?.shippingCharge === 0 ? 'FREE' : `₹${order.pricing?.shippingCharge}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tax (GST)</span>
                  <span>₹{order.pricing?.tax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-cream font-semibold text-base border-t border-border pt-3 mt-1">
                  <span>Total Paid</span>
                  <span className="text-accent text-lg">₹{order.pricing?.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Address + Payment */}
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="p-6">
                <p className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted mb-3 flex items-center gap-1.5">
                  <MapPin size={11} /> Deliver to
                </p>
                <p className="text-cream text-sm font-medium">{order.shippingAddress?.fullName}</p>
                <p className="text-muted text-xs leading-relaxed mt-1">
                  {order.shippingAddress?.addressLine1},<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                  {order.shippingAddress?.pincode}
                </p>
              </div>
              <div className="p-6">
                <p className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted mb-3 flex items-center gap-1.5">
                  <CreditCard size={11} /> Payment
                </p>
                <p className="text-cream text-sm font-medium capitalize">{order.payment?.method}</p>
                <p className={`text-xs mt-1 capitalize ${order.payment?.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {order.payment?.status}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Link to="/orders" className="btn-primary">
            <Package size={16} /> Track My Orders
          </Link>
          <Link to="/shop" className="btn-outline">
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
