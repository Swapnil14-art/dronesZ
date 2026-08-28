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
  fetchCategories
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

  // Form state
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formProductType, setFormProductType] = useState<ProductType>('STANDALONE');
  const [formPrice, setFormPrice] = useState<string>('0');
  const [formQuantity, setFormQuantity] = useState<string>('0');
  const [formStatus, setFormStatus] = useState<ProductStatus>('AVAILABLE');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formImage, setFormImage] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

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
    setFormImage('');
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
    setFormImage(product.image || '');
    setFormError(null);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
    setFormError(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }

    // Rules validation
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
      image: formImage.trim() || undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct(token, editingProduct.id, payload);
        setSuccessMsg(`Product "${payload.name}" updated successfully`);
      } else {
        await createProduct(token, payload);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink-primary)' }}>
            Product Catalog & Hierarchy Management
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
            Manage STANDALONE, PARENT (Series), and CHILD (Variant) products with system validation
          </p>
        </div>
        <button onClick={openAddModal} className="btn-dronesz-primary">
          + Add New Product
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && <div className="success-banner">{successMsg}</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* Filter / Search Bar */}
      <div className="dronesz-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Search products by name or keyword..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ flex: '1 1 220px' }}
        />

        <select
          className="input-field"
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
          className="input-field"
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
          className="input-field"
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
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
          Loading product catalog...
        </div>
      ) : products.length === 0 ? (
        <div className="dronesz-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
          No products found matching your filter criteria.
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
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
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          background: p.productType === 'PARENT' ? '#6b21a8' : p.productType === 'CHILD' ? '#0369a1' : '#374151',
                          color: '#ffffff'
                        }}>
                          {p.productType}
                        </span>
                      </td>
                      <td>
                        {p.productType === 'CHILD' ? (
                          <span className="hierarchy-pill">
                            Parent: #{p.parentId} {parentProduct ? `(${parentProduct.name})` : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>None (Top Level)</span>
                        )}
                      </td>
                      <td>
                        {p.categoryName ? (
                          <span className="category-pill">{p.categoryName}</span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Uncategorized</span>
                        )}
                      </td>
                      <td>
                        {p.productType === 'PARENT' ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>N/A (Parent)</span>
                        ) : (
                          <strong style={{ color: 'var(--color-ink-primary)' }}>₹{p.price.toFixed(2)}</strong>
                        )}
                      </td>
                      <td>
                        {p.productType === 'PARENT' ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>N/A (Parent)</span>
                        ) : (
                          <span style={{
                            fontWeight: 600,
                            color: p.quantity === 0 ? '#dc2626' : p.quantity <= 5 ? '#d97706' : '#10b981'
                          }}>
                            {p.quantity} units
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${p.status}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            className="btn-dronesz-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="btn-danger btn-sm"
                            style={{ padding: '0.4rem 0.8rem' }}
                          >
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
              Showing {products.length} of {totalElements} product(s) (Page {page + 1} of {totalPages || 1})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="btn-dronesz-secondary btn-sm"
              >
                Previous Page
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-dronesz-secondary btn-sm"
              >
                Next Page
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--color-ink-primary)' }}>
              {editingProduct ? `Edit Product #${editingProduct.id}` : 'Create New Product'}
            </h3>

            {formError && <div className="error-banner">{formError}</div>}

            <form onSubmit={handleSaveProduct}>
              <div className="input-group">
                <label className="input-label">Product Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Motors Series or Motor 2207 1850KV"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>

              {/* Product Type Selector */}
              <div className="input-group">
                <label className="input-label">Product Type *</label>
                <select
                  className="input-field"
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
                <div className="input-group" style={{ background: 'rgba(3, 105, 161, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(3, 105, 161, 0.2)' }}>
                  <label className="input-label" style={{ color: '#0369a1', fontWeight: 700 }}>
                    Select Parent Product Series *
                  </label>
                  <select
                    className="input-field"
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
                  <div className="input-group">
                    <label className="input-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      placeholder="0.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Inventory Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="0"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Availability Status *</label>
                  <select
                    className="input-field"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="COMING_SOON">Coming Soon</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
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

              <div className="input-group">
                <label className="input-label">Image Asset URL (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. /assets/products/motor-2207.jpg"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="Enter detailed description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={closeModal} className="btn-dronesz-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-dronesz-primary">
                  {submitting ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#dc2626' }}>
              Confirm Product Deletion
            </h3>
            <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
              Are you sure you want to delete product <strong>"{deletingProduct.name}"</strong>? PARENT products with child variants cannot be deleted until child variants are reassigned or removed.
            </p>

            {formError && <div className="error-banner">{formError}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={closeModal} className="btn-dronesz-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteProduct} disabled={submitting} className="btn-danger btn-sm" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
                {submitting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
