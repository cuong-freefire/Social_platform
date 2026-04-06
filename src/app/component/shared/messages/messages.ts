import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../../interface/message';
import { Conversation } from '../../../interface/conversation';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarModule, ButtonModule, InputTextModule, TooltipModule, DialogModule],
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

  private cdr = inject(ChangeDetectorRef);
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  
  displayRenameDialog: boolean = false;
  newGroupName: string = '';

  get otherParticipant() {
    if (this.selectedConversation?.isGroup) return null;
    return this.selectedConversation?.participants.find(p => p._id !== this.currentUserId);
  }

  get conversationName() {
    if (this.selectedConversation?.isGroup) return this.selectedConversation.groupName;
    return this.otherParticipant?.name;
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
        this.cdr.detectChanges(); // Ép Angular cập nhật UI ngay lập tức
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
}
