import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../../interface/conversation';
import { AvatarModule } from 'primeng/avatar';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { UserState } from '../../../service/state/user_state/user-state';
import { User } from '../../../interface/user';
import { ChatApi } from '../../../service/api_method/chat/chat';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, AvatarModule, FormsModule, InputTextModule, ButtonModule, DialogModule, MultiSelectModule],
  templateUrl: './conversations.html',
  styleUrl: './conversations.css'
})
export class Conversations implements OnInit {
  @Input() conversations: Conversation[] = [];
  @Input() selectedId?: string;
  @Input() currentUserId?: string;
  @Output() onSelect = new EventEmitter<Conversation>();
  @Output() onCreateGroup = new EventEmitter<{name: string, participants: string[]}>();

  private userState = inject(UserState);
  friends: User[] = [];
  
  searchQuery: string = '';
  displayCreateGroup: boolean = false;
  newGroupName: string = '';
  selectedFriends: User[] = [];

  ngOnInit() {
    this.userState.user$.subscribe(user => {
      if (user && user.friends) {
        this.friends = user.friends;
      }
    });
  }

  get filteredConversations() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.conversations;
    
    return this.conversations.filter(conv => {
      const name = conv.isGroup ? conv.groupName : this.getOtherParticipant(conv)?.name;
      return name?.toLowerCase().includes(query);
    });
  }

  get friendSearchResults() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return [];
    
    // Tìm những người bạn mà chưa có hội thoại 1-1 trong list hiện tại
    return this.friends.filter(friend => {
      const hasConv = this.conversations.some(conv => 
        !conv.isGroup && conv.participants.some(p => p._id === friend._id)
      );
      return !hasConv && friend.name?.toLowerCase().includes(query);
    });
  }

  getOtherParticipant(conv: Conversation) {
    if (conv.isGroup) return null;
    return conv.participants.find(p => p._id !== this.currentUserId);
  }

  openCreateGroup() {
    this.displayCreateGroup = true;
    this.newGroupName = '';
    this.selectedFriends = [];
  }

  submitCreateGroup() {
    if (!this.newGroupName.trim() || !this.selectedFriends.length) return;
    this.onCreateGroup.emit({
      name: this.newGroupName.trim(),
      participants: this.selectedFriends.map(f => f._id)
    });
    this.displayCreateGroup = false;
  }
}
