import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../../../config/api.config';
import { OamBrand } from '../../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class OamBrandService {
  constructor(private http: HttpClient) {}

  /**
   * URL base centralizada
   */
  private get baseUrl(): string {
    return getApiUrl('brands');
  }

  /**
   * READ: Obtener listado de marcas
   */
  getBrands(filters: any = {}): Observable<any> {
    return this.http.get<any>(this.baseUrl, { params: filters });
  }

  /**
   * READ BY ID: Obtener una marca
   */
  getBrandById(id: number): Observable<{ data: OamBrand }> {
    return this.http.get<{ data: OamBrand }>(`${this.baseUrl}/${id}`);
  }

  /**
   * CREATE: Crear marca
   */
  createBrand(payload: Partial<OamBrand>): Observable<{ message: string; data: OamBrand }> {
    return this.http.post<{ message: string; data: OamBrand }>(this.baseUrl, payload);
  }

  /**
   * UPDATE: Actualizar marca
   */
  updateBrand(
    id: number,
    payload: Partial<OamBrand>,
  ): Observable<{ message: string; data: OamBrand }> {
    return this.http.put<{ message: string; data: OamBrand }>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * DELETE: Eliminar marca
   */
  deleteBrand(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
