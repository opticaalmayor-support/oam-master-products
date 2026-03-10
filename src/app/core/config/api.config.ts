export const API_CONFIG = {
  // baseUrl: 'http://127.0.0.1:8000',
  baseUrl: 'http://new-api.test',
  endpoints: {
    suppliers: '/api/maestro/suppliers',
    products: '/api/maestro/products',
    categories: '/api/maestro/categories',
    brands: '/api/maestro/brands',
    OamProduct: '/api/maestro/OamProduct',
    OamProductVariant: '/api/maestro/OamProductVariant',
    OamProductVariantByMaster: '/api/maestro/OamProduct/{productMasterId}/variants',
  },
};

export function getApiUrl(
  endpoint: keyof typeof API_CONFIG.endpoints,
  params?: Record<string, string | number>,
): string {
  let path = API_CONFIG.endpoints[endpoint];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, String(value));
    });
  }

  return `${API_CONFIG.baseUrl}${path}`;
}
