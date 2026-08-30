import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserDto,
  CartDto,
  loginUser,
  signupUser,
  fetchUserProfile,
  fetchUserCart,
  addToUserCart,
  updateUserCartItem,
  removeUserCartItem,
} from '../services/api';

interface UserAuthContextType {
  user: UserDto | null;
  token: string | null;
  cart: CartDto | null;
  cartItemCount: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: String) => Promise<void>;
  signup: (data: { fullName: string; email: string; password: string; phone: string }) => Promise<void>;
  logout: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateCartQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

const USER_TOKEN_KEY = 'drone_user_jwt_token';

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(USER_TOKEN_KEY));
  const [user, setUser] = useState<UserDto | null>(null);
  const [cart, setCart] = useState<CartDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCartData = async (jwtToken: string) => {
    try {
      const cartData = await fetchUserCart(jwtToken);
      setCart(cartData);
    } catch (err) {
      console.error('Error fetching user cart:', err);
    }
  };

  useEffect(() => {
    async function initUserSession() {
      const storedToken = localStorage.getItem(USER_TOKEN_KEY);
      if (storedToken) {
        try {
          const profile = await fetchUserProfile(storedToken);
          setUser(profile);
          setToken(storedToken);
          await loadCartData(storedToken);
        } catch {
          localStorage.removeItem(USER_TOKEN_KEY);
          setToken(null);
          setUser(null);
          setCart(null);
        }
      }
      setIsLoading(false);
    }
    initUserSession();
  }, []);

  const login = async (email: string, password: String) => {
    const res = await loginUser({ email, password: password.toString() });
    localStorage.setItem(USER_TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    await loadCartData(res.token);
  };

  const signup = async (data: { fullName: string; email: string; password: string; phone: string }) => {
    await signupUser(data);
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem(USER_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setCart(null);
  };

  const refreshCart = async () => {
    if (token) {
      await loadCartData(token);
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!token) {
      throw new Error('UNAUTHENTICATED');
    }
    const updatedCart = await addToUserCart(token, productId, quantity);
    setCart(updatedCart);
  };

  const updateCartQuantity = async (itemId: number, quantity: number) => {
    if (!token) return;
    const updatedCart = await updateUserCartItem(token, itemId, quantity);
    setCart(updatedCart);
  };

  const removeFromCart = async (itemId: number) => {
    if (!token) return;
    const updatedCart = await removeUserCartItem(token, itemId);
    setCart(updatedCart);
  };

  const cartItemCount = cart?.totalItems || 0;

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        cart,
        cartItemCount,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshCart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};
