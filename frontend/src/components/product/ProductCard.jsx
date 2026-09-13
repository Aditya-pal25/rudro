import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();

  if (!product) return null;

  const wishlisted = isWishlisted(product._id);
  const price = product.discountPrice || product.price;
  const originalPrice = product.price;
  const discount = product.discountPrice
    ? Math.round(((originalPrice - product.discountPrice) / originalPrice) * 100)
    : 0;

  // Always use _id in URL — avoids MongoDB CastError with slugs
  const productUrl = `/product/${product._id}`;

  const firstColor = product.colors?.find(c => c.sizes?.some(s => s.stock > 0));
  const firstSize = firstColor?.sizes?.find(s => s.stock > 0);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstColor || !firstSize) { toast.error('Out of stock'); return; }
    addItem(product, firstColor.name, firstSize.size);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={productUrl}>
        {/* Image */}
        <div className="relative overflow-hidden bg-surface2 aspect-[3/4]">
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { e.target.style.display = 'none'; setImgLoaded(true); }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm">No Image</div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && <span className="badge bg-accent text-white">New</span>}
            {product.isBestSeller && <span className="badge bg-gold text-black">Best Seller</span>}
            {discount > 0 && <span className="badge bg-black/80 text-cream border border-border/50">-{discount}%</span>}
            {product.totalStock === 0 && <span className="badge bg-surface/90 text-muted">Sold Out</span>}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all duration-200 ${wishlisted ? 'bg-accent text-white' : 'bg-black/50 text-cream hover:bg-accent'}`}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Hover Actions */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${hovered && product.totalStock > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex gap-2">
              <button
                onClick={handleQuickAdd}
                className="flex-1 bg-cream text-black font-label text-xs font-semibold tracking-widest uppercase py-2.5 hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingBag size={13} /> Quick Add
              </button>
              <Link
                to={productUrl}
                className="w-10 h-10 bg-surface2/90 flex items-center justify-center text-cream hover:bg-accent transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <Eye size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-3 pb-1">
          <p className="text-xs text-muted font-label tracking-wider uppercase mb-1">{product.category}</p>
          <h3 className="text-cream text-sm font-medium truncate group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-cream font-semibold">₹{price?.toLocaleString()}</span>
              {product.discountPrice && (
                <span className="text-muted text-xs line-through">₹{originalPrice?.toLocaleString()}</span>
              )}
            </div>
            {product.ratings > 0 && (
              <div className="flex items-center gap-1">
                <Star size={11} fill="currentColor" className="text-gold" />
                <span className="text-xs text-muted">{product.ratings}</span>
              </div>
            )}
          </div>
          {/* Color swatches */}
          {product.colors?.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {product.colors.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  title={c.name}
                  className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
                  style={{ background: c.hex || '#888' }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-xs text-muted">+{product.colors.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
