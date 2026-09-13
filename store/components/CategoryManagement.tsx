import React, { useState, useEffect } from 'react';
import { CategoryDto, CategoryRequest, fetchCategories, createCategory, updateCategory, deleteCategory, restoreCategory } from '../services/api';

interface Props {
  token: string;
}

export const CategoryManagement: React.FC<Props> = ({ token }) => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDto | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadCategories();
  }, [token, includeDeleted]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories(token, includeDeleted);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormName('');
    setFormDescription('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormError(null);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingCategory(null);
    setDeletingCategory(null);
    setFormError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: CategoryRequest = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    };

    try {
      if (editingCategory) {
        await updateCategory(token, editingCategory.id, payload);
        setSuccessMsg(`Category "${payload.name}" updated successfully`);
      } else {
        await createCategory(token, payload);
        setSuccessMsg(`Category "${payload.name}" created successfully`);
      }
      closeModal();
      await loadCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setSubmitting(true);
    setFormError(null);

    try {
      await deleteCategory(token, deletingCategory.id);
      setSuccessMsg(`Category "${deletingCategory.name}" deactivated successfully`);
      closeModal();
      await loadCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to deactivate category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreCategory = async (cat: CategoryDto) => {
    setSubmitting(true);
    setError(null);
    try {
      await restoreCategory(token, cat.id);
      setSuccessMsg(`Category "${cat.name}" restored successfully`);
      await loadCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to restore category');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Top Action & Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            TAXONOMY MANAGEMENT
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            Store Categories
          </h1>
        </div>
        <button onClick={openAddModal} className="btn-stitch-primary">
          + Add New Category
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
      <div className="stitch-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <input
          type="text"
          className="stitch-input"
          placeholder="Search categories by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', cursor: 'pointer', userSelect: 'none', color: 'var(--color-on-surface)' }}>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          />
          Show Deactivated Categories
        </label>
      </div>

      {/* Categories Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading store categories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="stitch-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          No categories found. Click <strong>+ Add New Category</strong> to create one.
        </div>
      ) : (
        <div className="stitch-table-wrapper">
          <table className="stitch-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Description</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id} style={{ opacity: cat.isDeleted ? 0.75 : 1 }}>
                  <td><strong>#{cat.id}</strong></td>
                  <td>
                    <span className="badge-category">{cat.name}</span>
                  </td>
                  <td>
                    {cat.isDeleted ? (
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                        DEACTIVATED
                      </span>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-muted)', maxWidth: '350px' }}>
                    {cat.description || <em style={{ color: '#9ca3af' }}>No description provided</em>}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      {!cat.isDeleted ? (
                        <>
                          <button onClick={() => openEditModal(cat)} className="btn-stitch-ghost" style={{ padding: '0.35rem 0.65rem', fontSize: '12px' }}>
                            Edit
                          </button>
                          <button onClick={() => setDeletingCategory(cat)} className="btn-stitch-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '12px' }}>
                            Deactivate
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestoreCategory(cat)}
                          disabled={submitting}
                          className="btn-stitch-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '12px', background: '#059669', borderColor: '#059669' }}
                        >
                          ↺ Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCategory) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-on-surface)' }}>
              {editingCategory ? `Edit Category #${editingCategory.id}` : 'Create New Category'}
            </h3>

            {formError && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="stitch-form-group">
                <label className="stitch-label">Category Name *</label>
                <input
                  type="text"
                  className="stitch-input"
                  placeholder="e.g. Motors, Frames, Propellers"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="stitch-form-group">
                <label className="stitch-label">Description (Optional)</label>
                <textarea
                  className="stitch-textarea"
                  rows={3}
                  placeholder="Enter a brief category description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={closeModal} className="btn-stitch-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-stitch-primary">
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Confirmation Modal */}
      {deletingCategory && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-error)' }}>
              Deactivate Category
            </h3>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem', fontSize: '14px', lineHeight: 1.5 }}>
              Are you sure you want to deactivate category <strong>"{deletingCategory.name}"</strong>? It will be hidden from the storefront, but existing products will retain their category link and can be restored anytime.
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
              <button type="button" onClick={handleDeleteCategory} disabled={submitting} className="btn-stitch-danger">
                {submitting ? 'Deactivating...' : 'Deactivate Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

