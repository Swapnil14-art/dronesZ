import React, { useState, useEffect, useRef } from 'react';
import {
  ProductDto,
  ProductRequest,
  ProductType,
  CategoryDto,
  ProductStatus,
  ProductContentSectionType,
  ProductContentSectionRequest,
  ProductImageDto,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  uploadMultipleProductImages,
  fetchProductImages,
  setPrimaryProductImage,
  reorderProductImages,
  replaceProductImage,
  deleteSpecificProductImage,
  uploadOrReplaceProductImage,
  deleteProductImage,
  getProductImageUrl,
  fetchProductContentSections,
  getEffectiveProductStatus
} from '../services/api';
import { RichTextEditor } from './RichTextEditor';
import { TableEditor } from './TableEditor';

interface Props {
  token: string;
}

const CloudUploadIcon: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 32,
  color = 'var(--color-primary, #e52b31)',
  style = {},
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', ...style }}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formProductType, setFormProductType] = useState<ProductType>('PARENT');
  const [formPrice, setFormPrice] = useState<string>('0');
  const [formQuantity, setFormQuantity] = useState<string>('0');
  const [formStatus, setFormStatus] = useState<ProductStatus>('AVAILABLE');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formParentId, setFormParentId] = useState<string>('');

  // Dynamic Delivery / Warranty / Grade / Tax fields
  const [formDispatchTime, setFormDispatchTime] = useState<string>('24-48 Hours');
  const [formWarranty, setFormWarranty] = useState<string>('1-Yr Factory');
  const [formGrade, setFormGrade] = useState<string>('Aero Precision');
  const [formTaxInclusive, setFormTaxInclusive] = useState<boolean>(true);
  const [formTaxNote, setFormTaxNote] = useState<string>('GST & Taxes Included');

  // Dynamic Content Boxes State
  const [formContentSections, setFormContentSections] = useState<ProductContentSectionRequest[]>([]);
  const [showAddBoxMenu, setShowAddBoxMenu] = useState<boolean>(false);

  // Image Upload & Gallery State
  interface FormImageItem {
    id?: number;
    file?: File;
    previewUrl: string;
    fileName?: string;
    fileSizeStr?: string;
    isPrimary: boolean;
    displayOrder: number;
    isReplaced?: boolean;
  }

  const [formImages, setFormImages] = useState<FormImageItem[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active Tab in Large Modal
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'boxes'>('details');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock background scroll completely when modal is open
  useEffect(() => {
    const isModalOpen = isAddModalOpen || editingProduct !== null || deletingProduct !== null;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isAddModalOpen, editingProduct, deletingProduct]);

  useEffect(() => {
    loadCategories();
    loadParentProducts();
  }, [token]);

  useEffect(() => {
    loadProductsList();
  }, [token, page, search, statusFilter, categoryFilter, typeFilter]);

  const loadCategories = async () => {
    try {
      const res = await fetchCategories(token);
      setCategories(res);
    } catch (err: any) {
      console.error('Failed to load categories', err);
    }
  };

  const loadParentProducts = async () => {
    try {
      const res = await fetchProducts(token, { productType: 'PARENT', size: 100 });
      setParentProducts(res.content);
    } catch (err: any) {
      console.error('Failed to load parent products', err);
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
        categoryId: categoryFilter || undefined,
        productType: (typeFilter as ProductType) || undefined,
      });
      setProducts(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImageFile = (file: File): Promise<{ optimizedFile: File; previewUrl: string; sizeStr: string }> => {
    return new Promise((resolve) => {
      const origSizeStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const previewUrl = URL.createObjectURL(file);
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
        if (!ctx) {
          resolve({ optimizedFile: file, previewUrl, sizeStr: origSizeStr });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const format = file.type.includes('png') ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: blob.type || file.type,
              lastModified: Date.now(),
            });
            const optSizeStr = blob.size >= 1024 * 1024
              ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
              : `${(blob.size / 1024).toFixed(1)} KB`;
            resolve({ optimizedFile, previewUrl: URL.createObjectURL(optimizedFile), sizeStr: optSizeStr });
          } else {
            resolve({ optimizedFile: file, previewUrl, sizeStr: origSizeStr });
          }
        }, format, 0.85);
      };
      img.onerror = () => {
        resolve({ optimizedFile: file, previewUrl, sizeStr: origSizeStr });
      };
    });
  };

  const handleAddMultipleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_SIZE) {
        setFileError(`File "${file.name}" exceeds maximum limit of 10 MB.`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        setFileError(`File "${file.name}" has unsupported format.`);
        return;
      }
      validFiles.push(file);
    }

    setFileError(null);

    const newItems: FormImageItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const { optimizedFile, previewUrl, sizeStr } = await optimizeImageFile(validFiles[i]);
      newItems.push({
        file: optimizedFile,
        previewUrl,
        fileName: optimizedFile.name,
        fileSizeStr: sizeStr,
        isPrimary: formImages.length === 0 && i === 0,
        displayOrder: formImages.length + i,
      });
    }

    setFormImages((prev) => {
      const combined = [...prev, ...newItems];
      if (combined.length > 0 && !combined.some((img) => img.isPrimary)) {
        combined[0].isPrimary = true;
      }
      return combined.map((img, idx) => ({ ...img, displayOrder: idx }));
    });

    e.target.value = '';
  };

  const handleSetPrimaryImage = (index: number) => {
    setFormImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    );
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === formImages.length - 1) return;

    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    setFormImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next.map((img, idx) => ({ ...img, displayOrder: idx }));
    });
  };

  const triggerReplaceImage = (index: number) => {
    setReplacingImageIndex(index);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  };

  const handleFileReplaced = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingImageIndex === null) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > MAX_SIZE) {
      setFileError(`File "${file.name}" exceeds limit of 10 MB.`);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setFileError(`File "${file.name}" has unsupported format.`);
      return;
    }

    setFileError(null);
    const { optimizedFile, previewUrl, sizeStr } = await optimizeImageFile(file);

    setFormImages((prev) => {
      const next = [...prev];
      if (replacingImageIndex < next.length) {
        next[replacingImageIndex] = {
          ...next[replacingImageIndex],
          file: optimizedFile,
          previewUrl,
          fileName: optimizedFile.name,
          fileSizeStr: sizeStr,
          isReplaced: true,
        };
      }
      return next;
    });

    setReplacingImageIndex(null);
  };

  const handleDeleteImage = (index: number) => {
    const itemToDelete = formImages[index];
    if (itemToDelete.id) {
      setDeletedImageIds((prev) => [...prev, itemToDelete.id!]);
    }
    setFormImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered.map((img, idx) => ({ ...img, displayOrder: idx }));
    });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormProductType('PARENT');
    setFormPrice('0');
    setFormQuantity('0');
    setFormStatus('AVAILABLE');
    setFormCategoryId('');
    setFormParentId('');
    setFormDispatchTime('24-48 Hours');
    setFormWarranty('1-Yr Factory');
    setFormGrade('Aero Precision');
    setFormTaxInclusive(true);
    setFormTaxNote('GST & Taxes Included');
    setFormContentSections([]);
    setShowAddBoxMenu(false);
    setFormImages([]);
    setDeletedImageIds([]);
    setFileError(null);
    setFormError(null);
    setActiveModalTab('details');
    setIsAddModalOpen(true);
  };

  const openEditModal = async (product: ProductDto) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormProductType(product.productType === 'CHILD' ? 'CHILD' : 'PARENT');
    setFormPrice(product.price.toString());
    setFormQuantity(product.quantity.toString());
    setFormStatus(product.status);
    setFormCategoryId(product.categoryId ? product.categoryId.toString() : '');
    setFormParentId(product.parentId ? product.parentId.toString() : '');
    setFormDispatchTime(product.dispatchTime || '24-48 Hours');
    setFormWarranty(product.warranty || '1-Yr Factory');
    setFormGrade(product.grade || 'Aero Precision');
    setFormTaxInclusive(product.taxInclusive !== undefined ? product.taxInclusive : true);
    setFormTaxNote(product.taxNote || 'GST & Taxes Included');
    setDeletedImageIds([]);

    // Populate images directly from backend API
    try {
      const images = await fetchProductImages(product.id, token);
      if (images && images.length > 0) {
        setFormImages(
          images.map((img, idx) => ({
            id: img.id,
            previewUrl: getProductImageUrl(img.url) || img.url,
            fileName: img.fileName,
            fileSizeStr: img.fileSize ? `${(img.fileSize / 1024).toFixed(1)} KB` : undefined,
            isPrimary: Boolean(img.isPrimary),
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
          }))
        );
      } else if (product.images && product.images.length > 0) {
        setFormImages(
          product.images.map((img, idx) => ({
            id: img.id,
            previewUrl: getProductImageUrl(img.url) || img.url,
            fileName: img.fileName,
            fileSizeStr: img.fileSize ? `${(img.fileSize / 1024).toFixed(1)} KB` : undefined,
            isPrimary: Boolean(img.isPrimary),
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
          }))
        );
      } else if (product.image) {
        setFormImages([
          {
            previewUrl: getProductImageUrl(product.image) || product.image,
            isPrimary: true,
            displayOrder: 0,
          },
        ]);
      } else {
        setFormImages([]);
      }
    } catch (e) {
      if (product.images && product.images.length > 0) {
        setFormImages(
          product.images.map((img, idx) => ({
            id: img.id,
            previewUrl: getProductImageUrl(img.url) || img.url,
            fileName: img.fileName,
            fileSizeStr: img.fileSize ? `${(img.fileSize / 1024).toFixed(1)} KB` : undefined,
            isPrimary: Boolean(img.isPrimary),
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
          }))
        );
      } else if (product.image) {
        setFormImages([
          {
            previewUrl: getProductImageUrl(product.image) || product.image,
            isPrimary: true,
            displayOrder: 0,
          },
        ]);
      } else {
        setFormImages([]);
      }
    }

    if (product.contentSections && product.contentSections.length > 0) {
      setFormContentSections(product.contentSections.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        content: s.content,
        displayOrder: s.displayOrder,
        enabled: s.enabled,
      })));
    } else {
      try {
        const sections = await fetchProductContentSections(token, product.id);
        setFormContentSections(sections.map(s => ({
          id: s.id,
          title: s.title,
          type: s.type,
          content: s.content,
          displayOrder: s.displayOrder,
          enabled: s.enabled,
        })));
      } catch (e) {
        setFormContentSections([]);
      }
    }

    setShowAddBoxMenu(false);
    setFileError(null);
    setFormError(null);
    setActiveModalTab('details');
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setDeletingProduct(null);
    setShowAddBoxMenu(false);
    formImages.forEach((img) => {
      if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setFormImages([]);
    setDeletedImageIds([]);
    setFileError(null);
    setFormError(null);
  };

  // Content Box Operations
  const handleAddBox = (type: ProductContentSectionType) => {
    const nextOrder = formContentSections.length;
    let initialContent = '';
    let initialTitle = '';

    if (type === 'WORD') {
      initialTitle = 'Product Overview & Highlights';
      initialContent = '<p>Detailed product overview with high performance specifications.</p><ul><li>Premium carbon composite material</li><li>Tested up to 35,000 RPM</li><li>Factory dynamic balanced</li></ul>';
    } else {
      initialTitle = 'Technical Specifications Table';
      initialContent = JSON.stringify({
        headers: ['Specification / Parameter', 'Standard Value', 'Tolerance / Notes'],
        rows: [
          ['Motor KV Rating', '1850 KV', '+/- 3% rated speed'],
          ['Configuration', '12N14P', 'Precision wound core'],
          ['Shaft Diameter', '5.0 mm', 'Titanium alloy core'],
          ['Idle Current (10V)', '1.2 A', 'Low friction bearings'],
          ['Max Continuous Power', '920 W (60s)', 'Active cooling design']
        ]
      });
    }

    const newBox: ProductContentSectionRequest = {
      title: initialTitle,
      type,
      content: initialContent,
      displayOrder: nextOrder,
      enabled: true,
    };

    setFormContentSections([...formContentSections, newBox]);
    setShowAddBoxMenu(false);
  };

  const handleUpdateBox = (index: number, updatedFields: Partial<ProductContentSectionRequest>) => {
    const next = [...formContentSections];
    next[index] = { ...next[index], ...updatedFields };
    setFormContentSections(next);
  };

  const handleDeleteBox = (index: number) => {
    const next = formContentSections.filter((_, idx) => idx !== index).map((box, idx) => ({
      ...box,
      displayOrder: idx
    }));
    setFormContentSections(next);
  };

  const handleMoveBox = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formContentSections.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...formContentSections];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    const reindexed = next.map((box, idx) => ({
      ...box,
      displayOrder: idx
    }));
    setFormContentSections(reindexed);
  };

  const handleToggleBox = (index: number) => {
    const current = formContentSections[index];
    handleUpdateBox(index, { enabled: !current.enabled });
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

    if (formProductType === 'PARENT') {
      if (formParentId) {
        setFormError('PARENT product series cannot have a parent product.');
        return;
      }
    }

    if (formProductType === 'CHILD') {
      if (!formParentId) {
        setFormError('CHILD product variants must select a valid PARENT product series.');
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
        setFormError('Valid non-negative price is required for CHILD product variants.');
        return;
      }
      if (isNaN(qtyNum) || qtyNum < 0) {
        setFormError('Valid non-negative quantity is required for CHILD product variants.');
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
      dispatchTime: formDispatchTime.trim() || '24-48 Hours',
      warranty: formWarranty.trim() || '1-Yr Factory',
      grade: formGrade.trim() || 'Aero Precision',
      taxInclusive: formTaxInclusive,
      taxNote: formTaxNote.trim() || 'GST & Taxes Included',
      contentSections: formContentSections.map((s, idx) => ({
        id: s.id,
        title: s.title.trim() || (s.type === 'WORD' ? 'Content Section' : 'Specification Matrix'),
        type: s.type,
        content: s.content || '',
        displayOrder: idx,
        enabled: s.enabled !== false,
      })),
    };

    try {
      if (editingProduct) {
        await updateProduct(token, editingProduct.id, payload);

        // 1. Delete removed images permanently
        for (const delId of deletedImageIds) {
          try {
            await deleteSpecificProductImage(token, editingProduct.id, delId);
          } catch (e) {
            console.error('Delete image error', e);
          }
        }

        // 2. Replace modified existing images
        for (const img of formImages) {
          if (img.id && img.isReplaced && img.file) {
            try {
              await replaceProductImage(token, editingProduct.id, img.id, img.file);
            } catch (e) {
              console.error('Replace image error', e);
            }
          }
        }

        // 3. Upload new images
        const newImgs = formImages.filter((img) => !img.id && img.file);
        let uploadedList: ProductImageDto[] = [];
        if (newImgs.length > 0) {
          try {
            uploadedList = await uploadMultipleProductImages(
              token,
              editingProduct.id,
              newImgs.map((img) => img.file!)
            );
          } catch (e) {
            console.error('Upload new images error', e);
          }
        }

        // 4. Synchronize display order and primary image exactly as ordered in the form
        try {
          let uploadIdx = 0;
          const finalOrderedIds: number[] = [];
          let primaryImageId: number | null = null;

          for (const formImg of formImages) {
            let resolvedId: number | undefined = formImg.id;
            if (!resolvedId && uploadedList && uploadIdx < uploadedList.length) {
              resolvedId = uploadedList[uploadIdx].id;
              uploadIdx++;
            }
            if (resolvedId) {
              finalOrderedIds.push(resolvedId);
              if (formImg.isPrimary) {
                primaryImageId = resolvedId;
              }
            }
          }

          if (finalOrderedIds.length > 0) {
            await reorderProductImages(token, editingProduct.id, finalOrderedIds);
          }
          if (primaryImageId) {
            await setPrimaryProductImage(token, editingProduct.id, primaryImageId);
          }
        } catch (e) {
          console.error('Failed to sync primary/order', e);
        }

        setSuccessMsg(`Product "${payload.name}" updated successfully.`);
      } else {
        const newProduct = await createProduct(token, payload);

        const filesToUpload = formImages.filter((img) => img.file).map((img) => img.file!);
        if (filesToUpload.length > 0) {
          try {
            const uploaded = await uploadMultipleProductImages(token, newProduct.id, filesToUpload);
            const primaryIdx = formImages.findIndex((img) => img.isPrimary);
            if (primaryIdx >= 0 && primaryIdx < uploaded.length) {
              await setPrimaryProductImage(token, newProduct.id, uploaded[primaryIdx].id);
            }
          } catch (e) {
            console.error('Failed to upload images for new product', e);
          }
        }

        setSuccessMsg(`Product "${payload.name}" created successfully.`);
      }
      closeModal();
      await loadProductsList();
      await loadParentProducts();
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
      setSuccessMsg(`Product "${deletingProduct.name}" deleted successfully.`);
      closeModal();
      await loadProductsList();
      await loadParentProducts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            CATALOG MANAGEMENT &amp; CONTENT CMS
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            Product Series &amp; Model Variants
          </h1>
        </div>
        <button onClick={openAddModal} className="btn-stitch-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
          + Add New Product
        </button>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div style={{ background: '#e6f4ea', border: '1px solid #a7f3d0', color: 'var(--color-tertiary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          ✕ {error}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="stitch-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="stitch-input"
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          style={{ flex: '1 1 250px' }}
        />

        <select
          className="stitch-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          style={{ width: '190px' }}
        >
          <option value="">All Product Types</option>
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
          style={{ width: '170px' }}
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

      {/* Products Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading products catalog...
        </div>
      ) : products.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', padding: '4rem', textAlign: 'center', color: 'var(--color-muted)', borderRadius: '0.5rem' }}>
          No products found matching the criteria.
        </div>
      ) : (
        <>
          <div className="stitch-table-container">
            <table className="stitch-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '64px' }}>Image</th>
                  <th>Product Details</th>
                  <th>Type &amp; Hierarchy</th>
                  <th>Category</th>
                  <th>Price &amp; Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--color-muted)', fontWeight: 600 }}>#{p.id}</td>
                    <td>
                      <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--color-outline)' }}>
                        {(() => {
                          const thumb = p.image || p.primaryImage?.url || (p.images && p.images.length > 0 ? p.images[0].url : null);
                          return thumb ? (
                            <img src={getProductImageUrl(thumb) || ''} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>N/A</span>
                          );
                        })()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-on-surface)', fontSize: '15px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                        <span>⏱ {p.dispatchTime || '24-48 Hours'}</span>
                        <span>🛡 {p.warranty || '1-Yr Factory'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-type badge-type-${p.productType?.toLowerCase() === 'child' ? 'child' : 'parent'}`}>
                        {p.productType === 'CHILD' ? 'CHILD VARIANT' : 'PARENT SERIES'}
                      </span>
                      {p.productType === 'CHILD' && p.parentId && (
                        <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
                          Series Parent ID: #{p.parentId}
                        </div>
                      )}
                    </td>
                    <td>{p.categoryName || <span style={{ color: 'var(--color-muted)' }}>None</span>}</td>
                    <td>
                      {p.productType === 'PARENT' ? (
                        <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontSize: '13px' }}>Series Header (No direct price)</span>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{p.price.toFixed(2)}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{p.quantity} in stock</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const effStatus = getEffectiveProductStatus(p);
                        const isZeroStock = p.productType !== 'PARENT' && (p.quantity === undefined || p.quantity === null || p.quantity <= 0);
                        return (
                          <span className={`status-pill status-${effStatus.toLowerCase()}`}>
                            {effStatus.replace('_', ' ')}
                            {isZeroStock && p.status === 'AVAILABLE' && (
                              <span style={{ fontSize: '10px', display: 'block', opacity: 0.8 }}>(0 stock)</span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-stitch-ghost"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="btn-stitch-danger"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}
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
                Previous
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-stitch-ghost"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          LARGE DESKTOP PRODUCT & CONTENT CMS MODAL WITH PROPER SCROLLING
      ========================================================================= */}
      {(isAddModalOpen || editingProduct) && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.25rem',
            overflow: 'hidden',
            overscrollBehavior: 'contain',
          }}
        >
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: '1150px',
              height: '90vh',
              maxHeight: '920px',
              backgroundColor: '#ffffff',
              borderRadius: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--color-outline, #e2e8f0)',
              overflow: 'hidden',
              padding: 0,
              overscrollBehavior: 'contain',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Sticky Header */}
            <div style={{
              padding: '1.25rem 2rem',
              background: '#0f172a',
              color: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #334155',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  background: 'var(--color-primary, #e52b31)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  {editingProduct ? `PRODUCT #${editingProduct.id}` : 'NEW PRODUCT'}
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
                </h2>
              </div>

              {/* Header Right / Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', background: '#1e293b', borderRadius: '6px', padding: '3px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('details')}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: activeModalTab === 'details' ? 'var(--color-primary, #e52b31)' : 'transparent',
                      color: activeModalTab === 'details' ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s',
                    }}
                  >
                    1. Product Specifications
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('boxes')}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: activeModalTab === 'boxes' ? 'var(--color-primary, #e52b31)' : 'transparent',
                      color: activeModalTab === 'boxes' ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    2. Dynamic Content Boxes
                    <span style={{
                      background: formContentSections.length > 0 ? '#10b981' : '#475569',
                      color: '#fff',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontWeight: 800
                    }}>
                      {formContentSections.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '4px',
                  }}
                  title="Close Modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Error Banner inside modal */}
            {formError && (
              <div style={{ background: '#fee2e2', borderBottom: '1px solid #f87171', color: '#991b1b', padding: '0.75rem 2rem', fontSize: '13px', fontWeight: 600 }}>
                ✕ {formError}
              </div>
            )}

            {/* Scrollable Form Body Container with isolated scrolling */}
            <div
              ref={scrollContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehavior: 'contain',
                padding: '2rem',
                backgroundColor: '#f8fafc',
                display: 'block',
              }}
            >
              <form
                id="product-edit-form"
                onSubmit={handleSaveProduct}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2rem',
                }}
              >
                {activeModalTab === 'details' ? (
                  <>
                    {/* Section 1: Basic Information & Product Hierarchy */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1.5rem' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                        1. Basic Information &amp; Product Hierarchy
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.25rem' }}>
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

                        <div className="stitch-form-group">
                          <label className="stitch-label">Product Hierarchy *</label>
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
                            <option value="PARENT">PARENT (Series Header / Category Line)</option>
                            <option value="CHILD">CHILD (Variant Model under Parent Series)</option>
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

                      {/* CHILD parent series assignment */}
                      {formProductType === 'CHILD' && (
                        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', padding: '1rem', marginTop: '1.25rem' }}>
                          <label className="stitch-label" style={{ color: '#0369a1', marginBottom: '0.4rem' }}>
                            Select Parent Product Series * (Required for CHILD model variant)
                          </label>
                          <select
                            className="stitch-select"
                            value={formParentId}
                            onChange={(e) => setFormParentId(e.target.value)}
                            required
                          >
                            <option value="">-- Choose Parent Series --</option>
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
                    </div>

                    {/* Section 2: Pricing, Inventory & Availability */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1.5rem' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                        2. Pricing, Inventory &amp; Status
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: formProductType === 'PARENT' ? '1fr' : '1fr 1fr 1fr', gap: '1.25rem' }}>
                        {formProductType === 'CHILD' && (
                          <>
                            <div className="stitch-form-group">
                              <label className="stitch-label">Unit Price (₹) *</label>
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
                          </>
                        )}

                        <div className="stitch-form-group">
                          <label className="stitch-label">Availability Status *</label>
                          <select
                            className="stitch-select"
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                          >
                            <option value="AVAILABLE">AVAILABLE (Active / In Stock)</option>
                            <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                            <option value="COMING_SOON">COMING SOON</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Delivery, Warranty, Specifications & Tax */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1.5rem' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                        3. Delivery, Warranty, Specification Grade &amp; GST/Tax
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div className="stitch-form-group">
                          <label className="stitch-label">Dispatch / Delivery Time</label>
                          <input
                            type="text"
                            className="stitch-input"
                            placeholder="e.g. 24-48 Hours"
                            value={formDispatchTime}
                            onChange={(e) => setFormDispatchTime(e.target.value)}
                          />
                        </div>

                        <div className="stitch-form-group">
                          <label className="stitch-label">Warranty</label>
                          <input
                            type="text"
                            className="stitch-input"
                            placeholder="e.g. 1-Yr Factory"
                            value={formWarranty}
                            onChange={(e) => setFormWarranty(e.target.value)}
                          />
                        </div>

                        <div className="stitch-form-group">
                          <label className="stitch-label">Grade / Specification</label>
                          <input
                            type="text"
                            className="stitch-input"
                            placeholder="e.g. Aero Precision"
                            value={formGrade}
                            onChange={(e) => setFormGrade(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="checkbox"
                            id="taxInclusiveCheck"
                            checked={formTaxInclusive}
                            onChange={(e) => setFormTaxInclusive(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="taxInclusiveCheck" style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                            GST / Taxes Included in Price
                          </label>
                        </div>

                        <div className="stitch-form-group" style={{ margin: 0 }}>
                          <label className="stitch-label" style={{ fontSize: '12px' }}>Custom Tax / GST Display Label</label>
                          <input
                            type="text"
                            className="stitch-input"
                            placeholder="e.g. GST & Taxes Included or Excl. 18% GST"
                            value={formTaxNote}
                            onChange={(e) => setFormTaxNote(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Multi-Image Product Gallery */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                            4. Product Photo Gallery (Multi-Image Support)
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Upload multiple product views. Set any image as primary, reorder, replace, or delete photos.
                          </div>
                        </div>

                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', background: '#f1f5f9', padding: '0.3rem 0.75rem', borderRadius: '1rem', border: '1px solid #cbd5e1' }}>
                          {formImages.length} {formImages.length === 1 ? 'Image' : 'Images'} Configured
                        </span>
                      </div>

                      {/* Dropzone & Multiple Image Picker */}
                      <div
                        style={{
                          border: '2px dashed #cbd5e1',
                          borderRadius: '0.65rem',
                          padding: '1.25rem',
                          textAlign: 'center',
                          background: '#f8fafc',
                          position: 'relative',
                          marginBottom: '1.25rem',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
                      >
                        <CloudUploadIcon size={32} />
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>
                          Drag &amp; drop multiple product photos, or click to browse
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.25rem' }}>
                          JPEG, PNG, WEBP, GIF up to 10 MB per image (automatically optimized before BYTEA database storage)
                        </div>

                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAddMultipleImages}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0,
                            cursor: 'pointer',
                          }}
                        />
                      </div>

                      {fileError && (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#fee2e2', borderRadius: '0.35rem', border: '1px solid #fca5a5' }}>
                          {fileError}
                        </div>
                      )}

                      {/* Multi-Image Cards Grid */}
                      {formImages.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '1rem',
                        }}>
                          {formImages.map((img, idx) => (
                            <div
                              key={`form-img-${img.id || 'new'}-${idx}`}
                              style={{
                                border: img.isPrimary
                                  ? '2px solid var(--color-primary)'
                                  : '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                background: '#ffffff',
                                padding: '0.65rem',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: img.isPrimary ? '0 2px 8px rgba(220, 38, 38, 0.15)' : 'none',
                              }}
                            >
                              {/* Order & Primary Badges */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '0.25rem' }}>
                                  #{idx + 1}
                                </span>

                                {img.isPrimary ? (
                                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', background: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
                                    ★ PRIMARY
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(idx)}
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: 'var(--color-primary)',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0.15rem 0.35rem',
                                    }}
                                  >
                                    ☆ Make Primary
                                  </button>
                                )}
                              </div>

                              {/* Thumbnail preview */}
                              <div style={{
                                width: '100%',
                                height: '130px',
                                background: '#0f172a',
                                borderRadius: '0.35rem',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.5rem',
                              }}>
                                <img
                                  src={img.previewUrl}
                                  alt={`Product image ${idx + 1}`}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>

                              {/* File name & size */}
                              <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}>
                                {img.fileName || (img.id ? `Database Image #${img.id}` : 'Image')}
                                {img.fileSizeStr ? ` (${img.fileSizeStr})` : ''}
                              </div>

                              {/* Action controls */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, 'left')}
                                    disabled={idx === 0}
                                    style={{
                                      flex: 1,
                                      padding: '0.3rem',
                                      fontSize: '11px',
                                      background: idx === 0 ? '#f1f5f9' : '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '0.25rem',
                                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                      color: idx === 0 ? '#94a3b8' : '#334155',
                                    }}
                                    title="Move Left / Earlier"
                                  >
                                    ◀
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(idx, 'right')}
                                    disabled={idx === formImages.length - 1}
                                    style={{
                                      flex: 1,
                                      padding: '0.3rem',
                                      fontSize: '11px',
                                      background: idx === formImages.length - 1 ? '#f1f5f9' : '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '0.25rem',
                                      cursor: idx === formImages.length - 1 ? 'not-allowed' : 'pointer',
                                      color: idx === formImages.length - 1 ? '#94a3b8' : '#334155',
                                    }}
                                    title="Move Right / Later"
                                  >
                                    ▶
                                  </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => triggerReplaceImage(idx)}
                                    style={{
                                      flex: 1,
                                      padding: '0.3rem',
                                      fontSize: '11px',
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      color: '#334155',
                                      fontWeight: 600,
                                    }}
                                    title="Replace this image with a new file"
                                  >
                                    Replace
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(idx)}
                                    style={{
                                      padding: '0.3rem 0.5rem',
                                      fontSize: '11px',
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      color: '#dc2626',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                    }}
                                    title="Delete this image"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hidden Input for Replacing Individual Image */}
                      <input
                        type="file"
                        ref={replaceFileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={handleFileReplaced}
                      />
                    </div>

                    {/* Section 5: Overview Description */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1.5rem' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                        5. Product Overview Description
                      </div>

                      <div className="stitch-form-group" style={{ margin: 0 }}>
                        <textarea
                          className="stitch-textarea"
                          rows={6}
                          placeholder="Provide a general overview of the product or series..."
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* =========================================================================
                      TAB 2: DYNAMIC CONTENT BOXES CMS (WORD & EXCEL)
                  ========================================================================= */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Dynamic Product Content Boxes
                          </h3>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                            Add configurable content sections that will be rendered directly on the public product page in ordered sequence.
                          </p>
                        </div>

                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setShowAddBoxMenu(!showAddBoxMenu)}
                            className="btn-stitch-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem' }}
                          >
                            + ADD BOX ▾
                          </button>

                          {showAddBoxMenu && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '6px',
                              background: '#ffffff',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                              border: '1px solid #cbd5e1',
                              width: '260px',
                              zIndex: 100,
                              overflow: 'hidden',
                            }}>
                              <button
                                type="button"
                                onClick={() => handleAddBox('WORD')}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  border: 'none',
                                  background: '#ffffff',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  borderBottom: '1px solid #f1f5f9',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                    WORD
                                  </span>
                                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Rich Text / Bullets</strong>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                  Paragraphs, formatting, headings &amp; bullet list items.
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddBox('EXCEL')}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  border: 'none',
                                  background: '#ffffff',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ background: '#ccfbf1', color: '#0f766e', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                    EXCEL
                                  </span>
                                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Spreadsheet Table</strong>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                  Structured rows &amp; columns matrix for specs &amp; benchmarks.
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {formContentSections.length === 0 ? (
                        <div style={{
                          padding: '3rem',
                          textAlign: 'center',
                          background: '#f8fafc',
                          border: '2px dashed #cbd5e1',
                          borderRadius: '0.5rem',
                          marginTop: '1rem',
                        }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                            No Content Boxes Added Yet
                          </div>
                          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
                            Add formatted rich text (WORD) or structured spreadsheets (EXCEL) to customize technical details for this drone product.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddBoxMenu(true)}
                            className="btn-stitch-primary"
                            style={{ padding: '0.5rem 1.25rem', fontSize: '13px' }}
                          >
                            + ADD FIRST BOX
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                          {formContentSections.map((section, idx) => (
                            <div
                              key={idx}
                              style={{
                                border: section.enabled !== false ? '1px solid #cbd5e1' : '1px dashed #cbd5e1',
                                borderRadius: '0.65rem',
                                background: section.enabled !== false ? '#ffffff' : '#f8fafc',
                                opacity: section.enabled !== false ? 1 : 0.75,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                              }}
                            >
                              {/* Box Header Toolbar */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 16px',
                                background: section.enabled !== false ? '#f1f5f9' : '#e2e8f0',
                                borderBottom: '1px solid #e2e8f0',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    background: '#334155',
                                    color: '#ffffff',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}>
                                    #{idx + 1}
                                  </span>

                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    background: section.type === 'WORD' ? '#dbeafe' : '#ccfbf1',
                                    color: section.type === 'WORD' ? '#1d4ed8' : '#0f766e',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                  }}>
                                    {section.type} BOX
                                  </span>

                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => handleUpdateBox(idx, { title: e.target.value })}
                                    placeholder="Enter Box Heading / Title..."
                                    style={{
                                      flex: 1,
                                      padding: '5px 8px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: '#0f172a',
                                      background: '#ffffff',
                                    }}
                                    required
                                  />
                                </div>

                                {/* Action controls: Order, Toggle, Delete */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveBox(idx, 'up')}
                                    title="Move Up"
                                    style={{ ...boxControlBtnStyle, opacity: idx === 0 ? 0.4 : 1 }}
                                  >
                                    ▲ Up
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === formContentSections.length - 1}
                                    onClick={() => handleMoveBox(idx, 'down')}
                                    title="Move Down"
                                    style={{ ...boxControlBtnStyle, opacity: idx === formContentSections.length - 1 ? 0.4 : 1 }}
                                  >
                                    ▼ Down
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleBox(idx)}
                                    style={{
                                      ...boxControlBtnStyle,
                                      background: section.enabled !== false ? '#ecfdf5' : '#fef2f2',
                                      color: section.enabled !== false ? '#065f46' : '#991b1b',
                                      borderColor: section.enabled !== false ? '#a7f3d0' : '#fecaca',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {section.enabled !== false ? '● Enabled' : '○ Disabled'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBox(idx)}
                                    title="Delete Box"
                                    style={{
                                      ...boxControlBtnStyle,
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      borderColor: '#f87171',
                                      fontWeight: 700,
                                    }}
                                  >
                                    🗑 Delete
                                  </button>
                                </div>
                              </div>

                              {/* Box Editor Body */}
                              <div style={{ padding: '1rem' }}>
                                {section.type === 'WORD' ? (
                                  <RichTextEditor
                                    value={section.content}
                                    onChange={(val) => handleUpdateBox(idx, { content: val })}
                                  />
                                ) : (
                                  <TableEditor
                                    value={section.content}
                                    onChange={(val) => handleUpdateBox(idx, { content: val })}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Fixed Sticky Modal Footer Actions */}
            <div style={{
              padding: '1rem 2rem',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {formContentSections.length} Dynamic Box(es) Configured
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="btn-stitch-ghost"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="product-edit-form"
                  disabled={submitting}
                  className="btn-stitch-primary"
                  style={{ padding: '0.65rem 1.75rem', fontSize: '14px', fontWeight: 800 }}
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-error)', margin: '0 0 1rem 0' }}>
              Confirm Product Deletion
            </h3>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete product <strong>"{deletingProduct.name}"</strong> (ID: #{deletingProduct.id})? All associated content boxes and images will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button disabled={submitting} onClick={closeModal} className="btn-stitch-ghost">
                Cancel
              </button>
              <button disabled={submitting} onClick={handleDeleteProduct} className="btn-stitch-danger">
                {submitting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const boxControlBtnStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
  color: '#334155',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
