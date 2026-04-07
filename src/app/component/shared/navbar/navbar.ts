import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RippleModule } from 'primeng/ripple';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { UserState} from '../../../service/state/user_state/user-state';
import { Auth } from '../../../service/api_method/auth/auth';
import { UserInfo } from '../user-info/user-info';
import { PostsState } from '../../../service/state/posts_state/posts-state';
import { NotificationState, Notification } from '../../../service/state/notification_state/notification-state';
import { ConversationState } from '../../../service/state/conversation_state/conversation-state';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { UserApi } from '../../../service/api_method/user/user';
import { User } from '../../../interface/user';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive,
    MenubarModule,
    AvatarModule,
    BadgeModule,
    OverlayBadgeModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    RippleModule,
    CommonModule,
    ButtonModule,
    ToastModule,
    PopoverModule,
    UserInfo,
    AutoCompleteModule,
    FormsModule
  ],
  providers: [MessageService],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  items: MenuItem[] | undefined;
  private router = inject(Router);
  private messageService = inject(MessageService);
  private userInfoState = inject(UserState);
  private postsState = inject(PostsState);
  private notificationState = inject(NotificationState);
  private conversationState = inject(ConversationState);
  private authApi = inject(Auth);
  private userApi = inject(UserApi);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  user$ = this.userInfoState.user$;
  notifications$ = this.notificationState.notifications$;
  unreadCount$ = this.notificationState.unreadCount$;
  isPopoverVisible = false;
  showMobileSearch = false;

  // Search state
  searchQuery: string = '';
  searchResults: User[] = [];

  onSearch(event: any) {
    const query = event.query;
    if (!query || query.trim().length < 1) {
      this.searchResults = [];
      this.cdr.detectChanges();
      return;
    }

    this.userApi.searchUsers(query).subscribe({
      next: (users) => {
        this.searchResults = [...users];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Search error:", err);
      }
    });
  }

  onSelectUser(event: any) {
    const user = event.value;
    if (user && user._id) {
      this.router.navigate(['/friend-detail', user._id]);
      this.searchQuery = '';
    }
  }

  onNotificationClick(notif: Notification) {
    // Đánh dấu đã đọc
    if (!notif.isRead) {
      this.notificationState.markAsRead(notif._id).subscribe();
    }

    this.ngZone.run(() => {
      // Điều hướng dựa trên loại thông báo
      switch (notif.type) {
        case 'LIKE_POST':
        case 'DISLIKE_POST':
        case 'COMMENT':
        case 'REPLY':
          if (notif.linkId) {
            this.router.navigate(['/post', notif.linkId]);
          }
          break;
        case 'FRIEND_REQUEST':
          this.router.navigate(['/friends']);
          break;
        case 'FRIEND_ACCEPT':
        if (notif.sender && notif.sender._id) {
          this.router.navigate(['/friend-detail', notif.sender._id]);
        }
        break;
      case 'NEW_MESSAGE':
        if (notif.linkId) {
          this.router.navigate(['/chat'], { queryParams: { receiverId: notif.linkId } });
        } else {
          this.router.navigate(['/chat']);
        }
        break;
      default:
        this.router.navigate(['/']);
    }
    });
  }

  markAllAsRead() {
    this.notificationState.markAllAsRead().subscribe();
  }


  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user) {
        this.notificationState.startPolling();
      } else {
        this.notificationState.stopPolling();
      }
    });

    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        routerLink: '/'
      },
      {
        label: 'Friends',
        icon: 'pi pi-users',
        routerLink: '/friends'
      },
      {
        label: 'Chat',
        icon: 'pi pi-comments',
        routerLink: '/chat'
      },
      {
        label: 'About',
        icon: 'pi pi-info-circle',
        routerLink: '/about'
      },
    ]

  }

  logout() {
    this.notificationState.stopPolling();
    this.notificationState.clearNotifications();
    this.userInfoState.clearUser();
    this.postsState.clearPosts();
    this.conversationState.clear();
    
    this.authApi.logout().subscribe({
      next: (res) => console.log(res),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message })
    });
    this.router.navigate(['login']);
  }
}
