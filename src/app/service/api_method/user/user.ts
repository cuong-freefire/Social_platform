import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError, map } from 'rxjs';
import { User } from '../../../interface/user';
import { UpdateUserResponse } from '../../../interface/update-user-response';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  //Lấy thông tin người dùng
  getUserInfor() {
    return this.http.get<{ userObject: User }>(`${this.apiUrl}/user/me`).pipe(
      map(res => res.userObject),
      catchError(err => {
        const message = err.error?.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message))
      })
    )
  }

  getUserInforById(id: string) {
    return this.http.get<{ userObject: User }>(`${this.apiUrl}/user/${id}`).pipe(
      map(res => res.userObject),
      catchError(err => {
        const message = err.error?.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message))
      })
    )
  }

  updateUserInfor(data: FormData) {
    return this.http.patch<UpdateUserResponse>(`${this.apiUrl}/user/update`, data).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }

  unFriend(id: string) {
    return this.http.delete<User>(`${this.apiUrl}/user/unfriend/${id}`).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }

  sendFriendRequest(id: string) {
    return this.http.post<string>(`${this.apiUrl}/user/send_request`, { id }).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }

  getFriendRequests() {
    return this.http.get<any[]>(`${this.apiUrl}/user/friend_requests`).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }

  acceptFriendRequest(requestId: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/user/accept_request/${requestId}`, {}).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }

  getFriendShipStatus(targetId: string) {
    return this.http.get<{ status: 'friend' | 'sent' | 'received' | 'none' | 'self', requestId?: string }>(`${this.apiUrl}/user/ship_status/${targetId}`, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }

  searchUsers(query: string) {
    return this.http.get<User[]>(`${this.apiUrl}/user/search?q=${query}`, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || 'Có lỗi xảy ra';
        return throwError(() => new Error(message));
      })
    )
  }
}
