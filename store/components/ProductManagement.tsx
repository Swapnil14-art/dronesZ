import React, { useState, useEffect } from 'react';
import {
  ProductDto,
  ProductRequest,
  ProductType,
  CategoryDto,
  ProductStatus,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  uploadOrReplaceProductImage,
  deleteProductImage,
  getProductImageUrl
} from '../services/api';

interface Props {
  token: string;
}

export const ProductManagement: React.FC<Props> = ({ token }) => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [parentProducts, setParentProducts] = useState<ProductDto[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);
  const [deletingImageProduct, setDeletingImageProduct] = useState<ProductDto | null>(null);

  // Form & Image upload state
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formProductType, setFormProductType] = useState<ProductType>('STANDALONE');
  const [formPrice, setFormPrice] = useState<string>('0');
  const [formQuantity, setFormQuantity] = useState<string>('0');
  const [formStatus, setFormStatus] = useState<ProductStatus>('AVAILABLE');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formParentId, setFormParentId] = useState<string>('');
  
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    name: string;
    type: string;
    originalSize: string;
    optimizedSize?: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Lock background body scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(isAddModalOpen || editingProduct || deletingProduct || deletingImageProduct);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddModalOpen, editingProduct, deletingProduct, deletingImageProduct]);

  useEffect(() => {
    loadCategoriesList();
  }, [token]);

  useEffect(() => {
    loadProductsList();
  }, [token, page, search, statusFilter, categoryFilter, typeFilter]);

  const loadCategoriesList = async () => {
    try {
      const catData = await fetchCategories(token);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadProductsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts(token, {
        page,
        size: 15,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        productType: typeFilter ? (typeFilter as ProductType) : undefined,
      });

      setProducts(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);

      // Load all candidate PARENT products
      const allParentsRes = await fetchProducts(token, { size: 100, productType: 'PARENT' });
      setParentProducts(allParentsRes.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load products list');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB limit
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > MAX_SIZE) {
      setFileError(`Selected file exceeds maximum allowed limit of 10 MB. File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setFileError(`Unsupported file format '${file.type}'. Allowed image formats are JPEG, PNG, WEBP, and GIF.`);
      return;
    }

    setFileError(null);
    setSelectedImageFile(file);

    const origSizeStr = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    // Client-side image optimization estimation (max 1600x1600 preserving aspect ratio)
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1600;

      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type.includes('png') ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (blob) {
            // Send the optimized File over HTTP!
            const optimizedFile = new File([blob], file.name, {
              type: blob.type || file.type,
              lastModified: Date.now(),
            });
            setSelectedImageFile(optimizedFile);

            const optSizeStr = blob.size >= 1024 * 1024
              ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
              : `${(blob.size / 1024).toFixed(1)} KB`;
            setImageInfo({
              name: file.name,
              type: file.type.split('/')[1]?.toUpperCase() || 'IMAGE',
              originalSize: origSizeStr,
              optimizedSize: optSizeStr,
            });
          }
        }, format, 0.85);
      }
    };
  };

  const clearSelectedImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(editingProduct?.image || null);
    setImageInfo(null);
    setFileError(null);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormProductType('STANDALONE');
    setFormPrice('0');
    setFormQuantity('0');
    setFormStatus('AVAILABLE');
    setFormCategoryId('');
    setFormParentId('');
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageInfo(null);
    setFileError(null);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: ProductDto) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormProductType(product.productType || 'STANDALONE');
    setFormPrice(product.price.toString());
    setFormQuantity(product.quantity.toString());
    setFormStatus(product.status);
    setFormCategoryId(product.categoryId ? product.categoryId.toString() : '');
    setFormParentId(product.parentId ? product.parentId.toString() : '');
    setSelectedImageFile(null);
    setImagePreviewUrl(product.image ? getProductImageUrl(product.image) : null);
    setImageInfo(null);
    setFileError(null);
    setFormError(null);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
    setDeletingImageProduct(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageInfo(null);
    setFileError(null);
    setFormError(null);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deletingImageProduct) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await deleteProductImage(token, deletingImageProduct.id);
      setSuccessMsg(`Image for product "${deletingImageProduct.name}" deleted successfully.`);
      closeModal();
      await loadProductsList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete product image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectImageReplace = async (product: ProductDto, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image size exceeds 10MB limit.');
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setError(`Unsupported format ${file.type}. Allowed: JPEG, PNG, WEBP, GIF.`);
      return;
    }

    setLoading(true);
    try {
      await uploadOrReplaceProductImage(token, product.id, file);
      setSuccessMsg(`Image for "${product.name}" replaced successfully.`);
      await loadProductsList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to replace image');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) {
      setFormError('Please fix file validation errors before saving.');
      return;
    }

    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }

    if (formProductType === 'STANDALONE' || formProductType === 'PARENT') {
      if (formParentId) {
        setFormError(`${formProductType} products cannot have a parent product.`);
        return;
      }
    }

    if (formProductType === 'CHILD') {
      if (!formParentId) {
        setFormError('CHILD products must select a valid PARENT product.');
        return;
      }
    }

    let priceNum = parseFloat(formPrice);
    let qtyNum = parseInt(formQuantity, 10);

    if (formProductType === 'PARENT') {
      priceNum = 0;
      qtyNum = 0;
    } else {
      if (isNaN(priceNum) || priceNum < 0) {
        setFormError('Valid non-negative price is required for ' + formProductType + ' products.');
        return;
      }
      if (isNaN(qtyNum) || qtyNum < 0) {
        setFormError('Valid non-negative quantity is required for ' + formProductType + ' products.');
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    const payload: ProductRequest = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      productType: formProductType,
      price: priceNum,
      quantity: qtyNum,
      status: formStatus,
      categoryId: formCategoryId ? Number(formCategoryId) : null,
      parentId: formProductType === 'CHILD' && formParentId ? Number(formParentId) : null,
    };

    try {
      let savedProduct: ProductDto;
      if (editingProduct) {
        savedProduct = await updateProduct(token, editingProduct.id, payload);
        if (selectedImageFile) {
          savedProduct = await uploadOrReplaceProductImage(token, editingProduct.id, selectedImageFile);
        }
        setSuccessMsg(`Product "${payload.name}" updated successfully`);
      } else {
        savedProduct = await createProduct(token, payload);
        if (selectedImageFile) {
          savedProduct = await uploadOrReplaceProductImage(token, savedProduct.id, selectedImageFile);
        }
        setSuccessMsg(`Product "${payload.name}" created successfully`);
      }
      closeModal();
      await loadProductsList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    setFormError(null);

    try {
      await deleteProduct(token, deletingProduct.id);
      setSuccessMsg(`Product "${deletingProduct.name}" deleted successfully`);
      closeModal();
      await loadProductsList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            CATALOG MANAGEMENT
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            3-Tier Multirotor Products
          </h1>
        </div>
        <button onClick={openAddModal} className="btn-stitch-primary">
          + Add New Product
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div style={{ background: '#e6f4ea', border: '1px solid #a7f3d0', color: 'var(--color-tertiary)', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="stitch-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="stitch-input"
          placeholder="Search products by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ flex: '1 1 220px' }}
        />

        <select
          className="stitch-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          style={{ width: '180px' }}
        >
          <option value="">All Product Types</option>
          <option value="STANDALONE">STANDALONE</option>
          <option value="PARENT">PARENT (Series)</option>
          <option value="CHILD">CHILD (Variant)</option>
        </select>

        <select
          className="stitch-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          style={{ width: '160px' }}
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="COMING_SOON">Coming Soon</option>
        </select>

        <select
          className="stitch-select"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
          style={{ width: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Data Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading product catalog...
        </div>
      ) : products.length === 0 ? (
        <div className="stitch-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          No products found matching your filter criteria.
        </div>
      ) : (
        <>
          <div className="stitch-table-wrapper">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Product Type</th>
                  <th>Hierarchy / Parent</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Qty</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const parentProduct = parentProducts.find((cp) => cp.id === p.parentId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {p.image ? (
                            <img
                              src={getProductImageUrl(p.image)!}
                              alt={p.name}
                              style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '0.375rem', border: '1px solid var(--color-outline)', background: '#f8fafc', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '0.375rem', border: '1px dashed #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                              🛸
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{p.name}</div>
                            {p.description && (
                              <div style={{ fontSize: '12px', color: 'var(--color-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={p.productType === 'PARENT' ? 'badge-parent' : p.productType === 'CHILD' ? 'badge-category' : 'badge-category'}
                          style={{
                            background: p.productType === 'PARENT' ? '#f3e8ff' : p.productType === 'CHILD' ? '#e0f2fe' : '#f1f5f9',
                            color: p.productType === 'PARENT' ? '#6b21a8' : p.productType === 'CHILD' ? '#0369a1' : '#334155',
                          }}
                        >
                          {p.productType}
                        </span>
                      </td>
                      <td>
                        {p.productType === 'CHILD' ? (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0369a1' }}>
                            Parent: #{p.parentId} {parentProduct ? `(${parentProduct.name})` : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Top Level</span>
                        )}
                      </td>
                      <td>
                        {p.categoryName ? (
                          <span className="badge-category">{p.categoryName}</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Uncategorized</span>
                        )}
                      </td>
                      <td>
                        {p.productType === 'PARENT' ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>N/A (Parent)</span>
                        ) : (
                          <strong style={{ color: 'var(--color-on-surface)' }}>₹{p.price.toFixed(2)}</strong>
                        )}
                      </td>
                      <td>
                        {p.productType === 'PARENT' ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontStyle: 'italic' }}>N/A (Parent)</span>
                        ) : (
                          <span style={{
                            fontWeight: 700,
                            color: p.quantity === 0 ? 'var(--color-error)' : p.quantity <= 5 ? 'var(--color-amber)' : 'var(--color-tertiary)'
                          }}>
                            {p.quantity} units
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={p.status === 'AVAILABLE' ? 'badge-tertiary' : p.status === 'OUT_OF_STOCK' ? 'badge-error' : 'badge-amber'}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <label className="btn-stitch-ghost" style={{ padding: '0.35rem 0.65rem', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                            Replace Image
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleDirectImageReplace(p, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {p.image && (
                            <button
                              onClick={() => setDeletingImageProduct(p)}
                              className="btn-stitch-ghost"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '12px', color: 'var(--color-error)' }}
                            >
                              Delete Image
                            </button>
                          )}
                          <button onClick={() => openEditModal(p)} className="btn-stitch-ghost" style={{ padding: '0.35rem 0.65rem', fontSize: '12px' }}>
                            Edit
                          </button>
                          <button onClick={() => setDeletingProduct(p)} className="btn-stitch-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '12px' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              Showing {products.length} of {totalElements} product(s) (Page {page + 1} of {totalPages || 1})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="btn-stitch-ghost"
              >
                Previous Page
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-stitch-ghost"
              >
                Next Page
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="modal-overlay" onClick={closeModal} style={{ overscrollBehavior: 'contain', touchAction: 'none' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '640px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              overscrollBehavior: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header */}
            <div style={{ padding: '1.5rem 2rem 1rem 2rem', borderBottom: '1px solid var(--color-outline)', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
                {editingProduct ? `Edit Product #${editingProduct.id}` : 'Create New Product'}
              </h3>

              {formError && (
                <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginTop: '1rem', fontSize: '13px' }}>
                  {formError}
                </div>
              )}
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSaveProduct}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem 2rem',
                gap: '1rem',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="stitch-form-group">
                <label className="stitch-label">Product Name *</label>
                <input
                  type="text"
                  className="stitch-input"
                  placeholder="e.g. Motors Series or Motor 2207 1850KV"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>

              {/* Product Type Selector */}
              <div className="stitch-form-group">
                <label className="stitch-label">Product Type *</label>
                <select
                  className="stitch-select"
                  value={formProductType}
                  onChange={(e) => {
                    const newType = e.target.value as ProductType;
                    setFormProductType(newType);
                    if (newType !== 'CHILD') {
                      setFormParentId('');
                    }
                  }}
                >
                  <option value="STANDALONE">STANDALONE (Independent Product)</option>
                  <option value="PARENT">PARENT (Product Series / Category Header)</option>
                  <option value="CHILD">CHILD (Variant belonging to PARENT)</option>
                </select>
              </div>

              {/* Rules: CHILD requires PARENT selection */}
              {formProductType === 'CHILD' && (
                <div className="stitch-form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #bae6fd' }}>
                  <label className="stitch-label" style={{ color: '#0369a1' }}>
                    Select Parent Product Series *
                  </label>
                  <select
                    className="stitch-select"
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Parent Series --</option>
                    {parentProducts
                      .filter((p) => !editingProduct || p.id !== editingProduct.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.id}: {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Rules: PARENT products do not have price/quantity */}
              {formProductType !== 'PARENT' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="stitch-form-group">
                    <label className="stitch-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="stitch-input"
                      placeholder="0.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="stitch-form-group">
                    <label className="stitch-label">Inventory Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      className="stitch-input"
                      placeholder="0"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="stitch-form-group">
                  <label className="stitch-label">Availability Status *</label>
                  <select
                    className="stitch-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="COMING_SOON">Coming Soon</option>
                  </select>
                </div>

                <div className="stitch-form-group">
                  <label className="stitch-label">Category</label>
                  <select
                    className="stitch-select"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                  >
                    <option value="">None (Uncategorized)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Product Image Section */}
              <div className="stitch-form-group" style={{ background: 'var(--color-surface-container-low, #f8fafc)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline, rgba(15, 23, 42, 0.08))' }}>
                <label className="stitch-label" style={{ marginBottom: '0.25rem' }}>Upload Product Image</label>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
                  Supported: JPEG, PNG, WEBP, GIF (Max limit: 10 MB. Auto-optimized to max 1600×1600 resolution).
                </p>

                {fileError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '12px' }}>
                    {fileError}
                  </div>
                )}

                {imagePreviewUrl ? (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#ffffff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-outline)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '0.375rem', overflow: 'hidden', border: '1px solid var(--color-outline)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <img src={imagePreviewUrl} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, fontSize: '13px' }}>
                      {imageInfo ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-on-surface)', wordBreak: 'break-all' }}>{imageInfo.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                            Format: <strong>{imageInfo.type}</strong> | Original: <strong>{imageInfo.originalSize}</strong>
                            {imageInfo.optimizedSize && (
                              <span style={{ color: 'var(--color-tertiary)', marginLeft: '0.35rem', fontWeight: 600 }}>
                                ➔ Optimized: ~{imageInfo.optimizedSize}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--color-muted)' }}>Current saved primary image from database</div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <label className="btn-stitch-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                          Replace File
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileSelect(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="btn-stitch-ghost"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '11px', color: 'var(--color-error)' }}
                        >
                          Remove Selection
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      className="btn-stitch-ghost"
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.25rem',
                        border: '2px dashed var(--color-outline)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: '#ffffff'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                        cloud_upload
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                        Click to choose product image file
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                        JPEG, PNG, WEBP or GIF up to 10 MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="stitch-form-group">
                <label className="stitch-label">Description (Optional)</label>
                <textarea
                  className="stitch-textarea"
                  rows={3}
                  placeholder="Enter detailed description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Fixed Modal Footer Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--color-outline)',
                  flexShrink: 0
                }}
              >
                <button type="button" onClick={closeModal} className="btn-stitch-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-stitch-primary">
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={closeModal} style={{ overscrollBehavior: 'contain', touchAction: 'none' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ overscrollBehavior: 'contain', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-error)' }}>
              Confirm Product Deletion
            </h3>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to delete product <strong>"{deletingProduct.name}"</strong>?
            </p>

            {formError && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" onClick={closeModal} className="btn-stitch-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteProduct} disabled={submitting} className="btn-stitch-danger">
                {submitting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation Modal */}
      {deletingImageProduct && (
        <div className="modal-overlay" onClick={closeModal} style={{ overscrollBehavior: 'contain', touchAction: 'none' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ overscrollBehavior: 'contain', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-error)' }}>
              Confirm Image Deletion
            </h3>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete the image for product <strong>"{deletingImageProduct.name}"</strong>? This action will remove the binary data from the database and cannot be undone.
            </p>

            {formError && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" onClick={closeModal} className="btn-stitch-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDeleteImage} disabled={submitting} className="btn-stitch-danger">
                {submitting ? 'Deleting Image...' : 'Delete Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
