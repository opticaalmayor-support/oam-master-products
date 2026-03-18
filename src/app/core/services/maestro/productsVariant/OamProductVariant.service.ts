import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiUrl } from '../../../config/api.config';
import { OamProductVariant, VariantQueryParams } from '../../../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class OamProductVariantService {
  constructor(private http: HttpClient) {}

  private get baseUrl(): string {
    return getApiUrl('OamProductVariant');
  }

  getVariants(filters: VariantQueryParams = {}): Observable<any> {
    let params = new HttpParams();

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

  getVariantById(id: number): Observable<{ data: OamProductVariant }> {
    return this.http.get<{ data: OamProductVariant }>(`${this.baseUrl}/${id}`);
  }

  createVariant(
    variant: Partial<OamProductVariant>,
  ): Observable<{ message: string; data: OamProductVariant }> {
    return this.http.post<{ message: string; data: OamProductVariant }>(this.baseUrl, variant);
  }

  updateVariant(
    id: number,
    variant: Partial<OamProductVariant>,
  ): Observable<{ message: string; data: OamProductVariant }> {
    return this.http.put<{ message: string; data: OamProductVariant }>(
      `${this.baseUrl}/${id}`,
      variant,
    );
  }

  deleteVariant(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  getVariantsByMaster(productMasterId: number, perPage: number = 15): Observable<any> {
    const url = getApiUrl('OamProductVariantByMaster', { productMasterId });
    const params = new HttpParams().set('per_page', String(perPage));

    return this.http.get<any>(url, { params });
  }

  uploadVariantMedia(
    productMasterId: number,
    variantSku: string,
    files: File[],
  ): Observable<{
    primary_image_url: string | null;
    gallery_urls: string[];
  }> {
    const url = getApiUrl('OamProductVariantUploadMedia');
    const formData = new FormData();

    formData.append('product_master_id', String(productMasterId));
    formData.append('variant_sku', variantSku);

    files.forEach((file) => {
      formData.append('files[]', file);
    });

    return this.http.post<{
      primary_image_url: string | null;
      gallery_urls: string[];
    }>(url, formData);
  }
}
