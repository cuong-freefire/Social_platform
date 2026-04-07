import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../interface/message';
import { Conversation } from '../../../interface/conversation';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { User } from '../../../interface/user';
import { UserState } from '../../../service/state/user_state/user-state';

import { DialogModule } from 'primeng/dialog';

import { Router } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarModule, ButtonModule, InputTextModule, TooltipModule, DialogModule, MultiSelectModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class MessagesWindow implements AfterViewChecked {
  @Input() selectedConversation: Conversation | null = null;
  @Input() messages: Message[] = [];
  @Input() currentUserId?: string;
  @Input() newMessage: string = '';
  @Input() editingMsg: Message | null = null;
  @Input() replyingTo: Message | null = null;
  
  @Output() newMessageChange = new EventEmitter<string>();
  @Output() onSend = new EventEmitter<FormData>();
  @Output() onEdit = new EventEmitter<Message>();
  @Output() onDelete = new EventEmitter<string>();
  @Output() onReply = new EventEmitter<Message>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onRenameGroup = new EventEmitter<string>();
  @Output() onUpdateGroupImage = new EventEmitter<File>();
  @Output() onKickMember = new EventEmitter<string>();
  @Output() onDissolveGroup = new EventEmitter<void>();
  @Output() onAddMembers = new EventEmitter<string[]>();
  @Output() onLeaveGroup = new EventEmitter<{newAdminId?: string}>();

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private userState = inject(UserState);
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('groupImageInput') groupImageInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  
  displayRenameDialog: boolean = false;
  displayGroupInfoDialog: boolean = false;
  displayConfirmDialog: boolean = false;
  displayAddMemberDialog: boolean = false;
  displayAssignAdminDialog: boolean = false;
  
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmAction: 'kick' | 'dissolve' | 'leave' | null = null;
  pendingMemberId: string | null = null;
  newGroupName: string = '';
  
  friends: User[] = [];
  selectedFriends: User[] = [];
  selectedNewAdmin: User | null = null;

  constructor() {
    this.userState.user$.subscribe(user => {
      if (user && user.friends) {
        this.friends = user.friends;
      }
    });
  }

  get creatorName() {
    if (!this.selectedConversation) return 'Người dùng';
    if (this.selectedConversation.creator && typeof this.selectedConversation.creator === 'object') {
      return (this.selectedConversation.creator as any).name || 'Trưởng nhóm';
    }
    return 'Trưởng nhóm';
  }

  get creatorId() {
    if (!this.selectedConversation) return null;
    return typeof this.selectedConversation.creator === 'object' 
      ? this.selectedConversation.creator._id 
      : this.selectedConversation.creator;
  }

  get isCreator() {
    if (!this.selectedConversation || !this.currentUserId) return false;
    const creatorId = this.creatorId;
    if (!creatorId) {
      // Nếu nhóm chưa có creator, coi tất cả thành viên cũ là trưởng nhóm để có quyền thao tác
      return this.selectedConversation.participants.some(p => p._id === this.currentUserId);
    }
    return creatorId === this.currentUserId;
  }

  get otherParticipant() {
    if (this.selectedConversation?.isGroup) return null;
    return this.selectedConversation?.participants.find(p => p._id !== this.currentUserId);
  }

  get conversationName() {
    if (this.selectedConversation?.isGroup) return this.selectedConversation.groupName;
    return this.otherParticipant?.name;
  }

  get conversationImage() {
    if (this.selectedConversation?.isGroup) return this.selectedConversation.groupImage || 'https://primefaces.org/cdn/primeng/images/demo/avatar/ionitcu.png';
    return this.otherParticipant?.image || 'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png';
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.fileInput.nativeElement.value = '';
  }

  handleSend() {
    if (!this.newMessage.trim() && !this.selectedFile) return;

    const formData = new FormData();
    if (this.newMessage.trim()) formData.append('content', this.newMessage.trim());
    if (this.selectedFile) formData.append('image', this.selectedFile);
    if (this.replyingTo) formData.append('parentMessageId', this.replyingTo._id);
    if (this.selectedConversation) formData.append('conversationId', this.selectedConversation._id);

    this.onSend.emit(formData);
    this.clearSelectedFile();
  }

  openRenameDialog() {
    if (this.selectedConversation?.isGroup) {
      this.newGroupName = this.selectedConversation.groupName || '';
      this.displayRenameDialog = true;
    }
  }

  submitRename() {
    if (this.newGroupName.trim() && this.newGroupName !== this.selectedConversation?.groupName) {
      this.onRenameGroup.emit(this.newGroupName.trim());
    }
    this.displayRenameDialog = false;
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  openGroupInfo() {
    if (this.selectedConversation?.isGroup) {
      this.displayGroupInfoDialog = true;
    }
  }

  triggerGroupImageInput() {
    this.groupImageInput.nativeElement.click();
  }

  onGroupImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Xem trước ngay lập tức để người dùng thấy phản hồi
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.selectedConversation) {
          this.selectedConversation = { ...this.selectedConversation, groupImage: e.target.result };
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
      
      this.onUpdateGroupImage.emit(file);
    }
  }

  kickMember(memberId: string) {
    this.confirmTitle = 'Xác nhận xóa thành viên';
    this.confirmMessage = 'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?';
    this.confirmAction = 'kick';
    this.pendingMemberId = memberId;
    this.displayConfirmDialog = true;
  }

  dissolveGroup() {
    this.confirmTitle = 'Xác nhận giải tán nhóm';
    this.confirmMessage = 'Bạn có chắc chắn muốn giải tán nhóm này? Toàn bộ tin nhắn sẽ bị xóa.';
    this.confirmAction = 'dissolve';
    this.displayConfirmDialog = true;
  }

  confirmExecution() {
    if (this.confirmAction === 'kick' && this.pendingMemberId) {
      this.displayGroupInfoDialog = false;
      this.onKickMember.emit(this.pendingMemberId);
    } else if (this.confirmAction === 'dissolve') {
      this.displayGroupInfoDialog = false;
      this.onDissolveGroup.emit();
    } else if (this.confirmAction === 'leave') {
      this.handleLeaveLogic();
    }
    this.closeConfirmDialog();
  }

  leaveGroup() {
    this.confirmTitle = 'Xác nhận rời nhóm';
    this.confirmMessage = 'Bạn có chắc chắn muốn rời khỏi nhóm này?';
    this.confirmAction = 'leave';
    this.displayConfirmDialog = true;
  }

  private handleLeaveLogic() {
    if (this.isCreator && this.selectedConversation && this.selectedConversation.participants.length > 1) {
      // Trưởng nhóm phải chỉ định admin mới
      this.displayAssignAdminDialog = true;
    } else {
      // Thành viên bình thường hoặc trưởng nhóm của nhóm 1 người
      this.displayGroupInfoDialog = false;
      this.onLeaveGroup.emit({});
    }
  }

  submitAssignAdmin() {
    if (this.selectedNewAdmin) {
      this.displayGroupInfoDialog = false;
      this.displayAssignAdminDialog = false;
      this.onLeaveGroup.emit({ newAdminId: this.selectedNewAdmin._id });
    }
  }

  get otherMembers() {
    if (!this.selectedConversation || !this.currentUserId) return [];
    return this.selectedConversation.participants.filter(p => p._id !== this.currentUserId);
  }

  closeConfirmDialog() {
    this.displayConfirmDialog = false;
    this.confirmAction = null;
    this.pendingMemberId = null;
  }

  openAddMemberDialog() {
    this.selectedFriends = [];
    this.displayAddMemberDialog = true;
  }

  submitAddMembers() {
    if (this.selectedFriends.length > 0) {
      const ids = this.selectedFriends.map(f => f._id);
      this.onAddMembers.emit(ids);
      this.displayAddMemberDialog = false;
    }
  }

  get availableFriends() {
    if (!this.selectedConversation) return [];
    const participantIds = this.selectedConversation.participants.map(p => p._id);
    return this.friends.filter(f => !participantIds.includes(f._id));
  }

  viewUserDetail(userId: string) {
    this.displayGroupInfoDialog = false;
    this.router.navigate(['/friend-detail', userId]);
  }
}
