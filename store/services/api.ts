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

export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'COMING_SOON' | 'ARCHIVED';
export type ProductType = 'STANDALONE' | 'PARENT' | 'CHILD';

export function getEffectiveProductStatus(product?: {
  status?: string;
  quantity?: number;
  productType?: string;
} | null): ProductStatus {
  if (!product) return 'OUT_OF_STOCK';
  if (product.status === 'ARCHIVED') return 'ARCHIVED';
  if (product.productType === 'PARENT') {
    return (product.status as ProductStatus) || 'AVAILABLE';
  }
  const qty = product.quantity !== undefined && product.quantity !== null ? product.quantity : 0;
  if (qty <= 0) {
    return 'OUT_OF_STOCK';
  }
  return (product.status as ProductStatus) || 'AVAILABLE';
}

export type ProductContentSectionType = 'WORD' | 'EXCEL';

export interface ProductContentSectionDto {
  id: number;
  productId?: number;
  title: string;
  type: ProductContentSectionType;
  content: string;
  displayOrder: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductContentSectionRequest {
  id?: number;
  title: string;
  type: ProductContentSectionType;
  content: string;
  displayOrder?: number;
  enabled?: boolean;
}

export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface ProductImageDto {
  id: number;
  productId: number;
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
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
  images?: ProductImageDto[];
  primaryImage?: ProductImageDto;
  dispatchTime?: string;
  warranty?: string;
  grade?: string;
  taxInclusive?: boolean;
  taxNote?: string;
  contentSections?: ProductContentSectionDto[];
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
  dispatchTime?: string;
  warranty?: string;
  grade?: string;
  taxInclusive?: boolean;
  taxNote?: string;
  contentSections?: ProductContentSectionRequest[];
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
  enabled?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt?: string;
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
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NEXT_PUBLIC_API_BASE_URL) {
    return (globalThis as any).process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return 'http://localhost:8070';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Known product mapping for static repository images (temporary storage workaround).
 * Supabase remains the sole source of truth for all product metadata, pricing, and specs.
 */
export const KNOWN_PRODUCT_IMAGE_MAP: Record<number, string> = {
  26: '8017.png',
  27: '7005.png',
  28: '3115.png',
  30: '3110.png',
  31: '2807.png',
};

/**
 * Sanitizes an image file name to prevent path traversal and extract safe basename.
 */
export function sanitizeImageFileName(fileName?: string | null): string | null {
  if (!fileName || typeof fileName !== 'string') return null;
  const trimmed = fileName.trim();
  if (!trimmed) return null;

  // Pass through blob: and data: URLs for local upload previews
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Strip query parameters and hashes (e.g. ?v=1788887304)
  const clean = trimmed.split('?')[0].split('#')[0];

  // Extract base name only (strip any directory paths like ../ or /)
  const baseName = clean.split(/[/\\]/).filter(Boolean).pop();
  if (!baseName || baseName === '.' || baseName === '..') {
    return null;
  }

  // Keep only safe characters: letters, numbers, dot, underscore, hyphen
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safeName || safeName.startsWith('.')) {
    return null;
  }

  return safeName;
}

/**
 * Resolves static product image source: /product-images/[safeFileName]
 *
 * Products, categories, prices, specs, and file_name metadata continue to be fetched from Supabase.
 * This resolves the static image filename mapping without calling the broken BYTEA API.
 */
export function getProductImageSrc(
  input?: string | ProductImageDto | ProductDto | null,
  fallbackProductId?: number | null
): string | null {
  if (!input && !fallbackProductId) return null;

  // If input is an object (ProductImageDto or ProductDto)
  if (input && typeof input === 'object') {
    // Check for direct fileName property
    if ('fileName' in input && input.fileName) {
      const safe = sanitizeImageFileName(input.fileName);
      if (safe) {
        return safe.startsWith('blob:') || safe.startsWith('data:') ? safe : `/product-images/${safe}`;
      }
    }
    // Check for primaryImage fileName
    if ('primaryImage' in input && input.primaryImage?.fileName) {
      const safe = sanitizeImageFileName(input.primaryImage.fileName);
      if (safe) {
        return safe.startsWith('blob:') || safe.startsWith('data:') ? safe : `/product-images/${safe}`;
      }
    }
    // Check for first image in images array
    if ('images' in input && Array.isArray(input.images) && input.images.length > 0) {
      for (const img of input.images) {
        if (img.fileName) {
          const safe = sanitizeImageFileName(img.fileName);
          if (safe) {
            return safe.startsWith('blob:') || safe.startsWith('data:') ? safe : `/product-images/${safe}`;
          }
        }
      }
    }

    const pid = ('productId' in input ? input.productId : ('id' in input ? input.id : null)) || fallbackProductId;
    if (pid && KNOWN_PRODUCT_IMAGE_MAP[pid]) {
      return `/product-images/${KNOWN_PRODUCT_IMAGE_MAP[pid]}`;
    }

    const rawUrl = ('url' in input ? input.url : ('image' in input ? input.image : null));
    if (rawUrl) {
      return getProductImageSrc(rawUrl, pid);
    }
    return null;
  }

  // If input is a string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      if (fallbackProductId && KNOWN_PRODUCT_IMAGE_MAP[fallbackProductId]) {
        return `/product-images/${KNOWN_PRODUCT_IMAGE_MAP[fallbackProductId]}`;
      }
      return null;
    }

    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // Already a /product-images/ path
    if (trimmed.startsWith('/product-images/')) {
      const base = sanitizeImageFileName(trimmed);
      return base ? `/product-images/${base}` : null;
    }

    // If it's a legacy /api/products/[productId]/images/[imageId] path, extract productId
    const apiMatch = trimmed.match(/\/api\/products\/(\d+)/i);
    const parsedId = apiMatch ? parseInt(apiMatch[1], 10) : fallbackProductId;
    if (parsedId && KNOWN_PRODUCT_IMAGE_MAP[parsedId]) {
      return `/product-images/${KNOWN_PRODUCT_IMAGE_MAP[parsedId]}`;
    }

    // Otherwise check if it looks like a file name (e.g. 8017.png or 8017)
    const safe = sanitizeImageFileName(trimmed);
    if (safe && (safe.endsWith('.png') || safe.endsWith('.jpg') || safe.endsWith('.jpeg') || safe.endsWith('.webp') || safe.endsWith('.svg'))) {
      return `/product-images/${safe}`;
    }

    if (fallbackProductId && KNOWN_PRODUCT_IMAGE_MAP[fallbackProductId]) {
      return `/product-images/${KNOWN_PRODUCT_IMAGE_MAP[fallbackProductId]}`;
    }
  }

  if (fallbackProductId && KNOWN_PRODUCT_IMAGE_MAP[fallbackProductId]) {
    return `/product-images/${KNOWN_PRODUCT_IMAGE_MAP[fallbackProductId]}`;
  }

  return null;
}

