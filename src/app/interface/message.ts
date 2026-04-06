import { User } from "./user";

export interface Message {
    _id: string;
    conversation: string;       // conversationId
    user: User;             // người gửi tin nhắn
    content: string;
    imageUrl?: string;
    parentMessage?: Message;    // reply tin nhắn khác
    isRead: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
}
