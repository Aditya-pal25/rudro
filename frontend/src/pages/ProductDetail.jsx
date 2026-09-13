import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Heart, ShoppingBag, Star, ChevronLeft, Plus, Minus,
  Truck, RotateCcw, Shield, Check, Share2, ZoomIn
} from 'lucide-react';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(0);
  const [tab, setTab] = useState('desc');
  const [sizeError, setSizeError] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
    retry: 1,
    enabled: !!id,
  });

  const { data: relatedData } = useQuery({
    queryKey: ['related', id],
    queryFn: () => api.get(`/products/${id}/related`).then(r => r.data),
    enabled: !!id,
  });

  const product = data?.product;

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedColor(0);
      setSelectedSize('');
      setMainImg(0);
      setQty(1);
    }
  }, [product?._id]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-[3/4] skeleton" />
            <div className="space-y-4 pt-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-8 skeleton" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-4">
        <div>
          <div className="text-6xl mb-4">😕</div>
          <h2 className="font-display text-4xl text-cream mb-3">Product Not Found</h2>
          <p className="text-muted mb-8">This product may have been removed or is unavailable.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate(-1)} className="btn-outline">
              <ChevronLeft size={16} /> Go Back
            </button>
            <Link to="/shop" className="btn-primary">Browse Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const color = product.colors?.[selectedColor];
  const allImages = [
    ...(product.images || []),
    ...(color?.images || []),
  ].filter(img => img?.url);

  const sizeObj = color?.sizes?.find(s => s.size === selectedSize);
  const stockLeft = sizeObj?.stock || 0;
  const price = product.discountPrice || product.price;
  const discount = product.discountPercent || 0;
  const wishlisted = isWishlisted(product._id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      toast.error('Please select a size');
      // Scroll to size section
      document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (stockLeft < qty) {
      toast.error(`Only ${stockLeft} left in stock`);
      return;
    }
    setSizeError(false);
    addItem(product, color.name, selectedSize, qty);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (selectedSize) navigate('/checkout');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted font-label tracking-wider">
          <Link to="/" className="hover:text-cream transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-cream transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-cream transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-cream truncate max-w-[150px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mt-4">

          {/* ── IMAGES ── */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(i)}
                    className={`aspect-square overflow-hidden border-2 transition-all ${mainImg === i ? 'border-accent' : 'border-border hover:border-muted'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative overflow-hidden bg-surface2 aspect-[3/4]">
              {allImages.length > 0 ? (
                <img
                  src={allImages[mainImg]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={e => e.target.style.opacity = '0.3'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">No Image</div>
              )}

              {/* Wishlist */}
              <button
                onClick={() => toggle(product._id)}
                className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-all ${wishlisted ? 'bg-accent text-white' : 'bg-black/60 text-cream hover:bg-accent'}`}
              >
                <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>

              {/* Discount badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 badge bg-accent text-white">-{discount}% OFF</div>
              )}

              {/* Mobile thumbnail dots */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 sm:hidden">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImg(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${mainImg === i ? 'bg-accent w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PRODUCT INFO ── */}
          <div className="lg:py-2 space-y-5">
            {/* Category + Share */}
            <div className="flex items-center justify-between">
              <span className="section-label mb-0">{product.category}</span>
              <button onClick={handleShare} className="text-muted hover:text-cream transition-colors p-1">
                <Share2 size={16} />
              </button>
            </div>

            {/* Name */}
            <h1 className="font-display text-4xl sm:text-5xl text-cream leading-tight">
              {product.name}
            </h1>

            {/* Rating + Sold */}
            <div className="flex items-center gap-4">
              {product.ratings > 0 && (
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(product.ratings) ? 'currentColor' : 'none'} className="text-gold" />
                  ))}
                  <span className="text-sm text-muted ml-1">({product.numReviews} reviews)</span>
                </div>
              )}
              {product.totalSold > 0 && (
                <span className="text-xs text-muted border-l border-border pl-4">{product.totalSold} sold</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl text-cream">₹{price?.toLocaleString()}</span>
              {product.discountPrice && (
                <span className="text-xl text-muted line-through">₹{product.price?.toLocaleString()}</span>
              )}
              {discount > 0 && (
                <span className="badge bg-accent/10 text-accent border border-accent/30">{discount}% OFF</span>
              )}
            </div>

            {/* Color Selector */}
            {product.colors?.length > 0 && (
              <div>
                <p className="font-label text-xs tracking-[0.15em] text-cream uppercase mb-3">
                  Color: <span className="text-muted normal-case tracking-normal font-body ml-1">{color?.name}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedColor(i); setSelectedSize(''); setSizeError(false); }}
                      title={c.name}
                      className={`relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === i ? 'border-accent scale-110' : 'border-transparent hover:border-muted'}`}
                      style={{ background: c.hex || '#888' }}
                    >
                      {selectedColor === i && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-black" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div id="size-selector">
              <div className="flex items-center justify-between mb-3">
                <p className={`font-label text-xs tracking-[0.15em] uppercase font-semibold ${sizeError ? 'text-accent' : 'text-cream'}`}>
                  {sizeError ? '⚠ Please select a size' : 'Select Size'}
                </p>
                <button className="text-xs text-muted hover:text-cream underline transition-colors">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {color?.sizes?.map((s) => {
                  const isSelected = selectedSize === s.size;
                  const isOOS = s.stock === 0;
                  return (
                    <button
                      key={s.size}
                      disabled={isOOS}
                      onClick={() => { setSelectedSize(s.size); setSizeError(false); }}
                      className={`relative min-w-[3rem] h-11 px-3 border font-label font-semibold text-sm tracking-wider transition-all ${
                        isOOS
                          ? 'border-border/30 text-border cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                          : 'border-border text-muted hover:border-cream hover:text-cream'
                      }`}
                    >
                      {s.size}
                      {!isOOS && s.stock < 5 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-gold text-black text-[9px] px-1 font-bold leading-4">
                          LOW
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedSize && stockLeft > 0 && (
                <p className="mt-2 text-xs">
                  <span className={stockLeft < 5 ? 'text-gold' : 'text-green-400'}>
                    {stockLeft < 5 ? `Only ${stockLeft} left!` : `${stockLeft} in stock`}
                  </span>
                </p>
              )}
            </div>

            {/* Quantity + Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-11 h-12 flex items-center justify-center text-muted hover:text-cream transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-cream font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(Math.max(stockLeft, 10), qty + 1))}
                    className="w-11 h-12 flex items-center justify-center text-muted hover:text-cream transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.totalStock === 0}
                  className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={16} />
                  {product.totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {/* Buy Now */}
              {product.totalStock > 0 && (
                <button
                  onClick={handleBuyNow}
                  className="btn-outline w-full justify-center"
                >
                  Buy Now
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 py-5 border-t border-b border-border">
              {[
                { icon: Truck, title: 'Free Shipping', sub: 'On orders ₹599+' },
                { icon: RotateCcw, title: '7-Day Returns', sub: 'Hassle-free returns' },
                { icon: Shield, title: '100% Genuine', sub: 'Quality guaranteed' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center text-center gap-1.5">
                  <Icon size={18} className="text-accent" />
                  <p className="text-cream text-xs font-label font-semibold uppercase tracking-wider leading-tight">{title}</p>
                  <p className="text-muted text-xs leading-tight">{sub}</p>
                </div>
              ))}
            </div>

            {/* Product Meta */}
            <div className="space-y-2">
              {[
                ['Fabric', product.fabric],
                ['Fit', product.fit],
                ['Gender', product.gender],
                ['Weight', product.weight ? `${product.weight}g` : null],
              ].filter(([, v]) => v).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="text-muted w-20 flex-shrink-0">{key}</span>
                  <span className="text-cream">{val}</span>
                </div>
              ))}
              {product.tags?.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-muted w-20 flex-shrink-0">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map(tag => (
                      <Link key={tag} to={`/shop?keyword=${tag}`}
                        className="text-xs text-muted border border-border px-2 py-0.5 hover:border-accent hover:text-accent transition-colors">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="mt-16 border-t border-border pt-10">
          <div className="flex border-b border-border mb-8 overflow-x-auto">
            {[
              ['desc', 'Description'],
              ['care', 'Care Instructions'],
              ['reviews', `Reviews (${product.numReviews || 0})`],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`font-label font-semibold text-xs tracking-[0.15em] uppercase px-6 py-3.5 border-b-2 whitespace-nowrap transition-colors ${tab === key ? 'border-accent text-cream' : 'border-transparent text-muted hover:text-cream'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'desc' && (
            <div className="max-w-2xl">
              <p className="text-muted leading-relaxed">{product.description}</p>
              {product.shortDescription && (
                <p className="text-cream/80 text-sm mt-4 leading-relaxed border-l-2 border-accent pl-4">{product.shortDescription}</p>
              )}
            </div>
          )}

          {tab === 'care' && (
            <ul className="space-y-3 max-w-md">
              {(product.careInstructions || []).length > 0 ? (
                product.careInstructions.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted">
                    <Check size={14} className="text-accent flex-shrink-0" /> {c}
                  </li>
                ))
              ) : (
                <p className="text-muted text-sm">No care instructions provided.</p>
              )}
            </ul>
          )}

          {tab === 'reviews' && (
            <div className="space-y-6 max-w-2xl">
              {product.reviews?.length > 0 ? product.reviews.map((r) => (
                <div key={r._id} className="border-b border-border pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {r.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-cream text-sm font-medium">{r.user?.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} fill={i < r.rating ? 'currentColor' : 'none'} className="text-gold" />
                        ))}
                        {r.isVerifiedPurchase && (
                          <span className="text-xs text-green-400 font-label ml-2">✓ Verified Purchase</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  {r.title && <p className="text-cream text-sm font-medium mb-1">{r.title}</p>}
                  <p className="text-muted text-sm leading-relaxed">{r.comment}</p>
                </div>
              )) : (
                <div className="text-center py-10 border border-border">
                  <Star size={32} className="text-border mx-auto mb-3" />
                  <p className="text-muted">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {relatedData?.products?.length > 0 && (
          <div className="mt-20">
            <span className="section-label">You Might Also Like</span>
            <h2 className="section-title mb-8">RELATED DROPS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedData.products.slice(0, 4).map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
