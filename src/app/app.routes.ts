import { authGuard } from './auth/authRoute';
import { Routes } from '@angular/router';
import { Home } from './component/pages/home/home';
import { Friends } from './component/pages/friends/friends';
import { Login } from './component/pages/login/login';
import { Register } from './component/pages/register/register';
import { UserInfo } from './component/shared/user-info/user-info';
import { NotFound } from './component/error/not-found/not-found';
import { FriendDetail } from './component/pages/friend-detail/friend-detail';
import { PostDetail } from './component/pages/post-detail/post-detail';
import { ChatPage } from './component/pages/chat-page/chat-box';
import { AboutPage } from './component/pages/about-page/about-page';

export const routes: Routes = [
    {
        path: '',
        component: Home,
        title: 'Home Page',
        canActivate: [authGuard]
    },
    {
        path: 'about',
        component: AboutPage,
        title: 'About GAY',
        canActivate: [authGuard]
    },
    {
        path: 'chat',
        component: ChatPage,
        title: 'Messenger',
        canActivate: [authGuard]
    },
    {
        path: 'post/:id',
        component: PostDetail,
        title: 'Post Detail',
        canActivate: [authGuard]
    },
    {
        path: 'user_info',
        component: UserInfo,
        title: 'User Info',
        canActivate: [authGuard]
    },
    {
        path: 'not_found',
        component: NotFound,
        title: 'Error',
    },
    {
        path: 'friends',
        component: Friends,
        title: 'Friends Page',
        canActivate: [authGuard]
    },
    {
        path: 'friend-detail/:id',
        component: FriendDetail,
        title: 'Friend Detail',
        canActivate: [authGuard]
    },
    {
        path: 'login',
        component: Login,
        title: 'Login Page',
    },
    {
        path: 'register',
        component: Register,
        title: 'Register Page',
    },
];
