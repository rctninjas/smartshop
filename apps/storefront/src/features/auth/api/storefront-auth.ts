import type {
  StorefrontCustomerDto,
  StorefrontLoginCodeRequestInput,
  StorefrontLoginCodeVerifyInput,
  StorefrontLoginPasswordInput,
  StorefrontRegisterInput
} from '@smartshop/types';
import { apiGet, apiPost } from '../../../shared/api/client';

export async function registerCustomer(payload: StorefrontRegisterInput) {
  return apiPost<{ customer: StorefrontCustomerDto }, StorefrontRegisterInput>('/api/storefront/auth/register', payload);
}

export async function loginWithPassword(payload: StorefrontLoginPasswordInput) {
  return apiPost<{ customer: StorefrontCustomerDto }, StorefrontLoginPasswordInput>(
    '/api/storefront/auth/login/password',
    payload
  );
}

export async function requestLoginCode(payload: StorefrontLoginCodeRequestInput) {
  return apiPost<{ sent: true; devCode?: string }, StorefrontLoginCodeRequestInput>(
    '/api/storefront/auth/login/code/request',
    payload
  );
}

export async function verifyLoginCode(payload: StorefrontLoginCodeVerifyInput) {
  return apiPost<{ customer: StorefrontCustomerDto }, StorefrontLoginCodeVerifyInput>(
    '/api/storefront/auth/login/code/verify',
    payload
  );
}

export async function getCurrentCustomer() {
  try {
    const result = await apiGet<{ customer: StorefrontCustomerDto }>('/api/storefront/auth/me');
    return result.customer;
  } catch {
    return null;
  }
}

export async function logoutCustomer() {
  await apiPost<{}, Record<string, never>>('/api/storefront/auth/logout', {});
}
