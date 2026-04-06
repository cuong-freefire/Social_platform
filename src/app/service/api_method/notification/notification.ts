import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationApi {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/notification';

  getNotifications() {
    return this.http.get<any>(this.apiUrl, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error?.error || 'Không thể lấy thông báo';
        return throwError(() => new Error(message));
      })
    );
  }

  markAsRead(id: string) {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error?.error || 'Không thể đánh dấu đã đọc';
        return throwError(() => new Error(message));
      })
    );
  }

  markAllAsRead() {
    return this.http.patch(`${this.apiUrl}/read-all`, {}, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error?.error || 'Không thể đánh dấu tất cả đã đọc';
        return throwError(() => new Error(message));
      })
    );
  }
}