export const getProductImageUrl = (
  imagePath?: string | ProductImageDto | ProductDto | null,
  fallbackProductId?: number | null
): string | null => {
  return getProductImageSrc(imagePath, fallbackProductId);
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

export async function fetchCategories(token: string, includeDeleted: boolean = false): Promise<CategoryDto[]> {
  const query = includeDeleted ? '?includeDeleted=true' : '';
  const response = await fetch(`${API_BASE_URL}/api/admin/categories${query}`, {
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

export async function restoreCategory(token: string, id: number): Promise<CategoryDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}/restore`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to restore category', timestamp: '' }));
    throw new Error(err.message || 'Failed to restore category');
  }

  return response.json();
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
    includeArchived?: boolean;
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
  if (params?.includeArchived) queryParams.append('includeArchived', 'true');

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

export async function archiveProduct(token: string, id: number): Promise<void> {
  return deleteProduct(token, id);
}

export async function restoreProduct(token: string, id: number): Promise<ProductDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/restore`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to restore product', timestamp: '' }));
    throw new Error(err.message || 'Failed to restore product');
  }

  return response.json();
}

export async function fetchProductImages(productId: number, token?: string): Promise<ProductImageDto[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = token
    ? `${API_BASE_URL}/api/admin/products/${productId}/images`
    : `${API_BASE_URL}/api/products/${productId}/images`;

  try {
    const response = await fetch(url, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // fallback
  }

  // Fallback to public endpoint
  const publicRes = await fetch(`${API_BASE_URL}/api/products/${productId}/images`);
  if (!publicRes.ok) {
    throw new Error('Failed to fetch product images');
  }
  return publicRes.json();
}

export async function uploadMultipleProductImages(token: string, productId: number, files: File[]): Promise<ProductImageDto[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to upload images', timestamp: '' }));
    throw new Error(err.message || 'Failed to upload images');
  }

  return response.json();
}

export async function setPrimaryProductImage(token: string, productId: number, imageId: number): Promise<ProductImageDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images/${imageId}/primary`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to set primary image', timestamp: '' }));
    throw new Error(err.message || 'Failed to set primary image');
  }

  return response.json();
}

export async function reorderProductImages(token: string, productId: number, imageIds: number[]): Promise<ProductImageDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageIds }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to reorder images', timestamp: '' }));
    throw new Error(err.message || 'Failed to reorder images');
  }

  return response.json();
}

export async function replaceProductImage(token: string, productId: number, imageId: number, file: File): Promise<ProductImageDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images/${imageId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to replace image', timestamp: '' }));
    throw new Error(err.message || 'Failed to replace image');
  }

  return response.json();
}

export async function deleteSpecificProductImage(token: string, productId: number, imageId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to delete image', timestamp: '' }));
    throw new Error(err.message || 'Failed to delete image');
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

/* Product Content Sections APIs */
export async function fetchProductContentSections(token: string, productId: number): Promise<ProductContentSectionDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/content-sections`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to fetch content sections', timestamp: '' }));
    throw new Error(err.message || 'Failed to fetch content sections');
  }

  return response.json();
}

