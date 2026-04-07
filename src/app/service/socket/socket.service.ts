import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { UserState } from '../state/user_state/user-state';
import { Observable, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private userState = inject(UserState);
  private readonly baseUrl = environment.apiUrl;

  constructor() {
    this.userState.user$.subscribe(user => {
      if (user && user._id) {
        this.connect(user._id);
      } else {
        this.disconnect();
      }
    });
  }

  private connect(userId: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(this.baseUrl, {
      query: { userId },
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onEvent<T>(eventName: string): Observable<T> {
    if (!this.socket) {
      // Nếu chưa có socket, đợi 1 chút hoặc trả về stream rỗng
      // Ở đây dùng một trick để handle việc socket có thể null lúc init
      return new Observable<T>(subscriber => {
        const checkSocket = setInterval(() => {
          if (this.socket) {
            clearInterval(checkSocket);
            this.socket.on(eventName, (data: T) => subscriber.next(data));
          }
        }, 500);
      });
    }
    return fromEvent<T>(this.socket, eventName);
  }

  emit(eventName: string, data: any): void {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }
}
