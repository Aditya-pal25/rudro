import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/admin/ImageUploader';

const CATEGORIES = [
  'Oversized',
  'Slim Fit',
  'Graphic',
  'Polo',
  'Henley',
  'Full Sleeve',
  'Crop',
  'Vintage',
  'Drop Shoulder',
  'Essential',
];

const FABRICS = [
  '100% Cotton',
  'Cotton Blend',
  'Polyester',
  'Organic Cotton',
  'Linen Blend',
];

const FITS = [
  'Regular',
  'Slim',
  'Oversized',
  'Relaxed',
];

const SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
];

const createEmptyColors = () => [
  {
    name: 'Black',
    hex: '#000000',
    images: [],
    sizes: SIZES.map((size) => ({
      size,
      stock: 0,
    })),
  },
];

const createEmptyForm = () => ({
  name: '',
  description: '',
  shortDescription: '',
  price: '',
  discountPrice: '',
  category: 'Essential',
  gender: 'Unisex',
  fabric: '100% Cotton',
  fit: 'Regular',

  isFeatured: false,
  isNewArrival: true,
  isBestSeller: false,
  isActive: true,

  images: [],
  colors: createEmptyColors(),

  careInstructions: [
    'Machine wash cold',
    'Tumble dry low',
  ],

  tags: '',
});

const emptyForm = createEmptyForm();

