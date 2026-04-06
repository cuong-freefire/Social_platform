import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);

  login(data: any) {
    return this.http.post('http://localhost:3000/auth/login', data).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message))
      })
    )
  }

  register(data: any) {
    return this.http.post('http://localhost:3000/auth/register', data).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message))
      })
    )
  }

  logout() {
    return this.http.post('http://localhost:3000/auth/logout', {}).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }
}
