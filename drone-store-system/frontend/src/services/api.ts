/// <reference types="vite/client" />

export interface AdminDto {
  id: number;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  admin: AdminDto;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'COMING_SOON';
export type ProductType = 'STANDALONE' | 'PARENT' | 'CHILD';

export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface ProductDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  status: ProductStatus;
  productType: ProductType;
  parentId?: number | null;
  categoryId?: number | null;
  categoryName?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  status: ProductStatus;
  productType: ProductType;
  parentId?: number | null;
  categoryId?: number | null;
  image?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

/* Admin Login Route */
export async function loginAdmin(email: String, password: String): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      status: response.status,
      error: 'Error',
      message: 'Invalid email or password',
      timestamp: new Date().toISOString(),
    }));
    throw new Error(errorData.message || 'Authentication failed');
  }

  return response.json();
}

/* Public Storefront Read-Only APIs (No Auth Header) */
export async function fetchPublicCategories(): Promise<CategoryDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to load store categories');
  }

  return response.json();
}

export async function fetchPublicProducts(
  params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  }
): Promise<PageResponse<ProductDto>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);

  const response = await fetch(`${API_BASE_URL}/api/products?${queryParams.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to load store products');
  }

  return response.json();
}

export async function fetchPublicProductById(id: number): Promise<ProductDto> {
  const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Product not found');
  }

  return response.json();
}

export async function fetchPublicChildProducts(parentId: number): Promise<ProductDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/products/${parentId}/children`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to load product variants');
  }

  return response.json();
}

/* Protected Admin APIs (Require JWT Header) */
export async function fetchAdminProfile(token: string): Promise<AdminDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch admin profile');
  }

  return response.json();
}

export async function fetchCategories(token: string): Promise<CategoryDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to fetch categories', timestamp: '' }));
    throw new Error(err.message || 'Failed to fetch categories');
  }

  return response.json();
}

export async function createCategory(token: string, data: CategoryRequest): Promise<CategoryDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to create category', timestamp: '' }));
    throw new Error(err.message || 'Failed to create category');
  }

  return response.json();
}

export async function updateCategory(token: string, id: number, data: CategoryRequest): Promise<CategoryDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update category', timestamp: '' }));
    throw new Error(err.message || 'Failed to update category');
  }

  return response.json();
}

export async function deleteCategory(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to delete category', timestamp: '' }));
    throw new Error(err.message || 'Failed to delete category');
  }
}

export async function fetchProducts(
  token: string,
  params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    categoryId?: number | string;
    parentId?: number | string;
    productType?: ProductType;
  }
): Promise<PageResponse<ProductDto>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId.toString());
  if (params?.parentId) queryParams.append('parentId', params.parentId.toString());
  if (params?.productType) queryParams.append('productType', params.productType);

  const response = await fetch(`${API_BASE_URL}/api/admin/products?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to fetch products', timestamp: '' }));
    throw new Error(err.message || 'Failed to fetch products');
  }

  return response.json();
}

export async function createProduct(token: string, data: ProductRequest): Promise<ProductDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to create product', timestamp: '' }));
    throw new Error(err.message || 'Failed to create product');
  }

  return response.json();
}

export async function updateProduct(token: string, id: number, data: ProductRequest): Promise<ProductDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update product', timestamp: '' }));
    throw new Error(err.message || 'Failed to update product');
  }

  return response.json();
}

export async function deleteProduct(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to delete product', timestamp: '' }));
    throw new Error(err.message || 'Failed to delete product');
  }
}
