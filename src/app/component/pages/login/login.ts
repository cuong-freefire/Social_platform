import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../service/api_method/auth/auth';
import { switchMap, tap } from 'rxjs';
import { UserState } from '../../../service/state/user_state/user-state';


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, InputTextModule, FormsModule, IftaLabelModule, ButtonModule, ToastModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [MessageService]
})
export class Login implements OnInit {
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private userState = inject(UserState);

  ngOnInit(): void {
    // Nếu đã đăng nhập thì tự động chuyển về trang chủ
    this.userState.user$.subscribe(user => {
      if (user) {
        this.router.navigate(['/'], { replaceUrl: true });
      }
    });

    this.route.queryParams.subscribe(param => {
      const error = param['authError'];
      const registered = param['registered'];
      if (error) {
        setTimeout(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi truy cập',
            detail: error
          });
        }, 100);
      }
      // Kiểm tra đăng ký thành công
      if (registered) {
        setTimeout(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đăng ký thành công!'
          });
        }, 100);
      }
    })
  }

  loginForm = new FormGroup({
    username: new FormControl(
      '',
      [Validators.required]
    ),
    password: new FormControl(
      '',
      [Validators.required]
    )
  })

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      if (this.loginForm.get('username')?.invalid) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Username is required' });
        return
      }
      if (this.loginForm.get('password')?.invalid) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'password is required' });
        return
      }
      return
    }

    this.auth.login(this.loginForm.value).pipe(
      tap(() => console.log("Đăng nhập thành công")),
      switchMap(() => this.userState.loadUser())
    )
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.router.navigate(['/'], { replaceUrl: true });
        },
        error: (err) => {
          return this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        }
      })
  }
}
