import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { UserApi } from "../service/api_method/user/user";

export const authGuard: CanActivateFn = async (route, state) => {
    const router = inject(Router);
    const http = inject(HttpClient);
    const userService = inject(UserApi);

    try {
        await firstValueFrom( //Dùng để biến Observation thành Promise
            userService.getUserInfor()
        );
        return true;
    }
    catch (err: any) {
        const error = err.error?.error || 'Bạn chưa đăng nhập.'
        return router.createUrlTree(['/login'], {
            queryParams: {
                authError: error
            }
        });
    }
}