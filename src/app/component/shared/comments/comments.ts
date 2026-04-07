import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, Input, ViewChild, OnInit, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserState } from '../../../service/state/user_state/user-state';
import { Comment } from '../../../interface/comment';
import { PostApi } from '../../../service/api_method/post/post';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TextareaModule } from 'primeng/textarea';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    FormsModule,
    ToastModule,
    RouterModule
  ],
  templateUrl: './comments.html',
  styleUrl: './comments.css',
  providers: [MessageService]
})
export class Comments implements AfterViewInit, OnInit {
  @Input() postId!: string;
  @Output() onCommentChange = new EventEmitter<number>();
  @ViewChild('bottom') bottom!: ElementRef;

  private postApiService = inject(PostApi);
  private userInfoState = inject(UserState);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  user$ = this.userInfoState.user$;

  page = 1;
  limit = 10;
  newCommentContent = '';
  replyingTo: string | null = null;
  replyContent = '';
  isSubmitting = false; // Trạng thái đang gửi comment
  isReplying = false;   // Trạng thái đang trả lời comment
  expandedComments: Set<string> = new Set(); // Lưu ID các comment đang mở rộng
  readonly COMMENT_THRESHOLD = 150; // Giới hạn ký tự cho comment

  commentsSubject = new BehaviorSubject<Comment[]>([]);
  comment$ = this.commentsSubject.asObservable();

  ngOnInit(): void {
    // Tải bình luận ngay khi component được khởi tạo
    this.loadMoreComment();
  }

  goToDetail(userId?: string) {
    if (userId) {
      this.router.navigate(['/friend-detail', userId]);
    }
  }

  // 1.Hàm dựng cây bình luận
  private buildCommentTree(flatComments: Comment[]): Comment[] {
    // Sắp xếp lại toàn bộ bình luận theo thời gian (Cũ nhất lên đầu)
    const sortedComments = [...flatComments].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();
      return timeA - timeB;
    });

    const map = new Map<string, Comment & { replies: Comment[] }>();
    const roots: Comment[] = [];

    // Initialize map with comments and empty replies array
    sortedComments.forEach(comment => {
      map.set(comment._id, { ...comment, replies: [] });
    });

    // Build the tree.
    sortedComments.forEach(comment => {
      const parentId = typeof comment.parentComment === 'string' 
        ? comment.parentComment 
        : (comment.parentComment as Comment)?._id;

      if (parentId && map.has(parentId)) {
        map.get(parentId)!.replies.push(map.get(comment._id)!);
      } else {
        roots.push(map.get(comment._id)!);
      }
    });

    return roots;
  }

  //2.Hàm gọi loadMoreComponent thêm comment khi cuộn.
  ngAfterViewInit(): void {
    // Sử dụng setTimeout để đảm bảo ViewChild đã sẵn sàng
    setTimeout(() => {
      if (!this.bottom) return;
      
      const scrollContainer = this.bottom.nativeElement.parentElement;
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          this.loadMoreComment();
        }
      }, { 
        root: scrollContainer,
        threshold: 0.1 
      });
      observer.observe(this.bottom.nativeElement);
    }, 500);
  }
  
  //3. Hàm load comment dựa theo page và limit tăng dần khi cuộn bởi hàm trên.
  loadMoreComment() {
    this.postApiService.getCommentById(this.postId, this.page.toString(), this.limit.toString()).subscribe({
      next: (res) => {
        const currentFlat = this.getAllCommentsFlat(this.commentsSubject.value);
        // Merge and prevent duplicates
        const existingIds = new Set(currentFlat.map(c => c._id));
        const filtered = res.filter(c => !existingIds.has(c._id));
        
        const updatedFlat = [...currentFlat, ...filtered];
        this.commentsSubject.next(this.buildCommentTree(updatedFlat));
        
        if (res.length > 0) {
          this.page += 1;
        }
        this.cdr.detectChanges();
      }
    })
  }

  //4. Hàm lấy tất cả các comment trong subject hiện tại
  private getAllCommentsFlat(tree: Comment[]): Comment[] {
    let flat: Comment[] = [];
    tree.forEach(c => {
      const { replies, ...commentData } = c;
      flat.push(commentData as Comment);
      if (replies && replies.length > 0) {
        flat = [...flat, ...this.getAllCommentsFlat(replies)];
      }
    });
    return flat;
  }

  //5. Hàm tạo comment mới
  submitComment() {
    if (!this.newCommentContent.trim() || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.cdr.detectChanges(); // Cập nhật UI ngay lập tức để hiện loading

    this.postApiService.createComment(this.postId, this.newCommentContent).subscribe({
      next: (comment) => {
        const currentFlat = this.getAllCommentsFlat(this.commentsSubject.value);
        const updatedFlat = [...currentFlat, comment];
        this.commentsSubject.next(this.buildCommentTree(updatedFlat));
        this.newCommentContent = '';
        this.onCommentChange.emit(1); 
        this.isSubmitting = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message || 'Không thể gửi bình luận' });
        this.cdr.detectChanges();
      }
    })
  }

  private scrollToBottom() {
    if (this.bottom && this.bottom.nativeElement) {
      this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  //6. Hàm tạo comment khi trả lời 1 comment khác.
  submitReply(parentCommentId: string) {
    if (!this.replyContent.trim() || this.isReplying) return;

    this.isReplying = true;
    this.cdr.detectChanges(); // Cập nhật UI ngay lập tức

    this.postApiService.createComment(this.postId, this.replyContent, parentCommentId).subscribe({
      next: (reply) => {
        const currentFlat = this.getAllCommentsFlat(this.commentsSubject.value);
        const updatedFlat = [...currentFlat, reply];
        this.commentsSubject.next(this.buildCommentTree(updatedFlat));
        this.replyContent = '';
        this.replyingTo = null;
        this.onCommentChange.emit(1); 
        this.isReplying = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isReplying = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message || 'Không thể trả lời bình luận' });
        this.cdr.detectChanges();
      }
    })
  }

  toggleReply(commentId: string) {
    this.replyingTo = this.replyingTo === commentId ? null : commentId;
    this.cdr.detectChanges();
  }
  
  //7. Hàm xoá comment.
  deleteComment(commentId: string) {
    this.postApiService.deleteComment(commentId).subscribe({
      next: (res) => {
        const currentFlat = this.getAllCommentsFlat(this.commentsSubject.value);
        const updatedFlat = currentFlat.map(c =>
          c._id === commentId ? { ...c, isDeleted: true, content: "Nội dung đã được thu hồi." } : c
        );
        this.commentsSubject.next(this.buildCommentTree(updatedFlat));
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: res });
        // Optional: you might not want to decrement count if "isDeleted" but still exists.
        // But for UI clarity, maybe decrement. Let's not decrement for now as the comment still exists as "withdrawn".
        this.cdr.detectChanges();
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message })
    })
  }

  isCommentExpanded(id: string): boolean {
    return this.expandedComments.has(id);
  }

  toggleCommentExpand(id: string) {
    if (this.expandedComments.has(id)) {
      this.expandedComments.delete(id);
    } else {
      this.expandedComments.add(id);
    }
    this.cdr.detectChanges();
  }

  getCommentContent(comment: Comment): string {
    if (!comment.content) return '';
    if (this.isCommentExpanded(comment._id) || comment.content.length <= this.COMMENT_THRESHOLD) {
      return comment.content;
    }
    return comment.content.substring(0, this.COMMENT_THRESHOLD) + '...';
  }

  shouldShowCommentSeeMore(comment: Comment): boolean {
    return (comment.content?.length ?? 0) > this.COMMENT_THRESHOLD;
  }

}
