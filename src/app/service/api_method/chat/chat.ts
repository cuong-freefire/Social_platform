import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Conversation } from '../../../interface/conversation';
import { Message } from '../../../interface/message';

@Injectable({
  providedIn: 'root',
})
export class ChatApi {
  private http = inject(HttpClient);

  getAllConversation() {
    return this.http.get<Conversation[]>(`http://localhost:3000/chat/conversation/all`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  getOrCreateConversation(receiverId: string) {
    return this.http.post<Conversation>(`http://localhost:3000/chat/conversation/get-or-create`, { receiverId }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  getMessageByConversation(conversationId: string) {
    return this.http.get<Message[]>(`http://localhost:3000/chat/message/all/${conversationId}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  sendMessage(formData: FormData) {
    return this.http.post<Message>(`http://localhost:3000/chat/message/send_message`, formData).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  createGroup(groupName: string, participants: string[]) {
    return this.http.post<Conversation>(`http://localhost:3000/chat/conversation/create-group`, { groupName, participants }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  editMessage(messageId: string, content: string) {
    return this.http.patch<Message>(`http://localhost:3000/chat/message/edit`, { messageId, content }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  deleteMessage(messageId: string) {
    return this.http.delete<{ messageId: string, isDeleted: boolean, content: string }>(`http://localhost:3000/chat/message/delete/${messageId}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  renameGroup(conversationId: string, newGroupName: string) {
    return this.http.patch<Conversation>(`http://localhost:3000/chat/conversation/rename-group`, { conversationId, newGroupName }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }
}
