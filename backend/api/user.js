import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getUserInfo, getUserInfoById, updateUserInfo, unfriend, sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriendShipStatus, searchUsers } from '../controller/userController.js';
import multer from 'multer';

const upload = multer();

const userRouter = express.Router();

userRouter.get('/me', verifyToken, getUserInfo);
userRouter.patch('/update', verifyToken, upload.single("image"), updateUserInfo);
userRouter.delete('/unfriend/:id', verifyToken, unfriend);
userRouter.post('/send_request', verifyToken, sendFriendRequest);
userRouter.get('/friend_requests', verifyToken, getFriendRequests);
userRouter.get('/search', verifyToken, searchUsers);
userRouter.post('/accept_request/:requestId', verifyToken, acceptFriendRequest);
userRouter.post('/reject_request/:requestId', verifyToken, rejectFriendRequest);
userRouter.get('/ship_status/:id', verifyToken, getFriendShipStatus);
userRouter.get('/:id', verifyToken, getUserInfoById);

export default userRouter;