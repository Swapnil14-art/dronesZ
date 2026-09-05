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

/* User & Ecommerce DTOs */
export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface UserLoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

export interface UserAddressDto {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressRequest {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
  status: ProductStatus;
  productType: ProductType;
  stockAvailable: number;
}

export interface CartDto {
  id: number;
  items: CartItemDto[];
  totalAmount: number;
  totalItems: number;
}

export interface CheckoutSummaryDto {
  cart: CartDto;
  addresses: UserAddressDto[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
  canPlaceOrder: boolean;
  placeOrderMessage: string;
}

export interface OrderItemDto {
  id: number;
  productId?: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDto {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  items: OrderItemDto[];
  createdAt: string;
}

const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return 'http://localhost:8070';
};

export const API_BASE_URL = getApiBaseUrl();

export const getProductImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath || !imagePath.trim()) return null;
  const path = imagePath.trim();
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/${path}`;
};

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

/* User Auth APIs */
export async function signupUser(data: { fullName: string; email: string; password: string; phone: string }): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/auth/user/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Registration failed', timestamp: '' }));
    throw new Error(err.message || 'Registration failed');
  }

  return response.json();
}

export async function loginUser(data: { email: string; password: string }): Promise<UserLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Invalid email or password', timestamp: '' }));
    throw new Error(err.message || 'Invalid email or password');
  }

  return response.json();
}

/* User Profile & Address APIs */
export async function fetchUserProfile(token: string): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

export async function updateUserProfile(token: string, data: { fullName: string; phone: string }): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update profile', timestamp: '' }));
    throw new Error(err.message || 'Failed to update profile');
  }

  return response.json();
}

export async function fetchUserAddresses(token: string): Promise<UserAddressDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/user/addresses`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user addresses');
  }

  return response.json();
}

export async function createUserAddress(token: string, data: AddressRequest): Promise<UserAddressDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/addresses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to add address', timestamp: '' }));
    throw new Error(err.message || 'Failed to add address');
  }

  return response.json();
}

export async function updateUserAddress(token: string, id: number, data: AddressRequest): Promise<UserAddressDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/addresses/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update address', timestamp: '' }));
    throw new Error(err.message || 'Failed to update address');
  }

  return response.json();
}

export async function deleteUserAddress(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/user/addresses/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete address');
  }
}

export async function setDefaultUserAddress(token: string, id: number): Promise<UserAddressDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/addresses/${id}/default`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to set default address');
  }

  return response.json();
}

/* User Cart APIs */
export async function fetchUserCart(token: string): Promise<CartDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/cart`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user cart');
  }

  return response.json();
}

export async function addToUserCart(token: string, productId: number, quantity: number = 1): Promise<CartDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/cart/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to add item to cart', timestamp: '' }));
    throw new Error(err.message || 'Failed to add item to cart');
  }

  return response.json();
}

export async function updateUserCartItem(token: string, itemId: number, quantity: number): Promise<CartDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/cart/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update item quantity', timestamp: '' }));
    throw new Error(err.message || 'Failed to update item quantity');
  }

  return response.json();
}

export async function removeUserCartItem(token: string, itemId: number): Promise<CartDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to remove cart item');
  }

  return response.json();
}

export async function clearUserCart(token: string): Promise<CartDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/cart/clear`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to clear cart');
  }

  return response.json();
}

/* User Checkout & Orders APIs */
export async function fetchCheckoutSummary(token: string): Promise<CheckoutSummaryDto> {
  const response = await fetch(`${API_BASE_URL}/api/user/checkout-summary`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load checkout summary');
  }

  return response.json();
}

export async function fetchUserOrders(token: string): Promise<OrderDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/user/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user orders');
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

export async function uploadOrReplaceProductImage(token: string, id: number, file: File): Promise<ProductDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to upload/replace product image', timestamp: '' }));
    throw new Error(err.message || 'Failed to upload/replace product image');
  }

  return response.json();
}

export async function deleteProductImage(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/image`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to delete product image', timestamp: '' }));
    throw new Error(err.message || 'Failed to delete product image');
  }
}

