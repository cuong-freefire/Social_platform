import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { SocketService } from '../../../service/socket/socket.service';

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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private socketService = inject(SocketService);

  currentUser$ = this.userState.user$;
  currentUser: User | null = null;
  private userSub?: Subscription;
  private socketSubs: Subscription[] = [];
  private resizeListener = () => this.checkMobile();

  conversations$ = this.conversationState.conversations$;
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  
  // Mobile responsive state
  showConversationList: boolean = true;
  isMobile: boolean = false;
  
  newMessage: string = '';
  editingMessage: Message | null = null;
  replyingToMessage: Message | null = null;
  isSendingMessage: boolean = false;
  isLoadingMessages: boolean = false;

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', this.resizeListener);
    
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
            if (!this.isMobile) {
              this.selectConversation(convs[0]);
            }
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

    this.listenToSocket();
  }

  private listenToSocket() {
    // Listen for new messages
    const newMsgSub = this.socketService.onEvent<Message>('newMessage').subscribe(msg => {
      // If message belongs to current selected conversation, add it to list
      if (this.selectedConversation && this.selectedConversation._id === msg.conversation) {
        // Tránh trùng lặp nếu là tin nhắn chính mình gửi (đã được add manual ở executeSendMessage)
        if (!this.messages.find(m => m._id === msg._id)) {
          this.messages = [...this.messages, msg];
          this.cdr.detectChanges();
        }
      }
      
      // Always update last message in conversation list
      this.conversationState.updateLastMessage(msg.conversation, msg);
    });

    // Listen for edited messages
    const editMsgSub = this.socketService.onEvent<Message>('messageEdited').subscribe(msg => {
      if (this.selectedConversation && this.selectedConversation._id === msg.conversation) {
        this.messages = this.messages.map(m => m._id === msg._id ? msg : m);
        this.cdr.detectChanges();
      }
    });

    // Listen for deleted messages
    const deleteMsgSub = this.socketService.onEvent<{messageId: string, isDeleted: boolean, content: string}>('messageDeleted').subscribe(data => {
      this.messages = this.messages.map(m => 
        m._id === data.messageId ? { ...m, isDeleted: data.isDeleted, content: data.content, imageUrl: undefined } : m
      );
      this.cdr.detectChanges();
    });

    this.socketSubs.push(newMsgSub, editMsgSub, deleteMsgSub);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.socketSubs.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', this.resizeListener);
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.showConversationList = true;
    }
  }

  selectConversation(conv: Conversation) {
    if (this.isMobile) {
      this.showConversationList = false;
    }
    
    if (!conv._id) {
      this.selectedConversation = conv;
      this.messages = [];
      this.cdr.detectChanges();
      return;
    }

    this.selectedConversation = conv;
    this.loadMessages(conv._id);
  }

  backToList() {
    this.showConversationList = true;
    this.selectedConversation = null;
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
    if (!this.selectedConversation || !this.currentUser || this.isSendingMessage) return;

    this.isSendingMessage = true;
    this.cdr.detectChanges(); // Hiện loading ngay lập tức

    if (!this.selectedConversation._id) {
      const receiver = this.selectedConversation.participants[0];
      this.chatApi.getOrCreateConversation(receiver._id).subscribe({
        next: (conv) => {
          this.selectedConversation = conv;
          this.conversationState.addOrUpdateConversation(conv);
          formData.set('conversationId', conv._id);
          this.executeSendMessage(formData);
        },
        error: (err) => {
          this.isSendingMessage = false;
          console.error('Lỗi tạo cuộc trò chuyện:', err);
          this.cdr.detectChanges();
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
          this.isSendingMessage = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSendingMessage = false;
          console.error('Lỗi sửa tin nhắn:', err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.chatApi.sendMessage(formData).subscribe({
        next: (msg) => {
          this.messages = [...this.messages, msg];
          this.resetInput();
          this.conversationState.updateLastMessage(this.selectedConversation!._id, msg);
          this.isSendingMessage = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSendingMessage = false;
          console.error('Lỗi gửi tin nhắn:', err);
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

  updateGroupImage(file: File) {
    if (!this.selectedConversation) return;
    this.chatApi.updateGroupImage(this.selectedConversation._id, file).subscribe({
      next: (updatedConv) => {
        this.selectedConversation = updatedConv;
        this.conversationState.addOrUpdateConversation(updatedConv);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi cập nhật ảnh nhóm:', err)
    });
  }

  kickMember(userId: string) {
    if (!this.selectedConversation) return;
    this.chatApi.kickMember(this.selectedConversation._id, userId).subscribe({
      next: (updatedConv) => {
        this.selectedConversation = updatedConv;
        this.conversationState.addOrUpdateConversation(updatedConv);
        this.loadMessages(updatedConv._id);
      },
      error: (err) => console.error('Lỗi xóa thành viên:', err)
    });
  }

  addMembers(memberIds: string[]) {
    if (!this.selectedConversation) return;
    this.chatApi.addMembers(this.selectedConversation._id, memberIds).subscribe({
      next: (updatedConv) => {
        this.selectedConversation = updatedConv;
        this.conversationState.addOrUpdateConversation(updatedConv);
        this.loadMessages(updatedConv._id);
      },
      error: (err) => console.error('Lỗi thêm thành viên:', err)
    });
  }

  leaveGroup(data: { newAdminId?: string }) {
    if (!this.selectedConversation) return;
    this.chatApi.leaveGroup(this.selectedConversation._id, data.newAdminId).subscribe({
      next: (res: any) => {
        this.conversationState.loadConversations().subscribe();
        this.selectedConversation = null;
        this.messages = [];
        if (this.isMobile) {
          this.showConversationList = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi khi rời nhóm:', err)
    });
  }

  private loadMessages(conversationId: string) {
    this.isLoadingMessages = true;
    this.cdr.detectChanges();
    
    this.chatApi.getMessageByConversation(conversationId).subscribe({
      next: (res) => {
        this.messages = [...res];
        this.isLoadingMessages = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải tin nhắn:', err);
        this.isLoadingMessages = false;
        this.cdr.detectChanges();
      }
    });
  }

  dissolveGroup() {
    if (!this.selectedConversation) return;
    this.chatApi.dissolveGroup(this.selectedConversation._id).subscribe({
      next: () => {
        this.conversationState.loadConversations().subscribe();
        this.selectedConversation = null;
        this.messages = [];
        if (this.isMobile) {
          this.showConversationList = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi giải tán nhóm:', err)
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
