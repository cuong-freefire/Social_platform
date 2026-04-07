import { Component, inject, OnInit, Input, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { UserApi } from '../../../service/api_method/user/user';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../../interface/user';
import { Post as PostDto } from '../../../interface/post';
import { PostApi } from '../../../service/api_method/post/post';
import { UserState } from '../../../service/state/user_state/user-state';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Navbar } from '../../shared/navbar/navbar';
import { Post } from '../../shared/post/post';

@Component({
  selector: 'app-friend-detail',
  imports: [
    CommonModule, 
    AvatarModule, 
    ButtonModule, 
    ToastModule, 
    Navbar,
    RouterModule,
    PopoverModule,
    Post
  ],
  templateUrl: './friend-detail.html',
  styleUrl: './friend-detail.css',
  providers: [MessageService]
})
export class FriendDetail implements OnInit, OnChanges {
  @Input({ required: true }) id !: string;
  private userApi = inject(UserApi);
  private postApi = inject(PostApi);
  private userState = inject(UserState);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  user!: User | null;
  userPosts: PostDto[] = [];
  friendshipStatus: 'friend' | 'sent' | 'received' | 'none' | 'self' = 'none';
  requestId?: string;
  isLoadingPosts = false;
  isActionLoading = false;

  ngOnInit(): void {
    if (!this.id) {
      this.router.navigate(['/not_found']);
      return;
    }
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id'] && !changes['id'].firstChange) {
      this.loadData();
    }
  }

  loadData() {
    this.user = null;
    this.userPosts = [];
    this.cdr.detectChanges();

    // Load user info
    this.userApi.getUserInforById(this.id).subscribe({
      next: (res) => {
        this.user = res;
        this.checkFriendshipStatus();
        this.loadUserPosts();
        this.cdr.detectChanges();
      },
      error: () => this.router.navigate(['/not-found'])
    });
  }

  loadUserPosts() {
    this.isLoadingPosts = true;
    this.cdr.detectChanges();
    this.postApi.getAllPost('1', '10', this.id).subscribe({
      next: (posts) => {
        this.userPosts = posts;
        this.isLoadingPosts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Lỗi khi tải bài viết:", err);
        this.isLoadingPosts = false;
        this.cdr.detectChanges();
      }
    });
  }

  checkFriendshipStatus() {
    this.userApi.getFriendShipStatus(this.id).subscribe({
      next: (res) => {
        this.friendshipStatus = res.status;
        this.requestId = res.requestId;
        this.cdr.detectChanges();
      }
    });
  }

  onNavigateFriend(friendId: string) {
    this.router.navigate(['/friend-detail', friendId]);
  }

  onAddFriend() {
    if (this.isActionLoading) return;
    this.isActionLoading = true;
    this.cdr.detectChanges();

    this.userApi.sendFriendRequest(this.id).subscribe({
      next: (res: any) => {
        this.friendshipStatus = 'sent';
        this.requestId = res._id;
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã gửi lời mời kết bạn' });
        this.isActionLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isActionLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.error || 'Không thể gửi lời mời' });
        this.cdr.detectChanges();
      }
    });
  }

  onUnfriend() {
    if (this.isActionLoading) return;
    this.isActionLoading = true;
    this.cdr.detectChanges();

    this.userApi.unFriend(this.id).subscribe({
      next: () => {
        this.friendshipStatus = 'none';
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã hủy kết bạn' });
        this.isActionLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isActionLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.error || 'Không thể hủy kết bạn' });
        this.cdr.detectChanges();
      }
    });
  }

  onAcceptRequest() {
    if (!this.requestId || this.isActionLoading) return;
    this.isActionLoading = true;
    this.cdr.detectChanges();

    this.userApi.acceptFriendRequest(this.requestId).subscribe({
      next: (res) => {
        this.friendshipStatus = 'friend';
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã trở thành bạn bè' });
        this.isActionLoading = false;
        this.cdr.detectChanges();
        // Refresh global user state to update friend list
        this.userApi.getUserInfor().subscribe(u => this.userState.setUser(u));
      },
      error: (err) => {
        this.isActionLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.error || 'Không thể chấp nhận lời mời' });
        this.cdr.detectChanges();
      }
    });
  }

  onMessage() {
    this.router.navigate(['/chat'], { queryParams: { receiverId: this.id } });
  }
}
