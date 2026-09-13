import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { SlidersHorizontal, X, Grid3X3, Grid2X2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';

const CATEGORIES = ['Oversized', 'Slim Fit', 'Graphic', 'Polo', 'Henley', 'Full Sleeve', 'Crop', 'Vintage', 'Drop Shoulder', 'Essential'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FABRICS = ['100% Cotton', 'Cotton Blend', 'Polyester', 'Organic Cotton'];
const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Shop({ collectionType }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const path = location.pathname;

  const isCollections = collectionType === 'featured' || path === '/collections' || searchParams.get('isFeatured') === 'true';
  const isNewArrivals = collectionType === 'new' || path === '/new-arrivals' || searchParams.get('isNew') === 'true';
  const isBestSellers = collectionType === 'bestsellers' || path === '/best-sellers' || searchParams.get('isBestSeller') === 'true';

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [grid, setGrid] = useState(4);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    size: '',
    fabric: '',
    gender: '',
    sort: isNewArrivals ? 'newest' : isBestSellers ? 'popular' : 'featured',
  });

  // Sync URL params on mount or route change
  useEffect(() => {
    const cat = searchParams.get('category');
    const keyword = searchParams.get('keyword');
    if (cat) setFilters(f => ({ ...f, category: cat }));
    if (keyword) setFilters(f => ({ ...f, keyword }));
    setPage(1);
  }, [location.pathname, searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters, page, path, collectionType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (isCollections) params.set('isFeatured', 'true');
      if (isNewArrivals) params.set('isNew', 'true');
      if (isBestSellers) params.set('isBestSeller', 'true');
      if (filters.category) params.set('category', filters.category);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.size) params.set('size', filters.size);
      if (filters.fabric) params.set('fabric', filters.fabric);
      if (filters.gender) params.set('gender', filters.gender);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.keyword) params.set('keyword', filters.keyword);
      params.set('page', page);
      params.set('limit', 12);
      return api.get(`/products?${params.toString()}`).then(r => r.data);
    },
    keepPreviousData: true,
  });

  const toggle = (key, val) => {
    setFilters(f => ({ ...f, [key]: f[key] === val ? '' : val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', size: '', fabric: '', gender: '', sort: 'featured' });
    setPage(1);
  };

  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort' && k !== 'keyword').length;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <span className="section-label">
            {isCollections ? 'Signature Drops' : isNewArrivals ? 'Fresh In' : isBestSellers ? 'Customer Favorites' : 'Explore'}
          </span>
          <h1 className="font-display text-5xl text-cream">
            {isCollections ? 'COLLECTIONS' : isNewArrivals ? 'NEW ARRIVALS' : isBestSellers ? 'BEST SELLERS' : (filters.category ? filters.category.toUpperCase() : 'SHOP ALL')}
          </h1>
          <p className="text-muted text-sm mt-1">
            {isLoading ? 'Loading...' : `${data?.total || 0} Products`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(v => !v)}
              className={`flex items-center gap-2 border px-4 py-2.5 text-xs font-label font-semibold tracking-wider uppercase transition-colors ${filtersOpen ? 'border-accent text-accent' : 'border-border text-muted hover:text-cream hover:border-cream'}`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeCount > 0 && (
                <span className="bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>
              )}
            </button>
            {activeCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              className="bg-surface2 border border-border text-muted text-xs font-label tracking-wider px-3 py-2.5 focus:outline-none focus:border-accent cursor-pointer"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="hidden md:flex border border-border">
              {[4, 3].map(g => (
                <button key={g} onClick={() => setGrid(g)}
                  className={`p-2.5 transition-colors ${grid === g ? 'bg-accent text-white' : 'text-muted hover:text-cream'}`}>
                  {g === 4 ? <Grid3X3 size={14} /> : <Grid2X2 size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          {filtersOpen && (
            <div className="w-56 flex-shrink-0">
              <div className="sticky top-24 space-y-7">
                {/* Category */}
                <div>
                  <h4 className="font-label text-xs font-semibold tracking-[0.15em] text-cream uppercase mb-3">Category</h4>
                  <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                      <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => toggle('category', cat)}
                          className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${filters.category === cat ? 'bg-accent border-accent' : 'border-border group-hover:border-cream'}`}
                        >
                          {filters.category === cat && <div className="w-2 h-2 bg-white" />}
                        </div>
                        <span
                          className={`text-sm cursor-pointer transition-colors ${filters.category === cat ? 'text-cream' : 'text-muted group-hover:text-cream'}`}
                          onClick={() => toggle('category', cat)}
                        >
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h4 className="font-label text-xs font-semibold tracking-[0.15em] text-cream uppercase mb-3">Price Range (₹)</h4>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" value={filters.minPrice}
                      onChange={e => { setFilters(f => ({ ...f, minPrice: e.target.value })); setPage(1); }}
                      className="input-field py-2 text-xs w-full" min="0" />
                    <input type="number" placeholder="Max" value={filters.maxPrice}
                      onChange={e => { setFilters(f => ({ ...f, maxPrice: e.target.value })); setPage(1); }}
                      className="input-field py-2 text-xs w-full" min="0" />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <h4 className="font-label text-xs font-semibold tracking-[0.15em] text-cream uppercase mb-3">Size</h4>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(s => (
                      <button key={s} onClick={() => toggle('size', s)}
                        className={`w-9 h-9 text-xs font-label font-semibold border transition-all ${filters.size === s ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-cream hover:text-cream'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <h4 className="font-label text-xs font-semibold tracking-[0.15em] text-cream uppercase mb-3">Gender</h4>
                  <div className="flex flex-col gap-2">
                    {['Men', 'Women', 'Unisex'].map(g => (
                      <button key={g} onClick={() => toggle('gender', g)}
                        className={`py-1.5 text-xs font-label font-semibold tracking-wider uppercase border transition-colors ${filters.gender === g ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-cream hover:text-cream'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabric */}
                <div>
                  <h4 className="font-label text-xs font-semibold tracking-[0.15em] text-cream uppercase mb-3">Fabric</h4>
                  {FABRICS.map(f => (
                    <label key={f} className="flex items-center gap-2.5 mb-2.5 cursor-pointer group">
                      <div onClick={() => toggle('fabric', f)}
                        className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${filters.fabric === f ? 'bg-accent border-accent' : 'border-border group-hover:border-cream'}`}>
                        {filters.fabric === f && <div className="w-2 h-2 bg-white" />}
                      </div>
                      <span className={`text-xs cursor-pointer transition-colors ${filters.fabric === f ? 'text-cream' : 'text-muted group-hover:text-cream'}`}
                        onClick={() => toggle('fabric', f)}>
                        {f}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className={`grid grid-cols-2 ${grid === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6`}>
                {[...Array(12)].map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}
              </div>
            ) : data?.products?.length === 0 ? (
              <div className="text-center py-24 border border-border">
                <p className="text-muted text-lg mb-2">No products found</p>
                <p className="text-muted text-sm mb-6">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-outline text-sm">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-2 ${grid === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6`}>
                  {data.products.map(p => <ProductCard key={p._id} product={p} />)}
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {page > 1 && (
                      <button onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                        className="border border-border text-muted hover:text-cream px-4 py-2 text-xs font-label uppercase tracking-wider transition-colors">
                        ← Prev
                      </button>
                    )}
                    {[...Array(data.pages)].map((_, i) => (
                      <button key={i} onClick={() => { setPage(i + 1); window.scrollTo(0, 0); }}
                        className={`w-9 h-9 text-xs font-label font-semibold border transition-colors ${page === i + 1 ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-cream hover:text-cream'}`}>
                        {i + 1}
                      </button>
                    ))}
                    {page < data.pages && (
                      <button onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                        className="border border-border text-muted hover:text-cream px-4 py-2 text-xs font-label uppercase tracking-wider transition-colors">
                        Next →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
