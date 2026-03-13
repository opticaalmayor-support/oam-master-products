// Importa el decorador Injectable para registrar el servicio en Angular
import { Injectable } from '@angular/core';

// Importa HttpClient y HttpParams para consumir el backend y construir query params
import { HttpClient, HttpParams } from '@angular/common/http';

// Importa Observable para tipar respuestas asíncronas
import { Observable } from 'rxjs';

// Importa la función centralizada que construye URLs del API
import { getApiUrl } from '../../../config/api.config';

// Importa el modelo de variante y el tipo de filtros de variantes
import { OamProductVariant, VariantQueryParams } from '../../../../core/models/product.model';

// Declara el servicio como inyectable global
@Injectable({
  providedIn: 'root',
})
// Declara el servicio encargado del CRUD de variantes
export class OamProductVariantService {
  // Inyecta HttpClient en el constructor
  constructor(private http: HttpClient) {}

  /**
   * Obtiene la URL base desde la configuración centralizada del proyecto
   */
  private get baseUrl(): string {
    return getApiUrl('OamProductVariant');
  }

  /**
   * READ: Obtener variantes paginadas y filtradas
   */
  getVariants(filters: VariantQueryParams = {}): Observable<any> {
    let params = new HttpParams();

    // Limpia y construye los parámetros de la URL
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof VariantQueryParams];

      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => (params = params.append(`${key}[]`, String(v))));
        } else {
          params = params.append(key, String(value));
        }
      }
    });

    return this.http.get<any>(this.baseUrl, { params });
  }

  /**
   * READ BY ID: Obtener una sola variante por ID
   */
  getVariantById(id: number): Observable<{ data: OamProductVariant }> {
    return this.http.get<{ data: OamProductVariant }>(`${this.baseUrl}/${id}`);
  }

  /**
   * CREATE: Crear una nueva variante
   */
  createVariant(
    variant: Partial<OamProductVariant>,
  ): Observable<{ message: string; data: OamProductVariant }> {
    return this.http.post<{ message: string; data: OamProductVariant }>(this.baseUrl, variant);
  }

  /**
   * UPDATE: Actualizar una variante existente
   */
  updateVariant(
    id: number,
    variant: Partial<OamProductVariant>,
  ): Observable<{ message: string; data: OamProductVariant }> {
    return this.http.put<{ message: string; data: OamProductVariant }>(
      `${this.baseUrl}/${id}`,
      variant,
    );
  }

  /**
   * DELETE: Eliminar una variante por ID
   */
  deleteVariant(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * READ BY MASTER: Obtener variantes asociadas a un Product Master
   */
  getVariantsByMaster(productMasterId: number, perPage: number = 15): Observable<any> {
    const url = getApiUrl('OamProductVariantByMaster', { productMasterId });
    const params = new HttpParams().set('per_page', String(perPage));

    return this.http.get<any>(url, { params });
  }
}
