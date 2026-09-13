import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, RotateCcw, Truck, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('featured');

  const { data: featuredData } = useQuery({ queryKey: ['featured'], queryFn: () => api.get('/products/featured').then(r => r.data), staleTime: 5 * 60 * 1000 });
  const { data: bestData }     = useQuery({ queryKey: ['bestsellers'], queryFn: () => api.get('/products/best-sellers').then(r => r.data), staleTime: 5 * 60 * 1000 });
  const { data: newData }      = useQuery({ queryKey: ['new-arrivals'], queryFn: () => api.get('/products/new-arrivals').then(r => r.data), staleTime: 5 * 60 * 1000 });

  const tabMap = { featured: featuredData?.products, bestsellers: bestData?.products, new: newData?.products };
  const currentProducts = tabMap[activeTab] || [];

  const categories = [
    { name: 'Oversized', image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600', count: '24+ styles' },
    { name: 'Graphic', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', count: '18+ styles' },
    { name: 'Polo', image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=600', count: '12+ styles' },
    { name: 'Vintage', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600', count: '16+ styles' },
  ];

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative h-[92vh] min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1800" alt="Hero" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-2xl">
            <span className="section-label">New Collection 2025</span>
            <h1 className="font-display text-7xl sm:text-8xl md:text-[10rem] leading-none text-cream mb-6">
              WEAR<br /><span className="text-accent">YOUR</span><br />TRUTH
            </h1>
            <p className="text-muted text-lg leading-relaxed mb-10 max-w-md">
              Premium streetwear crafted for those who refuse to blend in. Every thread is a statement.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="btn-primary text-sm">Shop Now <ArrowRight size={16} /></Link>
              <Link to="/shop?isNew=true" className="btn-outline text-sm">New Arrivals</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <ChevronDown size={16} className="text-muted" />
        </div>
        <div className="absolute bottom-0 right-0 bg-surface/90 backdrop-blur-md border-t border-l border-border px-8 py-5 hidden md:grid grid-cols-3 gap-8">
          {[['10K+', 'Happy Customers'], ['50+', 'Unique Designs'], ['4.9★', 'Avg Rating']].map(([num, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl text-accent">{num}</p>
              <p className="text-xs text-muted font-label tracking-wider uppercase">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-accent py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="font-display text-white text-2xl mx-8 tracking-widest">
              RUDROHAM &nbsp;•&nbsp; PREMIUM STREETWEAR &nbsp;•&nbsp; WEAR YOUR TRUTH &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="section-label">Browse by Style</span>
          <h2 className="section-title">COLLECTIONS</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} to={`/shop?category=${cat.name}`}
              className="relative overflow-hidden group aspect-[3/4] bg-surface2 block">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-display text-2xl text-cream">{cat.name}</h3>
                <p className="text-muted text-xs font-label tracking-wider uppercase mt-1">{cat.count}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-label text-accent uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Shop Now <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PRODUCT TABS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <span className="section-label">Handpicked for You</span>
            <h2 className="section-title">OUR DROPS</h2>
          </div>
          <div className="flex gap-1 bg-surface2 p-1 border border-border">
            {[['featured', 'Featured'], ['bestsellers', 'Best Sellers'], ['new', 'New']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`font-label text-xs font-semibold tracking-wider uppercase px-4 py-2 transition-colors ${activeTab === key ? 'bg-accent text-white' : 'text-muted hover:text-cream'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {currentProducts.slice(0, 8).map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/shop" className="btn-outline">View All Products <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ── TRUST FEATURES ── */}
      <section className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { icon: Truck,      title: 'Free Shipping',    desc: 'On orders above ₹599' },
            { icon: Shield,     title: 'Premium Quality',  desc: '100% authentic fabrics' },
            { icon: RotateCcw,  title: 'Easy Returns',     desc: '7-day hassle-free returns' },
            { icon: Zap,        title: 'Fast Delivery',    desc: '2–5 business days' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center px-6 py-8 gap-3">
              <div className="w-12 h-12 bg-surface2 border border-border flex items-center justify-center">
                <Icon size={20} className="text-accent" />
              </div>
              <div>
                <h4 className="font-label font-semibold text-cream text-sm tracking-wider uppercase">{title}</h4>
                <p className="text-muted text-xs mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1800" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-black" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <span className="section-label">Limited Time Offer</span>
          <h2 className="font-display text-6xl md:text-8xl text-cream mb-4">GET 20% OFF</h2>
          <p className="text-muted text-lg mb-8">
            Use code <span className="text-accent font-bold font-label text-xl tracking-wider">WELCOME20</span> on your first order
          </p>
          <Link to="/shop" className="btn-primary text-base px-10 py-4">Shop Now</Link>
        </div>
      </section>
    </div>
  );
}
