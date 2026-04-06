import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ValidatorFn, ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../service/api_method/auth/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule, IftaLabelModule, InputTextModule, ToastModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  providers: [MessageService]
})
export class Register {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);
  private authService = inject(Auth);
  private strongRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  registerForm = new FormGroup({
    username: new FormControl('',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30)
      ]
    ),
    password: new FormControl('',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(30),
        this.forbiddenPasswordValidator(this.strongRegex)
      ]
    ),
    repassword: new FormControl('',
      [
        Validators.required,
      ]
    ),
    email: new FormControl('',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(255),
      ]
    ),
    name: new FormControl('',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]
    )
  }, {
    validators: this.matchPasswordValidator
  })

  forbiddenPasswordValidator(regex: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const validPassword = regex.test(control.value);
      return validPassword ? null : { forbiddenPassword: { value: control.value } }
    }
  }

  matchPasswordValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const repassword = group.get('repassword')?.value;
    return password === repassword ? null : { notmatch: true }
  }

  errorMessage: any = {
    username: {
      required: 'Username không được để trống!',
      minLength: (err: any) => `Username phải có ít nhất ${err.requiredLength} ký tự!`,
      maxLength: (err: any) => `Username không được vượt quá ${err.requiredLength} ký tự!`
    },
    password: {
      required: 'Password không được để trống!',
      minlength: (err: any) => `Password phải có ít nhất ${err.requiredLength} ký tự!`,
      maxlength: (err: any) => `Password không được vượt quá ${err.requiredLength} ký tự!`,
      forbiddenPassword: 'Password phải có chữ hoa, chữ thường, số và ký tự đặc biệt!'
    },
    email: {
      required: 'Email không được để trống!',
      email: 'Email không hợp lệ!'
    },
    name: {
      required: 'Tên không được để trống!',
      minlength: (err: any) => `Tên phải có ít nhất ${err.requiredLength} ký tự!`
    },
    form: {
      validators: 'Password không khớp!'
    }
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors) return null;

    const fieldError = this.errorMessage[controlName];

    for (const errorKey of Object.keys(control.errors)) {
      const errorValue = control.errors[errorKey];
      const message = fieldError[errorKey];

      if (message) {
        return typeof message === 'function'
          ? message(errorValue)
          : message
      }
    }

    return null;
  }

  getFormError(): string | null {
    const errors = this.registerForm.errors;
    if (!errors) return null
    if (errors['validators']) {
      return this.errorMessage.form.validators;
    }
    return null;
  }

  onRegister() {
    // Viết check để ném lỗi
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      //Check form 
      const formError = this.getFormError();
      if (formError) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: formError });
        return
      }

      // Check field
      const fields = ['username', 'password', 'email', 'name'];
      for (const field of fields) {
        const errorMsg = this.getErrorMessage(field);
        if (errorMsg) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
          return
        }
      }
      return
    }

    this.authService.register(this.registerForm.value).subscribe(
      {
        next: (res: any) => {
          console.log(res);
          this.router.navigate(['/login'], { queryParams: { registered: true } });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        }
      }
    )
  }

}
