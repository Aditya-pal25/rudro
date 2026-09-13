import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle, Truck, XCircle, RotateCcw, MapPin } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  placed:           { color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: Clock,        label: 'Order Placed' },
  confirmed:        { color: 'text-blue-500',   bg: 'bg-blue-500/10',   icon: CheckCircle,  label: 'Confirmed' },
  processing:       { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Package,      label: 'Processing' },
  packed:           { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Package,      label: 'Packed' },
  shipped:          { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Truck,        label: 'Shipped' },
  out_for_delivery: { color: 'text-indigo-400', bg: 'bg-indigo-400/10', icon: Truck,        label: 'Out for Delivery' },
  delivered:        { color: 'text-green-400',  bg: 'bg-green-400/10',  icon: CheckCircle,  label: 'Delivered' },
  cancelled:        { color: 'text-red-400',    bg: 'bg-red-400/10',    icon: XCircle,      label: 'Cancelled' },
  return_requested: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: RotateCcw,    label: 'Return Requested' },
  returned:         { color: 'text-gray-400',   bg: 'bg-gray-400/10',   icon: RotateCcw,    label: 'Returned' },
};

export default function OrderHistory() {
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => api.get(`/orders/my?page=${page}&limit=10`).then(r => r.data),
    retry: 1,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.put(`/orders/${orderId}/cancel`, { reason }),
    onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries(['my-orders']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot cancel order'),
  });

  const returnMutation = useMutation({
    mutationFn: ({ orderId, reason }) => api.put(`/orders/${orderId}/return`, { reason }),
    onSuccess: () => { toast.success('Return request submitted'); qc.invalidateQueries(['my-orders']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot request return'),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-center px-4">
      <div>
        <p className="text-muted mb-4">Failed to load orders. Please try again.</p>
        <button onClick={() => qc.invalidateQueries(['my-orders'])} className="btn-primary text-sm">Retry</button>
      </div>
    </div>
  );

  const orders = data?.orders || [];

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-4xl mx-auto px-4">
        <span className="section-label">Account</span>
        <h1 className="font-display text-5xl text-cream mb-2">MY ORDERS</h1>
        <p className="text-muted text-sm mb-10">{data?.total || 0} orders total</p>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-border">
            <Package size={48} className="text-border mx-auto mb-4" />
            <p className="text-cream font-medium mb-2">No orders yet</p>
            <p className="text-muted text-sm mb-6">Your orders will appear here once you place them</p>
            <Link to="/shop" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const statusInfo = STATUS_STYLE[order.status] || STATUS_STYLE.placed;
              const StatusIcon = statusInfo.icon;
              const isExp = expanded === order._id;

              return (
                <div key={order._id} className="bg-surface border border-border overflow-hidden">
                  {/* Order Header Row */}
                  <div
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface2 transition-colors"
                    onClick={() => setExpanded(isExp ? null : order._id)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Thumbnail of first item */}
                      {order.items?.[0]?.image && (
                        <img src={order.items[0].image} alt=""
                          className="w-12 h-14 object-cover bg-surface2 flex-shrink-0 hidden sm:block" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-accent font-mono text-sm font-semibold">{order.orderId}</p>
                          <span className={`badge flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon size={10} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-muted text-xs mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                          {' · '}{order.payment?.method?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-cream font-semibold">₹{order.pricing?.total?.toLocaleString()}</p>
                        <p className="text-muted text-xs">{order.payment?.status}</p>
                      </div>
                      {isExp ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExp && (
                    <div className="border-t border-border">
                      {/* Items */}
                      <div className="p-5 space-y-4">
                        <p className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted mb-3">Items Ordered</p>
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <img src={item.image} alt="" className="w-16 h-20 object-cover bg-surface2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-cream text-sm font-medium">{item.name}</p>
                              <p className="text-muted text-xs mt-0.5">
                                Color: {item.color} &nbsp;|&nbsp; Size: {item.size} &nbsp;|&nbsp; Qty: {item.quantity}
                              </p>
                              <p className="text-accent text-sm font-semibold mt-1">
                                ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pricing + Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-border">
                        <div className="p-5 border-b sm:border-b-0 sm:border-r border-border">
                          <p className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted mb-3">
                            <MapPin size={11} className="inline mr-1" />Delivery Address
                          </p>
                          <p className="text-cream text-sm font-medium">{order.shippingAddress?.fullName}</p>
                          <p className="text-muted text-xs leading-relaxed mt-1">
                            {order.shippingAddress?.addressLine1}<br />
                            {order.shippingAddress?.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}<br />
                            📞 {order.shippingAddress?.phone}
                          </p>
                        </div>
                        <div className="p-5">
                          <p className="text-xs font-label font-semibold tracking-[0.15em] uppercase text-muted mb-3">Price Breakdown</p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted"><span>Subtotal</span><span>₹{order.pricing?.subtotal?.toLocaleString()}</span></div>
                            {order.pricing?.couponDiscount > 0 && <div className="flex justify-between text-green-400"><span>Coupon</span><span>−₹{order.pricing.couponDiscount.toLocaleString()}</span></div>}
                            <div className="flex justify-between text-muted"><span>Shipping</span><span>{order.pricing?.shippingCharge === 0 ? 'FREE' : `₹${order.pricing?.shippingCharge}`}</span></div>
                            <div className="flex justify-between text-muted"><span>Tax</span><span>₹{order.pricing?.tax?.toLocaleString()}</span></div>
                            <div className="flex justify-between text-cream font-semibold border-t border-border pt-2 mt-1">
                              <span>Total</span><span>₹{order.pricing?.total?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-5 pb-5 pt-3 flex flex-wrap gap-3 border-t border-border">
                        {['placed', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for cancellation?');
                              if (reason) cancelMutation.mutate({ orderId: order._id, reason });
                            }}
                            className="btn-ghost text-xs text-red-400 hover:text-red-300"
                          >
                            <XCircle size={13} /> Cancel Order
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for return?');
                              if (reason) returnMutation.mutate({ orderId: order._id, reason });
                            }}
                            className="btn-ghost text-xs"
                          >
                            <RotateCcw size={13} /> Request Return
                          </button>
                        )}
                        {order.tracking?.trackingNumber && (
                          <a href={order.tracking?.trackingUrl || '#'} target="_blank" rel="noreferrer"
                            className="btn-ghost text-xs text-accent">
                            <Truck size={13} /> Track: {order.tracking.trackingNumber}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(data.pages)].map((_, i) => (
              <button key={i} onClick={() => { setPage(i + 1); window.scrollTo(0, 0); }}
                className={`w-9 h-9 text-xs font-label font-semibold border transition-colors ${page === i + 1 ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:text-cream'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
