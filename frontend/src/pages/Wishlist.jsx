import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import ProductCard from '../components/product/ProductCard';

export default function Wishlist() {
  const { items, fetchWishlist } = useWishlistStore();
  useEffect(() => { fetchWishlist(); }, []);
  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4">
        <span className="section-label">Your Collection</span>
        <h1 className="font-display text-5xl text-cream mb-10">WISHLIST</h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="text-border mx-auto mb-4" />
            <p className="text-muted mb-6">Your wishlist is empty</p>
            <Link to="/shop" className="btn-primary"><ShoppingBag size={16} /> Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {items.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}