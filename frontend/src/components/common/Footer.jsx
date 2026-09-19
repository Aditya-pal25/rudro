import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1">
          <span className="font-display text-4xl text-cream block mb-4">RUDROHAM</span>
          <p className="text-muted text-sm leading-relaxed mb-6">Premium streetwear for the bold. Every thread tells a story. Every drop is a statement.</p>
          <div className="flex gap-4">
            {[Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 border border-border flex items-center justify-center text-muted hover:text-cream hover:border-accent transition-all duration-200">
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-label text-xs font-semibold tracking-[0.2em] uppercase text-cream mb-5">Shop</h4>
          <ul className="space-y-3">
            {['New Arrivals', 'Best Sellers', 'Oversized', 'Graphic Tees', 'Polo', 'Vintage'].map(item => (
              <li key={item}><Link to={`/shop?category=${item}`} className="text-sm text-muted hover:text-cream transition-colors">{item}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-label text-xs font-semibold tracking-[0.2em] uppercase text-cream mb-5">Help & Policies</h4>
          <ul className="space-y-3">
            <li><Link to="/shipping-policy" className="text-sm text-muted hover:text-cream transition-colors">Shipping & Delivery</Link></li>
            <li><Link to="/refund-policy" className="text-sm text-muted hover:text-cream transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/privacy-policy" className="text-sm text-muted hover:text-cream transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-sm text-muted hover:text-cream transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/orders" className="text-sm text-muted hover:text-cream transition-colors">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label text-xs font-semibold tracking-[0.2em] uppercase text-cream mb-5">Contact</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm text-muted"><MapPin size={15} className="mt-0.5 flex-shrink-0 text-accent" />Rudroham HQ, Bhopal, Madhya Pradesh, India</li>
            <li className="flex items-center gap-3 text-sm text-muted"><Phone size={15} className="text-accent" />+91 98765 43210</li>
            <li className="flex items-center gap-3 text-sm text-muted"><Mail size={15} className="text-accent" />hello@rudroham.com</li>
          </ul>
          <div className="mt-6">
            <p className="text-xs text-muted mb-3 font-label tracking-wider uppercase">Newsletter</p>
            <div className="flex">
              <input type="email" placeholder="your@email.com" className="input-field flex-1 text-xs py-2.5" />
              <button className="bg-accent px-4 text-white text-xs font-label font-semibold tracking-wider uppercase hover:bg-accent-dark transition-colors">Go</button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted">© 2026 Rudroham. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-xs text-muted hover:text-cream transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-muted hover:text-cream transition-colors">Terms & Conditions</Link>
            <Link to="/refund-policy" className="text-xs text-muted hover:text-cream transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
