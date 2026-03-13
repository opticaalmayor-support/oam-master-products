import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../../../config/api.config';
import { OamCollection } from '../../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class OamCollectionService {
  constructor(private http: HttpClient) {}

  /**
   * URL base centralizada
   */
  private get baseUrl(): string {
    return getApiUrl('collection');
  }

  /**
   * READ: Obtener colecciones
   */
  getCollections(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.append(key, String(value));
      }
    });

    return this.http.get<any>(this.baseUrl, { params });
  }

  /**
   * READ BY ID: Obtener colección por ID
   */
  getCollectionById(id: number): Observable<{ data: OamCollection }> {
    return this.http.get<{ data: OamCollection }>(`${this.baseUrl}/${id}`);
  }

  /**
   * CREATE: Crear colección
   */
  createCollection(
    payload: Partial<OamCollection>,
  ): Observable<{ message: string; data: OamCollection }> {
    return this.http.post<{ message: string; data: OamCollection }>(this.baseUrl, payload);
  }

  /**
   * UPDATE: Actualizar colección
   */
  updateCollection(
    id: number,
    payload: Partial<OamCollection>,
  ): Observable<{ message: string; data: OamCollection }> {
    return this.http.put<{ message: string; data: OamCollection }>(
      `${this.baseUrl}/${id}`,
      payload,
    );
  }

  /**
   * DELETE: Eliminar colección
   */
  deleteCollection(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * READ BY BRAND: Obtener colecciones por marca
   */
  getCollectionsByBrand(brandId: number): Observable<any> {
    const url = getApiUrl('CollectionByBrand', { brandId });
    return this.http.get<any>(url);
  }
}
