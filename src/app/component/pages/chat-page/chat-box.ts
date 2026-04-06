import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatApi } from '../../../service/api_method/chat/chat';
import { UserState } from '../../../service/state/user_state/user-state';
import { ConversationState } from '../../../service/state/conversation_state/conversation-state';
import { Conversation } from '../../../interface/conversation';
import { Message } from '../../../interface/message';
import { User } from '../../../interface/user';
import { Navbar } from '../../shared/navbar/navbar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription, filter, take } from 'rxjs';

import { Conversations } from '../../shared/conversations/conversations';
import { MessagesWindow } from '../../shared/messages/messages';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Navbar,
    AvatarModule,
    ButtonModule,
    InputTextModule,
    PopoverModule,
    TooltipModule,
    Conversations,
    MessagesWindow
  ],
  templateUrl: './chat-box.html',
  styleUrl: './chat-box.css',
})
export class ChatPage implements OnInit, OnDestroy {
  private chatApi = inject(ChatApi);
  private userState = inject(UserState);
  private conversationState = inject(ConversationState);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  currentUser$ = this.userState.user$;
  currentUser: User | null = null;
  private userSub?: Subscription;

  conversations$ = this.conversationState.conversations$;
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  
  newMessage: string = '';
  editingMessage: Message | null = null;
  replyingToMessage: Message | null = null;

  ngOnInit(): void {
    this.userSub = this.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.conversationState.loadConversations().subscribe({
      next: () => {
        // Tự động chọn conversation đầu tiên nếu không có receiverId từ URL
        this.conversations$.pipe(
          filter(convs => convs.length > 0),
          take(1)
        ).subscribe(convs => {
          if (!this.selectedConversation && !this.route.snapshot.queryParams['receiverId']) {
            this.selectConversation(convs[0]);
          }
        });
      }
    });

    this.route.queryParams.subscribe(params => {
      const receiverId = params['receiverId'];
      if (receiverId) {
        this.startOrOpenConversation(receiverId);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  selectConversation(conv: Conversation) {
    if (!conv._id) {
      // New conversation with a friend
      this.selectedConversation = conv;
      this.messages = [];
      this.cdr.detectChanges();
      return;
    }

    this.selectedConversation = conv;
    this.chatApi.getMessageByConversation(conv._id).subscribe({
      next: (res) => {
        this.messages = [...res]; // Tạo reference mới để Angular phát hiện thay đổi
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi tải tin nhắn:', err)
    });
  }

  startOrOpenConversation(receiverId: string) {
    this.chatApi.getOrCreateConversation(receiverId).subscribe({
      next: (conv) => {
        this.conversationState.addOrUpdateConversation(conv);
        this.selectConversation(conv);
        this.cdr.detectChanges();
      }
    });
  }

  createGroup(data: {name: string, participants: string[]}) {
    this.chatApi.createGroup(data.name, data.participants).subscribe({
      next: (conv) => {
        this.conversationState.addOrUpdateConversation(conv);
        this.selectConversation(conv);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi tạo nhóm:', err)
    });
  }

  sendMessage(formData: FormData) {
    if (!this.selectedConversation || !this.currentUser) return;

    // Nếu là cuộc hội thoại mới (chưa có _id)
    if (!this.selectedConversation._id) {
      const receiver = this.selectedConversation.participants[0];
      this.chatApi.getOrCreateConversation(receiver._id).subscribe({
        next: (conv) => {
          this.selectedConversation = conv;
          this.conversationState.addOrUpdateConversation(conv);
          formData.set('conversationId', conv._id);
          this.executeSendMessage(formData);
        }
      });
    } else {
      this.executeSendMessage(formData);
    }
  }

  private executeSendMessage(formData: FormData) {
    if (this.editingMessage) {
      const content = formData.get('content') as string;
      this.chatApi.editMessage(this.editingMessage._id, content).subscribe({
        next: (updatedMsg) => {
          this.messages = this.messages.map(m => m._id === updatedMsg._id ? updatedMsg : m);
          this.resetInput();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.chatApi.sendMessage(formData).subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.resetInput();
          this.conversationState.updateLastMessage(this.selectedConversation!._id, msg);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteMessage(msgId: string) {
    this.chatApi.deleteMessage(msgId).subscribe({
      next: (res) => {
        this.messages = this.messages.map(m => 
          m._id === res.messageId ? { ...m, isDeleted: true, content: res.content, imageUrl: undefined } : m
        );
        this.cdr.detectChanges();
      }
    });
  }

  renameGroup(newName: string) {
    if (!this.selectedConversation) return;
    this.chatApi.renameGroup(this.selectedConversation._id, newName).subscribe({
      next: (updatedConv) => {
        this.selectedConversation = updatedConv;
        this.conversationState.addOrUpdateConversation(updatedConv);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi đổi tên nhóm:', err)
    });
  }

  startEdit(msg: Message) {
    this.editingMessage = msg;
    this.newMessage = msg.content;
    this.replyingToMessage = null;
    this.cdr.detectChanges();
  }

  startReply(msg: Message) {
    this.replyingToMessage = msg;
    this.editingMessage = null;
    this.newMessage = '';
    this.cdr.detectChanges();
  }

  resetInput() {
    this.newMessage = '';
    this.editingMessage = null;
    this.replyingToMessage = null;
    this.cdr.detectChanges();
  }
}
