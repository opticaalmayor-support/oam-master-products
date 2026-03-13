import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../../../config/api.config';
import { OamProductMaster } from '../../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene la URL base desde tu configuración centralizada
   */
  private get baseUrl(): string {
    return getApiUrl('OamProduct');
  }

  /**
   * READ: Obtener productos paginados y filtrados
   * @param filters Objeto con los filtros (upc, model_code, brand_id, etc.)
   */
  getProducts(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    // Limpieza y construcción de parámetros para la URL
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        // Soporte para arrays (ej: brand_id) que espera tu backend
        if (Array.isArray(value)) {
          value.forEach((v) => (params = params.append(`${key}[]`, v)));
        } else {
          params = params.append(key, value);
        }
      }
    });

    return this.http.get<any>(this.baseUrl, { params });
  }

  /**
   * READ BY ID: Obtener un solo producto para ver detalles o editar
   */
  getProductById(id: number): Observable<OamProductMaster> {
    return this.http.get<OamProductMaster>(`${this.baseUrl}/${id}`);
  }

  /**
   * CREATE: Enviar un nuevo producto al servidor
   * Apunta a la función 'store' de tu OamProductController
   */
  createProduct(product: Partial<OamProductMaster>): Observable<OamProductMaster> {
    return this.http.post<OamProductMaster>(this.baseUrl, product);
  }

  /**
   * UPDATE: Actualizar un producto existente
   * Apunta a la función 'update' de tu OamProductController
   */
  updateProduct(id: number, product: Partial<OamProductMaster>): Observable<OamProductMaster> {
    return this.http.put<OamProductMaster>(`${this.baseUrl}/${id}`, product);
  }

  /**
   * DELETE: Eliminar un producto
   * Apunta a la función 'destroy' de tu OamProductController
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
