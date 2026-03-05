import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  isProfileComplete: boolean;
}

interface CustomerAuthState {
  token: string | null;
  customer: CustomerProfile | null;
  isLoggedIn: boolean;
  setAuth: (token: string, customer: CustomerProfile) => void;
  clearAuth: () => void;
  updateProfile: (partial: Partial<CustomerProfile>) => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      isLoggedIn: false,

      setAuth: (token, customer) =>
        set({ token, customer, isLoggedIn: true }),

      clearAuth: () =>
        set({ token: null, customer: null, isLoggedIn: false }),

      updateProfile: (partial) =>
        set((state) => ({
          customer: state.customer ? { ...state.customer, ...partial } : null,
        })),
    }),
    {
      name: 'customer_auth',
    }
  )
);
