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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

export async function fetchAdminDashboardData(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unauthorized access to admin dashboard');
  }

  return response.json();
}
