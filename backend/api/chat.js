import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getConversations, getMessageByConversationId, sendMessage, editMessage, deleteMessage, getOrCreateConversation, createGroup, renameGroup } from '../controller/chatController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const chatRouter = express.Router();

chatRouter.get('/conversation/all', verifyToken, getConversations);
chatRouter.post('/conversation/get-or-create', verifyToken, getOrCreateConversation);
chatRouter.post('/conversation/create-group', verifyToken, createGroup);
chatRouter.patch('/conversation/rename-group', verifyToken, renameGroup);
chatRouter.get('/message/all/:id', verifyToken, getMessageByConversationId);
chatRouter.post('/message/send_message', verifyToken, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: "Lỗi upload file: " + err.message });
        } else if (err) {
            return res.status(500).json({ error: "Lỗi server khi upload: " + err.message });
        }
        next();
    });
}, sendMessage);
chatRouter.patch('/message/edit', verifyToken, editMessage);
chatRouter.delete('/message/delete/:messageId', verifyToken, deleteMessage);

export default chatRouter;