import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Post } from '../../../interface/post';
import { Comment } from '../../../interface/comment';
import { map, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostApi {

  private http = inject(HttpClient);

  getAllPost(page: string, limit: string, userId?: string) {
    let url = `http://localhost:3000/post/all?page=${page}&limit=${limit}`;
    if (userId) url += `&userId=${userId}`;
    return this.http.get<Post[]>(url).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      }
      )
    )
  }

  getPostById(id: string) {
    return this.http.get<Post>(`http://localhost:3000/post/${id}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      })
    )
  }

  getCommentById(id: string, page: string, limit: string) {
    return this.http.get<Comment[]>(`http://localhost:3000/post/comment/${id}?page=${page}&limit=${limit}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra"
        return throwError(() => new Error(message))
      }
      )
    )
  }

  createPost(data: FormData) {
    return this.http.post<{ post: Post, message: string }>('http://localhost:3000/post/create', data).pipe(
      map(res => res.post),
      catchError(err => {
        const message = err?.error.detail || err?.error.error || "Có lỗi xảy ra";
        return throwError(() => new Error(message))
      })
    )
  }

  likePost(postId: string, action: string) {
    return this.http.post<Post>(`http://localhost:3000/post/like/${postId}`, { action: action }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra";
        return throwError(() => new Error(message))
      })
    )
  }

  createComment(postId: string, content: string, parentCommentId?: string) {
    return this.http.post<Comment>(`http://localhost:3000/post/comment/${postId}`, { content, parentCommentId }).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra";
        return throwError(() => new Error(message))
      })
    )
  }

  deleteComment(commentId: string) {
    return this.http.delete<string>(`http://localhost:3000/post/comment/${commentId}`).pipe(
      catchError(err => {
        const message = err?.error.error || "Có lỗi xảy ra";
        return throwError(() => new Error(message))
      })
    )
  }
}
