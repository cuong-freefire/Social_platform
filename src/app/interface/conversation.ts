import { Message } from "./message";
import { User } from "./user";

export interface Conversation {
    _id: string;
    participants: User[];   // danh sách user trong cuộc trò chuyện
    lastMessage?: Message;      // tin nhắn cuối
    isGroup: boolean;
    groupName?: string;
    groupImage?: string;
    creator?: string | User;
    updatedAt: string;          // dùng để sort
    createdAt: string;
}
