import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(data: any) {
    return this.http.post(`${this.apiUrl}/auth/login`, data).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message))
      })
    )
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/auth/register`, data).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message))
      })
    )
  }

  logout() {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }
}
