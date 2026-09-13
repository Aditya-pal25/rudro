import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, X, Search, ChevronDown, LogOut, Package } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userDrop, setUserDrop]       = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openCart, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const navigate  = useNavigate();
  const location  = useLocation();
  const searchRef = useRef(null);
  const dropRef   = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); setUserDrop(false); }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserDrop(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) { setSearchOpen(false); setSearchResults([]); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try { const { data } = await api.get(`/products/search?q=${encodeURIComponent(searchQuery)}`); setSearchResults(data.products || []); }
        catch { setSearchResults([]); }
      } else setSearchResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const navLinks = [
    { label: 'New Arrivals', to: '/shop?isNew=true' },
    { label: 'Best Sellers', to: '/shop?isBestSeller=true' },
    { label: 'Shop All',     to: '/shop' },
    { label: 'Collections',  to: '/shop?isFeatured=true' },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-accent text-white text-center py-2 text-xs font-label tracking-[0.2em] uppercase overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="mx-8">
              🔥 Free Shipping above ₹599 &nbsp;•&nbsp; Code <strong>WELCOME20</strong> = 20% off &nbsp;•&nbsp; New drops every Friday
            </span>
          ))}
        </div>
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/95 backdrop-blur-xl border-b border-border shadow-xl' : 'bg-black/80 backdrop-blur-md border-b border-border/50'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0">
            <span className="font-display text-3xl text-cream tracking-wider hover:text-accent transition-colors">RUDROHAM</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => <Link key={l.to} to={l.to} className="link-nav">{l.label}</Link>)}
          </div>

          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button onClick={() => setSearchOpen(v => !v)} className="p-2.5 text-muted hover:text-cream transition-colors">
                <Search size={18} />
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-12 w-80 bg-surface border border-border shadow-2xl z-50">
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..." className="input-field border-0 border-b border-border" autoFocus />
                  {searchResults.length > 0 && (
                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map(p => (
                        <Link key={p._id} to={`/product/${p._id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                          className="flex items-center gap-3 p-3 hover:bg-surface2 transition-colors">
                          {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-10 h-12 object-cover flex-shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm text-cream font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted">{p.category}</p>
                            <p className="text-xs text-accent font-semibold">₹{(p.discountPrice || p.price)?.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchQuery.length > 1 && searchResults.length === 0 && (
                    <div className="p-4 text-center text-muted text-sm">No products found</div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="p-2.5 text-muted hover:text-cream transition-colors">
                <Heart size={18} />
              </Link>
            )}

            {/* Cart */}
            <button onClick={openCart} className="p-2.5 text-muted hover:text-cream transition-colors relative">
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* User dropdown — NO admin link */}
            {isAuthenticated ? (
              <div ref={dropRef} className="relative">
                <button onClick={() => setUserDrop(v => !v)} className="flex items-center gap-1.5 p-2 text-muted hover:text-cream transition-colors">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 bg-accent flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</div>}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${userDrop ? 'rotate-180' : ''}`} />
                </button>
                {userDrop && (
                  <div className="absolute right-0 top-12 w-48 bg-surface border border-border shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-cream text-sm font-medium truncate">{user?.name}</p>
                      <p className="text-muted text-xs truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserDrop(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-cream hover:bg-surface2 transition-colors">
                      <User size={14} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setUserDrop(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-cream hover:bg-surface2 transition-colors">
                      <Package size={14} /> My Orders
                    </Link>
                    <button onClick={() => { logout(); setUserDrop(false); toast.success('Logged out'); navigate('/'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-accent hover:bg-surface2 transition-colors border-t border-border">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-xs py-2 px-4 hidden md:inline-flex">Login</Link>
            )}

            <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 text-muted hover:text-cream ml-1">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-surface border-t border-border">
            <div className="flex flex-col py-4">
              {navLinks.map(l => <Link key={l.to} to={l.to} className="link-nav px-6 py-3 hover:bg-surface2">{l.label}</Link>)}
              {!isAuthenticated && (
                <div className="px-6 pt-4 flex gap-3">
                  <Link to="/login"    className="btn-primary flex-1 justify-center text-xs py-2.5">Login</Link>
                  <Link to="/register" className="btn-outline flex-1 justify-center text-xs py-2.5">Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
