export const API_CONFIG = {
  baseUrl: 'http://new-api.test',
  endpoints: {
    suppliers: '/api/maestro/suppliers',
    products: '/api/maestro/products',
    categories: '/api/maestro/categories',
    brands: '/api/maestro/brands',
  }
};

export function getApiUrl(endpoint: keyof typeof API_CONFIG.endpoints): string {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
}