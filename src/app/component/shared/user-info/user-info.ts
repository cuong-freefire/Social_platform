import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserState } from '../../../service/state/user_state/user-state';
import { CommonModule } from '@angular/common';
import { User } from '../../../interface/user';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-info',
  imports: [
    CommonModule,
    ToastModule,
    CardModule,
    AvatarModule,
    ButtonModule,
    DividerModule,
    InputTextModule,
    RippleModule,
    FormsModule,
  ],
  templateUrl: './user-info.html',
  styleUrl: './user-info.css',
  providers: [MessageService],
})
export class UserInfo implements OnInit {
  private userInfoState = inject(UserState);
  private messageService = inject(MessageService);
  private cd = inject(ChangeDetectorRef);
  user$ = this.userInfoState.user$;
  editedUser!: User;
  user!: User | null;
  selectedAvatarFile: File | null = null;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      this.user = user;
      this.cancelEdit();
    });
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedAvatarFile = fileInput.files[0];
      // Preview the selected image
      const reader = new FileReader();
      reader.onload = () => {
        this.editedUser.image = reader.result as string;
        this.cd.detectChanges(); // Ép Angular cập nhật giao diện
      };
      reader.readAsDataURL(this.selectedAvatarFile);
    }
  }

  onSubmit() {
    const formData = new FormData();
    if (!this.user) return;

    let hasChanges = false;

    if (this.editedUser?.name?.trim() && this.editedUser.name.trim() !== this.user.name) {
      formData.append('name', this.editedUser.name.trim());
      hasChanges = true;
    }

    if (this.editedUser?.email?.trim() && this.editedUser.email.trim() !== this.user.email) {
      formData.append('email', this.editedUser.email.trim());
      hasChanges = true;
    }

    if (this.selectedAvatarFile) {
      formData.append('image', this.selectedAvatarFile);
      hasChanges = true;
    }

    if (hasChanges) {
      this.isLoading = true;
      this.userInfoState.updateUser(formData).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Thông báo', detail: res.message });
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.message });
          this.isLoading = false;
          this.cd.detectChanges();
        },
      });
    } else {
      this.messageService.add({ severity: 'info', summary: 'Thông báo', detail: 'Không có thay đổi nào để lưu' });
    }
  }

  cancelEdit() {
    if (this.user) {
      this.editedUser = { ...this.user };
    }
    this.selectedAvatarFile = null;
  }
}
