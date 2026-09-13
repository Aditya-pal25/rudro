import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ImageUploader = ({
  value = '',
  onChange,
  multiple = false,
  maxFiles = 5,
}) => {
  const inputRef = useRef(null);

  const [preview, setPreview] = useState(() => {
    if (!value) return multiple ? [] : '';
    return value;
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setPreview(value);
    }
  }, [value]);

  const uploadFiles = async (files) => {
    if (!files.length) return;

    const validFiles = [];

    for (const file of files) {
      if (!file.type || !file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) return;

    if (multiple) {
      const current = Array.isArray(preview) ? preview : [];
      const remaining = maxFiles - current.length;

      if (remaining <= 0) {
        toast.error(`Maximum ${maxFiles} images allowed`);
        return;
      }

      validFiles.splice(remaining);
    }

    const formData = new FormData();

    validFiles.forEach((file) => {
      formData.append('images', file);
    });

    setUploading(true);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedImages = response.data?.images || [];

      if (!uploadedImages.length) {
        throw new Error('No images returned from server');
      }

      if (multiple) {
        const current = Array.isArray(preview) ? preview : [];
        const updated = [...current, ...uploadedImages];

        setPreview(updated);

        if (onChange) {
          onChange(updated);
        }
      } else {
        const image = uploadedImages[0];

        setPreview(image);

        if (onChange) {
          onChange(image);
        }
      }

      toast.success(
        uploadedImages.length === 1
          ? 'Image uploaded successfully'
          : `${uploadedImages.length} images uploaded successfully`
      );
    } catch (error) {
      console.error('Image upload error:', error);

      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Image upload failed'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    await uploadFiles(files);

    event.target.value = '';
  };

  const removeImage = async (index) => {
    const item = multiple
      ? Array.isArray(preview)
        ? preview[index]
        : null
      : preview;

    if (!item) return;

    try {
      if (item.publicId) {
        await api.delete('/upload', {
          data: {
            publicId: item.publicId,
          },
        });
      }
    } catch (error) {
      console.error('Image delete error:', error);
      // Don't block UI removal if Cloudinary deletion fails.
    }

    if (multiple) {
      const current = Array.isArray(preview) ? preview : [];
      const updated = current.filter((_, i) => i !== index);

      setPreview(updated);

      if (onChange) {
        onChange(updated);
      }
    } else {
      setPreview('');

      if (onChange) {
        onChange('');
      }
    }
  };

  const getPreviewUrl = (item) => {
    if (!item) return '';

    if (typeof item === 'string') {
      return item;
    }

    return item.url || '';
  };

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={uploading}
        onClick={() => {
          if (!uploading && inputRef.current) {
            inputRef.current.click();
          }
        }}
        className="w-full rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 px-6 py-8 text-center transition hover:border-red-500 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            {uploading ? (
              <svg
                className="h-6 w-6 animate-spin text-red-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400"
              >
                <path d="M12 16V4" />
                <path d="M7 9l5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            )}
          </div>

          <span className="text-sm font-medium text-gray-200">
            {uploading
              ? 'Uploading to Cloudinary...'
              : `Click to upload image${multiple ? 's' : ''}`}
          </span>

          <span className="text-xs text-gray-500">
            JPG, PNG, WEBP - Maximum 5MB
          </span>

          {multiple && (
            <span className="text-xs text-gray-500">
              Maximum {maxFiles} images
            </span>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={handleFiles}
        className="hidden"
      />

      {!multiple && preview && (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <img
            src={getPreviewUrl(preview)}
            alt={preview.alt || 'Product preview'}
            className="h-64 w-full object-contain"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => removeImage()}
            className="absolute right-3 top-3 rounded-lg bg-black/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      {multiple &&
        Array.isArray(preview) &&
        preview.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {preview.map((item, index) => (
              <div
                key={item.publicId || item.url || index}
                className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900"
              >
                <img
                  src={getPreviewUrl(item)}
                  alt={item.alt || 'Product preview'}
                  className="h-40 w-full object-cover"
                />

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default ImageUploader;
