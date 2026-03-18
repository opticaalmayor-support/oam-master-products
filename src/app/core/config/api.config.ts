export const API_CONFIG = {
  baseUrl: 'http://127.0.0.1:8000',
  // baseUrl: 'http://new-api.test',
  endpoints: {
    maestroAuthLogin: '/api/maestro/auth/login',
    maestroAuthMe: '/api/maestro/auth/me',
    maestroAuthLogout: '/api/maestro/auth/logout',
    maestroAdminUsers: '/api/maestro/admin/users',
    suppliers: '/api/maestro/suppliers',
    products: '/api/maestro/products',
    categories: '/api/maestro/categories',
    brands: '/api/maestro/brands',
    OamProduct: '/api/maestro/product',
    OamProductVariant: '/api/maestro/product-variants',
    OamProductVariantByMaster: '/api/maestro/product/{productMasterId}/variants',
    collection: '/api/maestro/collections',
    CollectionByBrand: '/api/maestro/collections/brand/{brandId}',
    OamProductVariantUploadMedia: '/api/maestro/product-variants/upload-media',
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
