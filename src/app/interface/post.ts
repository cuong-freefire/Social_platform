import { User } from "./user";

export interface Post {
    _id: string;
    user?: User;
    title?: string;
    content?: string;
    image?: string | null;
    likes?:  User[];
    dislikes?:  User[];
    createdAt?: string;
    updatedAt?: string;
    commentCount?: number;
}
