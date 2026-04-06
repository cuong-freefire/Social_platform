import { inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, tap, interval, Subscription, startWith, switchMap } from 'rxjs';
import { NotificationApi } from '../../api_method/notification/notification';

export interface Notification {
  _id: string;
  sender: {
    _id: string;
    name: string;
    image?: string;
  };
  content: string;
  type: string;
  linkId?: string;
  onModel?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationState implements OnDestroy {
  private notificationApi = inject(NotificationApi);
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private pollingSubscription?: Subscription;

  loadNotifications() {
    return this.notificationApi.getNotifications().pipe(
      tap(res => {
        this.notificationsSubject.next(res.notifications);
        this.unreadCountSubject.next(res.unreadCount);
      })
    );
  }

  startPolling(intervalMs: number = 30000) { // Default 30s
    this.stopPolling();
    this.pollingSubscription = interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.notificationApi.getNotifications())
    ).subscribe({
      next: (res) => {
        this.notificationsSubject.next(res.notifications);
        this.unreadCountSubject.next(res.unreadCount);
      },
      error: (err) => console.error('Error polling notifications:', err)
    });
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  clearNotifications() {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  markAsRead(id: string) {
    return this.notificationApi.markAsRead(id).pipe(
      tap(() => {
        const currentNotifs = this.notificationsSubject.value.map(n => 
          n._id === id ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(currentNotifs);
        
        const currentUnread = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentUnread - 1));
      })
    );
  }

  markAllAsRead() {
    return this.notificationApi.markAllAsRead().pipe(
      tap(() => {
        const currentNotifs = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(currentNotifs);
        this.unreadCountSubject.next(0);
      })
    );
  }
}
