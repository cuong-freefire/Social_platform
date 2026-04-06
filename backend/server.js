import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import authRouter from './api/auth.js';
import userRouter from './api/user.js';
import postRouter from './api/post.js';
import chatRouter from './api/chat.js';
import notificationRouter from './api/notification.js';
import cookieParser from 'cookie-parser';

const app = express();

//Kết nối tới port angular bằng Cors
const allowedOrigins = [
    `http://localhost:${process.env.PORT_F}`,
    'https://social-platform-tc34.onrender.com' // Domain Frontend chính xác của bạn
];

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
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
})