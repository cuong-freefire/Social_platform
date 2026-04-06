import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getPostInfo, getPostById, getCommentByPostId, createPost, toggleLike, createComment, deleteCommentById, deletePost } from '../controller/postController.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const postRouter = express.Router();

postRouter.get('/all', verifyToken, getPostInfo);
postRouter.get('/comment/:postId', verifyToken, getCommentByPostId);
postRouter.get('/:id', verifyToken, getPostById);
postRouter.delete('/comment/:commentId', verifyToken, deleteCommentById);
postRouter.delete('/:id', verifyToken, deletePost);
postRouter.post('/create', verifyToken, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: "Lỗi upload file: " + err.message });
        } else if (err) {
            return res.status(500).json({ error: "Lỗi server khi upload: " + err.message });
        }
        next();
    });
}, createPost);
postRouter.post('/like/:postId', verifyToken, toggleLike);
postRouter.post('/comment/:postId', verifyToken, createComment);

export default postRouter;