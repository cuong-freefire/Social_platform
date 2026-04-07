import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PostApi } from '../../../service/api_method/post/post';
import { Post as PostDto } from '../../../interface/post';
import { Navbar } from '../../shared/navbar/navbar';
import { Post } from '../../shared/post/post';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    Post,
    ProgressSpinnerModule,
    ButtonModule
  ],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css'
})
export class PostDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postApi = inject(PostApi);
  private cdr = inject(ChangeDetectorRef);

  post: PostDto | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadPost(id);
      }
    });
  }

  loadPost(id: string) {
    this.loading = true;
    this.error = null;
    this.postApi.getPostById(id).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
