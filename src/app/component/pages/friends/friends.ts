import { Component, inject, OnInit } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { UserState } from '../../../service/state/user_state/user-state';
import { UserApi } from '../../../service/api_method/user/user';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-friends',
  imports: [
    Navbar, 
    CommonModule, 
    AvatarModule, 
    ButtonModule, 
    TabsModule, 
    RouterModule,
    ToastModule
  ],
  templateUrl: './friends.html',
  styleUrl: './friends.css',
  providers: [MessageService]
})
export class Friends implements OnInit {
  private userState = inject(UserState);
  private userApi = inject(UserApi);
  private router = inject(Router);
  private messageService = inject(MessageService);

  user$ = this.userState.user$;
  friendRequests: any[] = [];

  ngOnInit() {
    this.loadFriendRequests();
  }

  loadFriendRequests() {
    this.userApi.getFriendRequests().subscribe({
      next: (res) => {
        this.friendRequests = res;
      }
    });
  }

  onUnfriend(friendId: string) {
    this.userApi.unFriend(friendId).subscribe({
      next: (updatedUser) => {
        this.userState.setUser(updatedUser);
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã hủy kết bạn' });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message });
      }
    });
  }

  onAcceptRequest(requestId: string) {
    this.userApi.acceptFriendRequest(requestId).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: res.message });
        this.loadFriendRequests();
        // Refresh user info to update friend list
        this.userApi.getUserInfor().subscribe(user => this.userState.setUser(user));
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message });
      }
    });
  }

  goToDetail(userId: string) {
    this.router.navigate(['/friend-detail', userId]);
  }
}