export default function AdminProducts() {
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () =>
      api
        .get(
          `/products/admin/all?keyword=${encodeURIComponent(
            search
          )}&limit=15&page=${page}`
        )
        .then((response) => response.data),
  });

  const openCreate = () => {
    setForm(createEmptyForm());
    setModal('create');
  };

  const openEdit = (product) => {
    setForm({
      ...product,

      price: product.price ?? '',
      discountPrice: product.discountPrice ?? '',

      tags: Array.isArray(product.tags)
        ? product.tags.join(', ')
        : product.tags || '',

      careInstructions:
        Array.isArray(product.careInstructions) &&
        product.careInstructions.length > 0
          ? product.careInstructions
          : ['Machine wash cold'],

      images: Array.isArray(product.images)
        ? product.images
        : [],

      colors:
        Array.isArray(product.colors) && product.colors.length > 0
          ? product.colors
          : createEmptyColors(),

      isNewArrival:
        typeof product.isNewArrival === 'boolean'
          ? product.isNewArrival
          : Boolean(product.isNew),
    });

    setModal('edit');
  };

  const setF = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const setColorField = (colorIndex, key, value) => {
    setForm((current) => {
      const colors = Array.isArray(current.colors)
        ? [...current.colors]
        : [];

      if (!colors[colorIndex]) {
        return current;
      }

      colors[colorIndex] = {
        ...colors[colorIndex],
        [key]: value,
      };

      return {
        ...current,
        colors,
      };
    });
  };

  const setColorStock = (colorIndex, sizeIndex, value) => {
    setForm((current) => {
      const colors = Array.isArray(current.colors)
        ? current.colors.map((color) => ({
            ...color,
            sizes: Array.isArray(color.sizes)
              ? color.sizes.map((size) => ({
                  ...size,
                }))
              : [],
          }))
        : [];

      const color = colors[colorIndex];

      if (!color || !Array.isArray(color.sizes)) {
        return current;
      }

      const size = color.sizes[sizeIndex];

      if (!size) {
        return current;
      }

      size.stock = Math.max(0, Number(value) || 0);

      return {
        ...current,
        colors,
      };
    });
  };

  const addColor = () => {
    setF('colors', [
      ...(Array.isArray(form.colors) ? form.colors : []),
      {
        name: '',
        hex: '#888888',
        images: [],
        sizes: SIZES.map((size) => ({
          size,
          stock: 0,
        })),
      },
    ]);
  };

  const removeColor = (colorIndex) => {
    const colors = Array.isArray(form.colors)
      ? form.colors
      : [];

    if (colors.length <= 1) {
      toast.error('At least one color is required');
      return;
    }

    setF(
      'colors',
      colors.filter((_, index) => index !== colorIndex)
    );
  };

  const save = async () => {
    if (
      !form.name ||
      !String(form.name).trim() ||
      !form.price ||
      !form.description ||
      !String(form.description).trim()
    ) {
      toast.error(
        'Name, price and description are required'
      );
      return;
    }

    const images = Array.isArray(form.images)
      ? form.images.filter(
          (image) => image && image.url
        )
      : [];

    if (images.length === 0) {
      toast.error(
        'Please upload at least one product image'
      );
      return;
    }

    const numericPrice = Number(form.price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error('Please enter a valid product price');
      return;
    }

    let numericDiscountPrice;

    if (
      form.discountPrice !== '' &&
      form.discountPrice !== null &&
      form.discountPrice !== undefined
    ) {
      numericDiscountPrice = Number(
        form.discountPrice
      );

      if (
        !Number.isFinite(numericDiscountPrice) ||
        numericDiscountPrice < 0
      ) {
        toast.error(
          'Please enter a valid sale price'
        );
        return;
      }

      if (numericDiscountPrice >= numericPrice) {
        toast.error(
          'Sale price must be lower than MRP'
        );
        return;
      }
    }

    setSaving(true);

    try {
      const cleanImages = images.map((image) => ({
        url: image.url,
        publicId: image.publicId || '',
        alt: image.alt || form.name.trim(),
      }));

      const cleanTags =
        typeof form.tags === 'string'
          ? form.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : Array.isArray(form.tags)
            ? form.tags
            : [];

      const cleanColors = Array.isArray(form.colors)
        ? form.colors.map((color) => ({
            name: color.name || '',
            hex: color.hex || '#000000',

            images: Array.isArray(color.images)
              ? color.images
                  .filter(
                    (image) =>
                      image && image.url
                  )
                  .map((image) => ({
                    url: image.url,
                    publicId:
                      image.publicId || '',
                  }))
              : [],

            sizes: Array.isArray(color.sizes)
              ? color.sizes.map((size) => ({
                  size: size.size,
                  stock: Math.max(
                    0,
                    Number(size.stock) || 0
                  ),
                }))
              : [],
          }))
        : [];

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription:
          form.shortDescription || '',

        price: numericPrice,

        discountPrice:
          numericDiscountPrice !== undefined
            ? numericDiscountPrice
            : undefined,

        category: form.category,
        gender: form.gender,
        fabric: form.fabric,
        fit: form.fit,

        isFeatured: Boolean(form.isFeatured),
        isNewArrival: Boolean(form.isNewArrival),
        isBestSeller: Boolean(form.isBestSeller),
        isActive:
          typeof form.isActive === 'boolean'
            ? form.isActive
            : true,

        images: cleanImages,
        colors: cleanColors,

        careInstructions:
          Array.isArray(form.careInstructions)
            ? form.careInstructions
                .map((instruction) =>
                  String(instruction).trim()
                )
                .filter(Boolean)
            : [],

        tags: cleanTags,
      };

      if (modal === 'create') {
        await api.post('/products', payload);
      } else if (modal === 'edit' && form._id) {
        await api.put(
          `/products/${form._id}`,
          payload
        );
      } else {
        throw new Error(
          'Invalid product operation'
        );
      }

      await qc.invalidateQueries({
        queryKey: ['admin-products'],
      });

      setModal(null);
      setForm(createEmptyForm());

      toast.success(
        modal === 'create'
          ? 'Product created! 🎉'
          : 'Product updated!'
      );
    } catch (error) {
      console.error(
        'Product save error:',
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive,
      });

      await qc.invalidateQueries({
        queryKey: ['admin-products'],
      });

      toast.success(
        product.isActive
          ? 'Hidden'
          : 'Visible'
      );
    } catch (error) {
      console.error(
        'Toggle product error:',
        error
      );

      toast.error('Failed');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);

      await qc.invalidateQueries({
        queryKey: ['admin-products'],
      });

      toast.success('Deleted');
    } catch (error) {
      console.error(
        'Delete product error:',
        error
      );

      toast.error('Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-cream">
            PRODUCTS
          </h1>

          <p className="text-muted text-sm mt-1">
            {data?.total || 0} total
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary text-xs py-2.5 px-5"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search products..."
          className="input-field pl-9 py-2.5 text-sm"
        />
      </div>

      {/* Products Table */}
      <div className="bg-surface border border-border overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              {[
                'Product',
                'Category',
                'Price',
                'Stock',
                'Flags',
                'Status',
                'Actions',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-label text-muted uppercase tracking-wider"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(6)].map((_, index) => (
                <tr key={index}>
                  <td
                    colSpan={7}
                    className="px-4 py-3"
                  >
                    <div className="h-10 skeleton" />
                  </td>
                </tr>
              ))
            ) : data?.products?.length > 0 ? (
              data.products.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-surface2 transition-colors"
                >
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <img
                          src={
                            product.images[0].url
                          }
                          alt={
                            product.images[0].alt ||
                            product.name ||
                            ''
                          }
                          className="w-10 h-12 object-cover bg-surface2 flex-shrink-0 border border-border"
                        />
                      ) : (
                        <div className="w-10 h-12 bg-surface2 border border-border flex items-center justify-center flex-shrink-0 text-muted text-xs">
                          No img
                        </div>
                      )}

                      <div>
                        <p className="text-cream text-sm font-medium max-w-[150px] truncate">
                          {product.name}
                        </p>

                        <p className="text-muted text-xs">
                          {product.gender} ·{' '}
                          {product.fabric}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-xs text-muted">
                    {product.category}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <p className="text-cream text-sm font-semibold">
                      ₹
                      {(
                        product.discountPrice ||
                        product.price ||
                        0
                      ).toLocaleString()}
                    </p>

                    {product.discountPrice && (
                      <p className="text-muted text-xs line-through">
                        ₹
                        {(
                          product.price || 0
                        ).toLocaleString()}
                      </p>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold text-sm ${
                        product.totalStock === 0
                          ? 'text-red-400'
                          : product.totalStock < 10
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {product.totalStock || 0}
                    </span>
                  </td>

                  {/* Flags */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {product.isFeatured && (
                        <span className="badge bg-gold/10 text-gold">
                          ⭐
                        </span>
                      )}

                      {product.isNewArrival && (
                        <span className="badge bg-accent/10 text-accent">
                          New
                        </span>
                      )}

                      {product.isBestSeller && (
                        <span className="badge bg-purple-400/10 text-purple-400">
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        product.isActive
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-red-400/10 text-red-400'
                      }`}
                    >
                      {product.isActive
                        ? 'Active'
                        : 'Hidden'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          openEdit(product)
                        }
                        className="p-1.5 text-muted hover:text-cream transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() =>
                          toggleActive(product)
                        }
                        className="p-1.5 text-muted hover:text-cream transition-colors"
                        title={
                          product.isActive
                            ? 'Hide'
                            : 'Show'
                        }
                      >
                        {product.isActive ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          del(product._id)
                        }
                        className="p-1.5 text-muted hover:text-accent transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted text-sm"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex gap-2 justify-center">
          {[...Array(data.pages)].map(
            (_, index) => {
              const pageNumber = index + 1;

              return (
                <button
                  key={pageNumber}
                  onClick={() =>
                    setPage(pageNumber)
                  }
                  className={`w-8 h-8 text-xs font-label font-semibold border transition-colors ${
                    page === pageNumber
                      ? 'bg-accent border-accent text-white'
                      : 'border-border text-muted hover:text-cream'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModal(null);
            }
          }}
        >
          <div className="bg-surface border border-border w-full max-w-3xl my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-label font-semibold tracking-[0.15em] uppercase text-cream text-sm">
                {modal === 'create'
                  ? '+ New Product'
                  : `Edit — ${form.name}`}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setModal(null)
                }
                className="text-muted hover:text-cream text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Images */}
              <div>
                <label className="admin-label block mb-3">
                  Product Images *
                </label>

                <ImageUploader
                  value={form.images}
                  onChange={(images) =>
                    setF('images', images)
                  }
                  multiple={true}
                  maxFiles={6}
                />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="admin-label">
                    Product Name *
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setF(
                        'name',
                        event.target.value
                      )
                    }
                    className="input-field"
                    placeholder="e.g. Rudroham Flame Oversized"
                  />
                </div>

                <div className="col-span-2">
                  <label className="admin-label">
                    Description *
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setF(
                        'description',
                        event.target.value
                      )
                    }
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Full product description..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="admin-label">
                    Short Description
                  </label>

                  <input
                    value={form.shortDescription}
                    onChange={(event) =>
                      setF(
                        'shortDescription',
                        event.target.value
                      )
                    }
                    className="input-field"
                    placeholder="One-liner shown in listings"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="admin-label">
                    MRP (₹) *
                  </label>

                  <input
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setF(
                        'price',
                        event.target.value
                      )
                    }
                    className="input-field"
                    placeholder="1299"
                    min="0"
                  />
                </div>

                <div>
                  <label className="admin-label">
                    Sale Price (₹)
                  </label>

                  <input
                    type="number"
                    value={form.discountPrice}
                    onChange={(event) =>
                      setF(
                        'discountPrice',
                        event.target.value
                      )
                    }
                    className="input-field"
                    placeholder="999 (optional)"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  {form.price &&
                    form.discountPrice &&
                    Number(form.discountPrice) <
                      Number(form.price) && (
                      <div className="bg-accent/10 border border-accent/30 px-3 py-2 w-full text-center">
                        <p className="text-accent font-display text-2xl leading-none">
                          {Math.round(
                            ((Number(
                              form.price
                            ) -
                              Number(
                                form.discountPrice
                              )) /
                              Number(
                                form.price
                              )) *
                              100
                          )}
                          %
                        </p>

                        <p className="text-muted text-xs">
                          off
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setF(
                        'category',
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="admin-label">
                    Gender
                  </label>

                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setF(
                        'gender',
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    {[
                      'Unisex',
                      'Men',
                      'Women',
                    ].map((gender) => (
                      <option
                        key={gender}
                        value={gender}
                      >
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">
                    Fabric
                  </label>

                  <select
                    value={form.fabric}
                    onChange={(event) =>
                      setF(
                        'fabric',
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    {FABRICS.map((fabric) => (
                      <option
                        key={fabric}
                        value={fabric}
                      >
                        {fabric}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">
                    Fit
                  </label>

                  <select
                    value={form.fit}
                    onChange={(event) =>
                      setF(
                        'fit',
                        event.target.value
                      )
                    }
                    className="input-field"
                  >
                    {FITS.map((fit) => (
                      <option
                        key={fit}
                        value={fit}
                      >
                        {fit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="admin-label">
                    Tags (comma separated)
                  </label>

                  <input
                    value={form.tags}
                    onChange={(event) =>
                      setF(
                        'tags',
                        event.target.value
                      )
                    }
                    className="input-field"
                    placeholder="oversized, streetwear, graphic, unisex"
                  />
                </div>
              </div>

              {/* Flags */}
              <div>
                <label className="admin-label mb-3">
                  Product Flags
                </label>

                <div className="flex flex-wrap gap-5">
                  {[
                    [
                      'isFeatured',
                      '⭐ Featured',
                    ],
                    [
                      'isNewArrival',
                      '🆕 New Arrival',
                    ],
                    [
                      'isBestSeller',
                      '🔥 Best Seller',
                    ],
                    [
                      'isActive',
                      '✅ Active (Visible on store)',
                    ],
                  ].map(
                    ([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <div
                          onClick={() =>
                            setF(
                              key,
                              !form[key]
                            )
                          }
                          className={`w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
                            form[key]
                              ? 'bg-accent border-accent'
                              : 'border-border hover:border-muted'
                          }`}
                        >
                          {form[key] && (
                            <div className="w-2 h-2 bg-white" />
                          )}
                        </div>

                        <span
                          className="text-sm text-muted cursor-pointer hover:text-cream"
                          onClick={() =>
                            setF(
                              key,
                              !form[key]
                            )
                          }
                        >
                          {label}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Colors & Stock */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="admin-label mb-0">
                    Colors & Stock
                  </label>

                  <button
                    type="button"
                    onClick={addColor}
                    className="flex items-center gap-1 text-xs text-accent font-label font-semibold uppercase tracking-wider hover:text-accent-dark transition-colors"
                  >
                    <Plus size={12} />
                    Add Color
                  </button>
                </div>

                <div className="space-y-4">
                  {form.colors?.map(
                    (color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="border border-border p-4 relative"
                      >
                        {form.colors.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeColor(
                                colorIndex
                              )
                            }
                            className="absolute top-3 right-3 text-muted hover:text-accent text-xl leading-none"
                          >
                            ×
                          </button>
                        )}

                        <div className="flex gap-3 mb-4 pr-6">
                          <div className="flex-1">
                            <label className="text-xs text-muted font-label uppercase tracking-wider mb-1 block">
                              Color Name
                            </label>

                            <input
                              value={
                                color.name ||
                                ''
                              }
                              onChange={(
                                event
                              ) =>
                                setColorField(
                                  colorIndex,
                                  'name',
                                  event.target
                                    .value
                                )
                              }
                              placeholder="e.g. Washed Black"
                              className="input-field text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-muted font-label uppercase tracking-wider mb-1 block">
                              Hex Color
                            </label>

                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={
                                  color.hex ||
                                  '#000000'
                                }
                                onChange={(
                                  event
                                ) =>
                                  setColorField(
                                    colorIndex,
                                    'hex',
                                    event.target
                                      .value
                                  )
                                }
                                className="w-10 h-10 border border-border p-0.5 cursor-pointer bg-transparent"
                              />

                              <input
                                value={
                                  color.hex ||
                                  '#000000'
                                }
                                onChange={(
                                  event
                                ) =>
                                  setColorField(
                                    colorIndex,
                                    'hex',
                                    event.target
                                      .value
                                  )
                                }
                                className="input-field w-24 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted font-label uppercase tracking-wider mb-2 block">
                            Stock per Size (enter 0 if not available)
                          </label>

                          <div className="grid grid-cols-7 gap-2">
                            {color.sizes?.map(
                              (
                                size,
                                sizeIndex
                              ) => (
                                <div
                                  key={
                                    sizeIndex
                                  }
                                  className="text-center"
                                >
                                  <p className="text-xs text-muted font-label font-semibold mb-1">
                                    {size.size}
                                  </p>

                                  <input
                                    type="number"
                                    value={
                                      size.stock
                                    }
                                    min={0}
                                    onChange={(
                                      event
                                    ) =>
                                      setColorStock(
                                        colorIndex,
                                        sizeIndex,
                                        event.target
                                          .value
                                      )
                                    }
                                    className="input-field text-center text-xs py-1.5 px-1 w-full"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Care Instructions */}
              <div>
                <label className="admin-label">
                  Care Instructions
                </label>

                <div className="space-y-2">
                  {(
                    form.careInstructions || []
                  ).map(
                    (instruction, index) => (
                      <div
                        key={index}
                        className="flex gap-2"
                      >
                        <input
                          value={instruction}
                          onChange={(event) => {
                            const instructions = [
                              ...form.careInstructions,
                            ];

                            instructions[index] =
                              event.target.value;

                            setF(
                              'careInstructions',
                              instructions
                            );
                          }}
                          className="input-field flex-1 text-sm"
                          placeholder="e.g. Machine wash cold"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setF(
                              'careInstructions',
                              form.careInstructions.filter(
                                (_, itemIndex) =>
                                  itemIndex !==
                                  index
                              )
                            )
                          }
                          className="text-muted hover:text-accent px-2 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setF(
                        'careInstructions',
                        [
                          ...(form.careInstructions ||
                            []),
                          '',
                        ]
                      )
                    }
                    className="text-xs text-accent hover:underline font-label"
                  >
                    + Add instruction
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-3 border-t border-border">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : modal === 'create' ? (
                  '+ Create Product'
                ) : (
                  'Save Changes'
                )}
              </button>

              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
