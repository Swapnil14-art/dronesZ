import React, { useState, useEffect } from 'react';
import { CategoryDto, CategoryRequest, fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

interface Props {
  token: string;
}

export const CategoryManagement: React.FC<Props> = ({ token }) => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

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
  }, [token]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories(token);
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
      setSuccessMsg(`Category "${deletingCategory.name}" deleted successfully`);
      closeModal();
      await loadCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete category');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink-primary)' }}>
            Category Management
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>
            Organize products into store categories
          </p>
        </div>
        <button onClick={openAddModal} className="btn-dronesz-primary">
          + Add New Category
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && <div className="success-banner">{successMsg}</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* Filter / Search Bar */}
      <div className="dronesz-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Search categories by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Categories Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
          Loading store categories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="dronesz-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
          No categories found. Click <strong>+ Add New Category</strong> to create one.
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td><strong>#{cat.id}</strong></td>
                  <td>
                    <span className="category-pill">{cat.name}</span>
                  </td>
                  <td style={{ color: 'var(--color-ink-muted)', maxWidth: '350px' }}>
                    {cat.description || <em style={{ color: '#9ca3af' }}>No description provided</em>}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="btn-dronesz-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingCategory(cat)}
                        className="btn-danger btn-sm"
                        style={{ padding: '0.4rem 0.8rem' }}
                      >
                        Delete
                      </button>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--color-ink-primary)' }}>
              {editingCategory ? `Edit Category #${editingCategory.id}` : 'Create New Category'}
            </h3>

            {formError && <div className="error-banner">{formError}</div>}

            <form onSubmit={handleSaveCategory}>
              <div className="input-group">
                <label className="input-label">Category Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Motors, Frames, Propellers"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="Enter a brief category description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={closeModal} className="btn-dronesz-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-dronesz-primary">
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#dc2626' }}>
              Confirm Category Deletion
            </h3>
            <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
              Are you sure you want to delete category <strong>"{deletingCategory.name}"</strong>? Categories with assigned products cannot be deleted.
            </p>

            {formError && <div className="error-banner">{formError}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={closeModal} className="btn-dronesz-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteCategory} disabled={submitting} className="btn-danger btn-sm" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
                {submitting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
