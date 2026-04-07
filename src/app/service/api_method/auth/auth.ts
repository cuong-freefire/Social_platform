import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(data: any) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(res => {
        if (res.token && typeof window !== 'undefined') {
          localStorage.setItem('token', res.token);
        }
      }),
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
      tap(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }),
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }
}
