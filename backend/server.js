import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './api/auth.js';
import userRouter from './api/user.js';
import postRouter from './api/post.js';
import chatRouter from './api/chat.js';
import notificationRouter from './api/notification.js';
import cookieParser from 'cookie-parser';

const app = express();
const httpServer = createServer(app);

// Kết nối tới port angular bằng Cors
const allowedOrigins = [
    `http://localhost:${process.env.PORT_F}`,
    'https://social-platform-tc34.onrender.com'
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Map để lưu trữ userId -> socketId
export const userSocketMap = new Map();

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'undefined') {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    }

    socket.on('disconnect', () => {
        if (userId) {
            userSocketMap.delete(userId);
            console.log(`User ${userId} disconnected`);
        }
    });
});

// Middleware để truyền io instance vào req
app.use((req, res, next) => {
    req.io = io;
    next();
});

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép các request không có origin (như mobile apps hoặc curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('/*path', cors(corsOptions));

// Chuyển json trong body thành java object
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const dbUri = process.env.MONGODB_URI;
//Kết nối database
mongoose.connect(dbUri)
  .then(() => console.log("Database Connected!"))
  .catch(err => console.log(err));

//API
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/chat', chatRouter);
app.use('/notification', notificationRouter);

//Kết nối cổng
const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
})