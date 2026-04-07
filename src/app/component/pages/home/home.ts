import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
    ToastModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  providers: [MessageService]
})
export class Home implements OnInit, AfterViewInit {
  private postsState = inject(PostsState);
  private messageService = inject(MessageService);
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

  ngOnInit(): void {
    this.postsState.loadPosts(this.page.toString(), this.limit.toString()).subscribe();
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        this.loadMorePosts();
      }
    }, { threshold: 0.1 });
    observer.observe(this.bottom.nativeElement);
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

  resetForm() {
    this.newPostTitle = '';
    this.newPostContent = '';
    this.selectedFile = null;
    this.imagePreview = null;
  }
}
