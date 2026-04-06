import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { Conversation } from '../../../interface/conversation';
import { ChatApi } from '../../api_method/chat/chat';
import { Message } from '../../../interface/message';

@Injectable({
  providedIn: 'root',
})
export class ConversationState {
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  conversations$ = this.conversationsSubject.asObservable();
  private chatApi = inject(ChatApi);

  loadConversations() {
    return this.chatApi.getAllConversation().pipe(
      tap((conversations) => {
        this.conversationsSubject.next(conversations);
      })
    )
  }

  updateLastMessage(conversationId: string, message: Message) {
    const current = this.conversationsSubject.getValue();
    const idx = current.findIndex(c => c._id === conversationId);
    if (idx !== -1) {
      const updated = { ...current[idx], lastMessage: message, updatedAt: new Date().toISOString() };
      const newList = [...current];
      newList.splice(idx, 1);
      this.conversationsSubject.next([updated, ...newList]);
    }
  }

  addOrUpdateConversation(conv: Conversation) {
    const current = this.conversationsSubject.getValue();
    const exists = current.find(c => c._id === conv._id);
    if (!exists) {
      this.conversationsSubject.next([conv, ...current]);
    } else {
      // Nếu đã tồn tại, đẩy lên đầu
      const newList = current.filter(c => c._id !== conv._id);
      this.conversationsSubject.next([conv, ...newList]);
    }
  }

  clear() {
    this.conversationsSubject.next([]);
  }
}
