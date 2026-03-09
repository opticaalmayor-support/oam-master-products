export const API_CONFIG = {
  baseUrl: 'http://127.0.0.1:8000',
  // baseUrl: 'http://new-api.test',
  endpoints: {
    suppliers: '/api/maestro/suppliers',
    products: '/api/maestro/products',
    categories: '/api/maestro/categories',
    brands: '/api/maestro/brands',
    OamProduct: '/api/maestro/OamProduct',
  },
};

export function getApiUrl(endpoint: keyof typeof API_CONFIG.endpoints): string {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
}
