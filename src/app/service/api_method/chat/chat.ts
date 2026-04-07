import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Conversation } from '../../../interface/conversation';
import { Message } from '../../../interface/message';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllConversation() {
    return this.http.get<Conversation[]>(`${this.apiUrl}/chat/conversation/all`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  getOrCreateConversation(receiverId: string) {
    return this.http.post<Conversation>(`${this.apiUrl}/chat/conversation/get-or-create`, { receiverId }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  getMessageByConversation(conversationId: string) {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/message/all/${conversationId}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  sendMessage(formData: FormData) {
    return this.http.post<Message>(`${this.apiUrl}/chat/message/send_message`, formData).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  createGroup(groupName: string, participants: string[]) {
    return this.http.post<Conversation>(`${this.apiUrl}/chat/conversation/create-group`, { groupName, participants }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  editMessage(messageId: string, content: string) {
    return this.http.patch<Message>(`${this.apiUrl}/chat/message/edit`, { messageId, content }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  deleteMessage(messageId: string) {
    return this.http.delete<{ messageId: string, isDeleted: boolean, content: string }>(`${this.apiUrl}/chat/message/delete/${messageId}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  renameGroup(conversationId: string, newGroupName: string) {
    return this.http.patch<Conversation>(`${this.apiUrl}/chat/conversation/rename-group`, { conversationId, newGroupName }, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  updateGroupImage(conversationId: string, image: File) {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('image', image);
    return this.http.patch<Conversation>(`${this.apiUrl}/chat/conversation/update-group-image`, formData, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  kickMember(conversationId: string, memberId: string) {
    return this.http.post<Conversation>(`${this.apiUrl}/chat/conversation/kick-member`, { conversationId, memberId }, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  addMembers(conversationId: string, memberIds: string[]) {
    return this.http.post<Conversation>(`${this.apiUrl}/chat/conversation/add-members`, { conversationId, memberIds }, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  leaveGroup(conversationId: string, newAdminId?: string) {
    return this.http.post<Conversation | { message: string, conversationId: string }>(`${this.apiUrl}/chat/conversation/leave`, { conversationId, newAdminId }, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  dissolveGroup(conversationId: string) {
    return this.http.delete<{ message: string, conversationId: string }>(`${this.apiUrl}/chat/conversation/dissolve/${conversationId}`, { withCredentials: true }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }
}
