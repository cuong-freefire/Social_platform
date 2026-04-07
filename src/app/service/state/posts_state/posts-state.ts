import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Post } from '../../../interface/post';
import { PostApi } from '../../api_method/post/post';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostsState {
  private postsSubject = new BehaviorSubject<Post[] | null>(null);
  posts$ = this.postsSubject.asObservable();
  private postApi = inject(PostApi);

  loadPosts(page: string, limit: string) {
    return this.postApi.getAllPost(page, limit).pipe(
      tap({
        next: (postsResult) => {
          const current = this.postsSubject.getValue();
          if (page === '1') {
            this.postsSubject.next(postsResult);
          } else {
            this.postsSubject.next([...current ?? [], ...postsResult]);
          }
        },
        error: () => this.postsSubject.next(null)
      })
    )
  }

  clearPosts() {
    this.postsSubject.next(null);
  }

  createPosts(data: FormData) {
    const postsDefault = this.postsSubject.getValue();
    return this.postApi.createPost(data).pipe(
      tap({
        next: (post) => this.postsSubject.next([post, ...postsDefault ?? []]),
        error: () => this.postsSubject.next(postsDefault)
      })
    )
  }

  likepost(postId: string, action: string) {
    const postsDefault = this.postsSubject.getValue();
    return this.postApi.likePost(postId, action).pipe(
      tap({
        next: (post) => this.postsSubject.next(postsDefault?.map(p => p._id === postId ? post : p) ?? [])
      })
    )
  }

  deletePost(postId: string) {
    const postsDefault = this.postsSubject.getValue();
    return this.postApi.deletePost(postId).pipe(
      tap({
        next: () => this.postsSubject.next(postsDefault?.filter(p => p._id !== postId) ?? []),
        error: () => this.postsSubject.next(postsDefault)
      })
    )
  }
}
