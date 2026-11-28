import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly baseUrl = `${environment.portfolioApi}`;
  //for improvement
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });
  private readonly apiClient = inject(HttpClient);

  async get<T>(endpoint: string) {
    const url = `${this.baseUrl}/${endpoint}`;
    return await firstValueFrom(this.apiClient.get<T>(url, { headers: this.headers }));
  }

  async post<T>(endpoint: string, body: object) {
    const url = `${this.baseUrl}/${endpoint}`;
    return await firstValueFrom(this.apiClient.post<T>(url, body, { headers: this.headers }));
  }

  async put<T>(endpoint: string, body: object) {
    const url = `${this.baseUrl}/${endpoint}`;
    return await firstValueFrom(this.apiClient.put<T>(url, body, { headers: this.headers }));
  }

  async delete<T>(endpoint: string) {
    const url = `${this.baseUrl}/${endpoint}`;
    return await firstValueFrom(this.apiClient.delete<T>(url, { headers: this.headers }));
  }
}
