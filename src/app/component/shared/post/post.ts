import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserState } from '../../../service/state/user_state/user-state';
import { User } from '../../../interface/user';
import { Post as PostDto } from '../../../interface/post';
import { PostsState } from '../../../service/state/posts_state/posts-state';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Comments } from '../comments/comments';
import { Router, RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    ToastModule,
    CommonModule,
    CardModule,
    AvatarModule,
    ButtonModule,
    Comments,
    RouterModule,
    ConfirmDialogModule
  ],
  templateUrl: './post.html',
  styleUrl: './post.css',
  providers: [MessageService, ConfirmationService]
})
export class Post implements OnInit {
  @Input() post!: PostDto;
  @Input() showComments = false;
  
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private userInfoState = inject(UserState);
  private postsState = inject(PostsState);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  user$ = this.userInfoState.user$;
  user!: User | null;

  isDeleting = false;
  isLiking = false;
  isExpanded = false;
  readonly CONTENT_THRESHOLD = 300; // Số ký tự tối đa trước khi ẩn

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      this.user = user;
      this.cdr.detectChanges();
    });
  }

  get isOwner(): boolean {
    if (!this.user || !this.post) return false;
    return this.post.user?._id === this.user?._id || this.user.role === 'admin';
  }

  deletePost() {
    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn xóa bài viết này không?',
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isDeleting = true;
        this.cdr.detectChanges();

        this.postsState.deletePost(this.post._id).subscribe({
          next: () => {
            this.isDeleting = false;
            this.cdr.detectChanges();
            this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa bài viết' });
          },
          error: (err) => {
            this.isDeleting = false;
            this.cdr.detectChanges();
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message });
          }
        });
      }
    });
  }

  goToDetail(userId?: string) {
    if (userId) {
      this.router.navigate(['/friend-detail', userId]);
    }
  }

  isLiked(): boolean {
    return this.post.likes?.some(u => u._id === this.user?._id) ?? false;
  }

  isDisliked(): boolean {
    return this.post.dislikes?.some(u => u._id === this.user?._id) ?? false;
  }

  onLike(action: 'like' | 'dislike') {
    if (this.isLiking) return;
    
    this.isLiking = true;
    this.cdr.detectChanges();

    this.postsState.likepost(this.post._id, action).subscribe({
      next: (updatedPost) => {
        this.post = updatedPost;
        this.isLiking = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLiking = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message });
        this.cdr.detectChanges();
      }
    })
  }

  toggleComments() {
    this.showComments = !this.showComments;
    this.cdr.detectChanges();
  }

  updateCommentCount(change: number) {
    if (this.post) {
      this.post.commentCount = (this.post.commentCount ?? 0) + change;
      this.cdr.detectChanges();
    }
  }

  get displayedContent(): string {
    if (!this.post?.content) return '';
    if (this.isExpanded || this.post.content.length <= this.CONTENT_THRESHOLD) {
      return this.post.content;
    }
    return this.post.content.substring(0, this.CONTENT_THRESHOLD) + '...';
  }

  get shouldShowSeeMore(): boolean {
    return (this.post?.content?.length ?? 0) > this.CONTENT_THRESHOLD;
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.cdr.detectChanges();
  }
}
