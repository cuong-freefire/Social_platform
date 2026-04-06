import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../../interface/user';
import { UserApi } from '../../api_method/user/user';
import { tap } from 'rxjs';
import { UpdateUserResponse } from '../../../interface/update-user-response';

@Injectable({
  providedIn: 'root',
})
export class UserState {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private userApi = inject(UserApi);

  loadUser() {
    return this.userApi.getUserInfor().pipe(
      tap({
        next: (user) => this.userSubject.next(user),
        error: () => this.userSubject.next(null)
      })
    )
  }

  clearUser() {
    this.userSubject.next(null);
  }

  setUser(user: User) {
    this.userSubject.next(user);
  }

  updateUser(data: FormData): Observable<UpdateUserResponse> {
    return this.userApi.updateUserInfor(data).pipe(
     tap({
      next: (res) => this.userSubject.next(res.user)
     })
    )
  }

  unfriend(id: string){
    return this.userApi.unFriend(id).pipe(
      tap({
        next: (res) => this.userSubject.next(res)
      })
    )
  }



}
