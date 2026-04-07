import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { PostsState } from '../../../service/state/posts_state/posts-state';
import { CommonModule } from '@angular/common';
import { Post } from '../../shared/post/post';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';


@Component({
  selector: 'app-home',
  imports: [
    Navbar, 
    CommonModule, 
    Post, 
    ButtonModule, 
    DialogModule, 
    InputText, 
    TextareaModule, 
    FormsModule,
    FileUploadModule,
    ToastModule,
    TooltipModule,
    ProgressBarModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [MessageService]
})
export class Home implements OnInit, AfterViewInit {
  private postsState = inject(PostsState);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  posts$ = this.postsState.posts$;

  @ViewChild('bottom') bottom!: ElementRef;

  page = 1;
  limit = 5;

  // Post creation state
  displayCreateDialog = false;
  newPostTitle = '';
  newPostContent = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isPosting = false;

  // Fun features state
  quotes = [
    "Hành trình vạn dặm bắt đầu từ một bước chân.",
    "Hãy là chính mình, những người khác đã là người khác rồi.",
    "Thất bại là mẹ của thành công.",
    "Cuộc sống là 10% những gì xảy ra với bạn và 90% cách bạn phản ứng với nó.",
    "Đừng đợi cơ hội, hãy tự tạo ra nó.",
    "Mỗi ngày là một cơ hội mới để viết nên câu chuyện của riêng bạn."
  ];
  currentQuote = "";
  postsReadCount = 0;

  get userLevel(): number {
    return Math.floor(this.postsReadCount / 10) + 1;
  }

  get progressToNextLevel(): number {
    return (this.postsReadCount % 10) * 10;
  }

  get postsRemainingToNextLevel(): number {
    return 10 - (this.postsReadCount % 10);
  }

  ngOnInit(): void {
    this.postsState.loadPosts(this.page.toString(), this.limit.toString()).subscribe();
    this.generateQuote();
    this.loadStats();
  }

  generateQuote() {
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    this.currentQuote = this.quotes[randomIndex];
  }

  loadStats() {
    // Giả lập lấy số bài đã xem từ localStorage
    const savedCount = localStorage.getItem('postsReadCount');
    this.postsReadCount = savedCount ? parseInt(savedCount) : 0;
  }

  updateStats() {
    this.postsReadCount++;
    localStorage.setItem('postsReadCount', this.postsReadCount.toString());
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        this.loadMorePosts();
      }
    }, { threshold: 0.1 });
    observer.observe(this.bottom.nativeElement);

    // Giả lập đếm bài đã xem khi cuộn qua
    const postObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.updateStats();
        }
      });
    }, { threshold: 0.5 });

    // Đợi bài đăng load xong mới observe
    this.posts$.subscribe(posts => {
      if (posts && posts.length > 0) {
        setTimeout(() => {
          const postElements = document.querySelectorAll('app-post');
          postElements.forEach(el => postObserver.observe(el));
        }, 1000);
      }
    });
  }

  loadMorePosts() {
    this.page += 1;
    this.postsState.loadPosts(this.page.toString(), this.limit.toString()).subscribe();
  }

  showCreateDialog() {
    this.displayCreateDialog = true;
  }

  onFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitPost() {
    if (!this.newPostTitle.trim() || !this.newPostContent.trim() || this.isPosting) return;

    this.isPosting = true;
    this.cdr.detectChanges(); // Hiện loading ngay lập tức

    const formData = new FormData();
    formData.append('title', this.newPostTitle);
    formData.append('content', this.newPostContent);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.postsState.createPosts(formData).subscribe({
      next: () => {
        this.isPosting = false;
        this.displayCreateDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đăng bài thành công!' });
        this.resetForm();
      },
      error: (err) => {
        this.isPosting = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message || 'Không thể đăng bài' });
      }
    });
  }

  cancelForm(){
    this.resetForm();
    this.displayCreateDialog = false;
  }

  scrollToNextPost() {
    const container = document.querySelector('.home-container') as HTMLElement;
    if (!container) return;
    
    const posts = document.querySelectorAll('app-post');
    const containerRect = container.getBoundingClientRect();
    
    // Ngưỡng xác định một bài đăng là "ở trên cùng" (thêm offset 25px để không bị che)
    const offset = 25;
    const threshold = containerRect.top + offset + 10;
    
    for (let i = 0; i < posts.length; i++) {
      const postRect = posts[i].getBoundingClientRect();
      
      if (postRect.top > threshold) {
        // Tính toán vị trí cuộn mới: vị trí hiện tại + (khoảng cách từ bài đăng tới container) - offset
        const targetScrollTop = container.scrollTop + (postRect.top - containerRect.top) - offset;
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        return;
      }
    }
    
    this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToPreviousPost() {
    const container = document.querySelector('.home-container') as HTMLElement;
    if (!container) return;
    
    const posts = document.querySelectorAll('app-post');
    const containerRect = container.getBoundingClientRect();
    
    const offset = 25;
    // Ngưỡng xác định một bài đăng là "ở trên cùng" (lùi lại một chút so với offset)
    const threshold = containerRect.top + offset - 10;
    
    for (let i = posts.length - 1; i >= 0; i--) {
      const postRect = posts[i].getBoundingClientRect();
      
      if (postRect.top < threshold) {
        const targetScrollTop = container.scrollTop + (postRect.top - containerRect.top) - offset;
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        return;
      }
    }
    
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.newPostTitle = '';
    this.newPostContent = '';
    this.selectedFile = null;
    this.imagePreview = null;
  }
}
