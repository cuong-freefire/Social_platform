import { Component, inject, OnInit } from '@angular/core';
import { UserState } from '../../../service/state/user_state/user-state';
import { User } from '../../../interface/user';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-friend-list',
  imports: [ToastModule],
  templateUrl: './friend-list.html',
  styleUrl: './friend-list.css',
  providers: [MessageService]
})
export class FriendList implements OnInit {
  private userState = inject(UserState);
  private messageService = inject(MessageService);
  user$ = this.userState.user$;
  private friends !: User[];

  ngOnInit(): void {
    this.user$.subscribe(user => {
      this.friends = [...(user?.friends ?? [])];
    })
  }

  unfriend(id: string) {
    this.userState.unfriend(id).subscribe({
      next: (res) => this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã gửi lời mời kết bạn' }),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message })
    })
  }

}
