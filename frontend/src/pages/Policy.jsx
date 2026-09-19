import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, FileText, Truck, RotateCcw, Mail, MapPin, Phone } from 'lucide-react';

const TABS = [
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  { id: 'shipping', label: 'Shipping Policy', icon: Truck },
  { id: 'refund', label: 'Returns & Refunds', icon: RotateCcw },
];

export default function Policy({ initialTab = 'privacy' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || initialTab);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  return (
    <div className="min-h-screen bg-black text-cream pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="section-label">Legal & Compliance</span>
          <h1 className="font-display text-5xl sm:text-6xl text-cream tracking-wider mt-2 mb-4">
            POLICIES & TERMS
          </h1>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Everything you need to know about our customer commitments, data security, shipping, and return policies.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-4 mb-10 justify-center">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-label uppercase tracking-wider transition-all duration-200 ${
                activeTab === id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface border border-border text-muted hover:text-cream hover:border-muted'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Policy Content Card */}
        <div className="bg-surface border border-border p-6 sm:p-10 space-y-8 leading-relaxed text-sm text-muted">
          {/* ── PRIVACY POLICY ── */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="font-display text-3xl text-cream">PRIVACY POLICY</h2>
                <p className="text-xs text-muted mt-1">Last updated: September 2026</p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">1. Information We Collect</h3>
                <p>
                  When you visit Rudroham, place an order, or create an account, we collect personal information including your full name, email address, phone number, shipping address, and payment transaction metadata. We do not store your raw credit card or debit card numbers on our servers.
                </p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">2. How We Use Your Data</h3>
                <p>Your information is used strictly to:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Process and fulfill your T-shirt orders and arrange doorstep delivery.</li>
                  <li>Send real-time SMS and email notifications regarding order tracking, OTPs, and updates.</li>
                  <li>Prevent fraudulent transactions and secure account logins.</li>
                  <li>Provide customer support and resolve order inquiries.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">3. Payment Security</h3>
                <p>
                  All online payments are securely processed through <strong>Razorpay</strong>, an RBI-authorized payment gateway utilizing industry-standard 256-bit SSL encryption and PCI-DSS compliance. Your sensitive card and UPI credentials never touch or reside on our servers.
                </p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">4. Third-Party Sharing</h3>
                <p>
                  We never sell, rent, or trade your personal data. We only share delivery details with verified courier partners (e.g. Delhivery, Bluedart) solely to deliver your orders.
                </p>
              </div>
            </div>
          )}

          {/* ── TERMS & CONDITIONS ── */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="font-display text-3xl text-cream">TERMS & CONDITIONS</h2>
                <p className="text-xs text-muted mt-1">Last updated: September 2026</p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">1. Introduction & Acceptance</h3>
                <p>
                  Welcome to Rudroham. By accessing or making a purchase on our website, you agree to comply with and be bound by these Terms and Conditions. If you disagree with any part, please refrain from using our services.
                </p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">2. Products & Pricing</h3>
                <p>
                  All prices listed on our website are in <strong>Indian Rupees (INR / ₹)</strong> and inclusive of applicable taxes unless specified otherwise. We reserve the right to revise prices, discontinue designs, or rectify typographical pricing errors without prior notice.
                </p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">3. Orders & Payment</h3>
                <p>
                  Orders placed online via Razorpay (UPI, Cards, Netbanking) or Cash on Delivery (COD) are subject to acceptance and stock availability. We reserve the right to cancel orders with unserviceable delivery pincodes or suspected fraudulent activity.
                </p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">4. Intellectual Property</h3>
                <p>
                  All designs, graphics, streetwear artwork, logos, and website assets are the exclusive intellectual property of Rudroham. Unauthorized reproduction, resale, or imitation is strictly prohibited under Indian copyright laws.
                </p>
              </div>
            </div>
          )}

          {/* ── SHIPPING POLICY ── */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="font-display text-3xl text-cream">SHIPPING & DELIVERY POLICY</h2>
                <p className="text-xs text-muted mt-1">Fast & Reliable Pan-India Delivery</p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">1. Shipping Charges</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Free Shipping</strong>: On all prepaid orders above <strong>₹599</strong>.</li>
                  <li><strong>Standard Shipping</strong>: Flat <strong>₹79</strong> shipping charge for orders below ₹599.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">2. Delivery Timelines</h3>
                <p>
                  Orders are processed and dispatched within <strong>24–48 business hours</strong> from our central warehouse. Typical delivery timeframes across India are:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Metro Cities</strong>: 2 to 4 business days.</li>
                  <li><strong>Tier 2 & Tier 3 Cities</strong>: 4 to 7 business days.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">3. Order Tracking</h3>
                <p>
                  Once dispatched, you will receive an automated SMS and email containing your AWB tracking number and a live tracking link to monitor your delivery in real-time.
                </p>
              </div>
            </div>
          )}

          {/* ── RETURN & REFUND POLICY ── */}
          {activeTab === 'refund' && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="font-display text-3xl text-cream">CANCELLATION & REFUND POLICY</h2>
                <p className="text-xs text-muted mt-1">Hassle-Free 7-Day Return Guarantee</p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">1. 7-Day Return Window</h3>
                <p>
                  We offer a <strong>7-day return and exchange window</strong> from the date of delivery. If you are not completely satisfied with your fit or product quality, you can submit a return request directly from your <em>My Orders</em> dashboard.
                </p>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">2. Conditions for Return</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Items must be unworn, unwashed, and in original condition with brand tags attached.</li>
                  <li>Items must be packed in the original packaging for reverse courier pickup.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-cream font-label uppercase font-semibold text-sm mb-2">3. Refund Processing</h3>
                <p>
                  Once our warehouse receives and inspects the returned item, your refund is processed immediately:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Prepaid Orders (Razorpay)</strong>: Refund credited back to your original payment method (Bank / UPI) within <strong>5 to 7 business days</strong>.</li>
                  <li><strong>Cash on Delivery (COD) Orders</strong>: Refund credited via Bank Account Transfer (NEFT/UPI) provided during return initiation.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Support Contacts */}
          <div className="border-t border-border pt-6 mt-8">
            <h4 className="font-label uppercase font-semibold text-cream text-xs tracking-wider mb-4">
              Need assistance? Contact Support
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2 text-muted">
                <Mail size={14} className="text-accent" />
                <span>hello@rudroham.com</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Phone size={14} className="text-accent" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <MapPin size={14} className="text-accent" />
                <span>Bhopal, Madhya Pradesh, India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
