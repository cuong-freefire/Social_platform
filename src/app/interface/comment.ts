import { User } from "./user";

export interface Comment {
    _id: string;
    user: User;
    post: string;
    content: string;
    likes?: User[];
    dislikes?: User[];
    parentComment?: string | Comment;
    replies?: Comment[];
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
