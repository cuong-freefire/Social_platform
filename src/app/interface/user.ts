export interface User {
    _id: string;
    username?: string;
    email?: string;
    name?: string;
    image?: string | null;
    friends?: User[];
    createdAt?: string;
    updatedAt?: string;
}