export async function createProductContentSection(token: string, productId: number, data: ProductContentSectionRequest): Promise<ProductContentSectionDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/content-sections`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to create content section', timestamp: '' }));
    throw new Error(err.message || 'Failed to create content section');
  }

  return response.json();
}

export async function updateProductContentSection(token: string, productId: number, sectionId: number, data: ProductContentSectionRequest): Promise<ProductContentSectionDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/content-sections/${sectionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update content section', timestamp: '' }));
    throw new Error(err.message || 'Failed to update content section');
  }

  return response.json();
}

export async function deleteProductContentSection(token: string, productId: number, sectionId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/content-sections/${sectionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to delete content section', timestamp: '' }));
    throw new Error(err.message || 'Failed to delete content section');
  }
}

export async function reorderProductContentSections(token: string, productId: number, sectionIds: number[]): Promise<ProductContentSectionDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/content-sections/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sectionIds }),
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to reorder content sections', timestamp: '' }));
    throw new Error(err.message || 'Failed to reorder content sections');
  }

  return response.json();
}

export async function toggleProductContentSection(token: string, productId: number, sectionId: number): Promise<ProductContentSectionDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/content-sections/${sectionId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to toggle content section', timestamp: '' }));
    throw new Error(err.message || 'Failed to toggle content section');
  }

  return response.json();
}

/* Admin User Management APIs */
export async function fetchAdminUsers(
  token: string,
  includeDeleted: boolean = false,
  keyword?: string
): Promise<UserDto[]> {
  const queryParams = new URLSearchParams();
  if (includeDeleted) queryParams.append('includeDeleted', 'true');
  if (keyword) queryParams.append('keyword', keyword);

  const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to fetch users', timestamp: '' }));
    throw new Error(err.message || 'Failed to fetch users');
  }

  return response.json();
}

export async function fetchAdminUserById(token: string, id: number): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to fetch user profile', timestamp: '' }));
    throw new Error(err.message || 'Failed to fetch user profile');
  }

  return response.json();
}

export async function softDeleteUser(token: string, id: number): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to deactivate user', timestamp: '' }));
    throw new Error(err.message || 'Failed to deactivate user');
  }

  return response.json();
}

export async function restoreUser(token: string, id: number): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/restore`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to restore user', timestamp: '' }));
    throw new Error(err.message || 'Failed to restore user');
  }

  return response.json();
}

export async function toggleUserEnabled(token: string, id: number, enabled: boolean): Promise<UserDto> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/status?enabled=${enabled}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err: ErrorResponse = await response.json().catch(() => ({ status: response.status, error: 'Error', message: 'Failed to update user status', timestamp: '' }));
    throw new Error(err.message || 'Failed to update user status');
  }

  return response.json();
}


