import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "./cloudinaryController.js";
import mongoose from "mongoose";
import { userSocketMap } from "../server.js";

//Hàm lấy toàn bộ Post theo page và limit
export const getPostInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.query.userId; // Khôi phục lọc theo userId

        const filter = userId && mongoose.Types.ObjectId.isValid(userId) ? { user: userId } : {};

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .populate("user", "name image")
            .populate("likes", "name image")
            .populate("dislikes", "name image")
            .skip((page - 1) * limit).limit(limit);

        const postsWithCommentCount = await Promise.all(posts.map(async (post) => {
            const commentCount = await Comment.countDocuments({ post: post._id });
            return { ...post.toObject(), commentCount };
        }));

        res.status(200).json(postsWithCommentCount);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Có lỗi xảy ra" })
    }
}

// Hàm lấy thông tin 1 bài viết theo ID
export const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: "ID bài viết không hợp lệ" });
        }

        const post = await Post.findById(postId)
            .populate("user", "name image")
            .populate("likes", "name image")
            .populate("dislikes", "name image");
        
        if (!post) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }

        const commentCount = await Comment.countDocuments({ post: post._id });
        res.status(200).json({ ...post.toObject(), commentCount });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Lỗi khi lấy thông tin bài viết" });
    }
}

// Hàm lấy danh sách các comment theo Post
export async function getCommentByPostId(req, res) {
    try {
        const postId = req.params.postId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const comments = await Comment.find({ post: postId })
            .populate("user", "name image")
            .populate("likes", "name image")
            .populate("dislikes", "name image")
            .populate("parentComment", "content user")
            .skip((page - 1) * limit).limit(limit);
        res.status(200).json(comments);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Có lỗi xảy ra" });
    }
}

// Hàm tạo mới Post
export const createPost = async (req, res) => {
    try {
        const userId = req.user;

        console.log("Headers:", req.headers['content-type']);
        console.log("Dữ liệu nhận được (body):", req.body);
        console.log("Dữ liệu nhận được (file):", !!req.file);

        if (!req.body) {
            return res.status(400).json({
                error: "Dữ liệu gửi lên không hợp lệ!",
                detail: "Server không nhận được body (req.body is undefined). Hãy kiểm tra lại Multer middleware."
            });
        }

        const { title, content } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ error: "Dữ liệu không hợp lệ!" });
        }

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: "Tiêu đề không được để trống!" });
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: "Nội dung không được để trống!" });
        }

        const postData = {
            user: userId,
            title: title.trim(),
            content: content.trim()
        };

        if (req.file) {
            const fileBuffer = req.file.buffer;
            // upload lên cloudinary
            const result = await uploadToCloudinary(fileBuffer);
            postData.image = result.secure_url;
            postData.public_id = result.public_id;
        }

        const newPostDoc = new Post(postData);
        await newPostDoc.save();

        const newPost = await Post.findById(newPostDoc._id)
            .populate("user", "name image")
            .populate("likes", "name image")
            .populate("dislikes", "name image");

        return res.status(201).json({
            post: newPost,
            message: "Đăng bài thành công!"
        });
    }
    catch (err) {
        console.error("Lỗi chi tiết khi tạo bài đăng:", err);
        return res.status(500).json({
            error: "Lỗi hệ thống khi tạo bài đăng!",
            detail: err.message || "Lỗi không xác định"
        });
    }
}

export const toggleLike = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user;
        const { action } = req.body;

        if (!['like', 'dislike'].includes(action)) {
            return res.status(400).json({ error: "Hành động không hợp lệ!" })
        }

        const mainAction = action === 'like' ? 'likes' : 'dislikes';
        const sideAction = action === 'like' ? 'dislikes' : 'likes';

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Bài viết không tồn tại!" });

        const isReacted = post[mainAction].includes(userId);
        if (isReacted) {
            await Post.findByIdAndUpdate(postId, { $pull: { [mainAction]: userId } });
            
            // Xoá thông báo LIKE/DISLIKE cũ nếu có
            await Notification.deleteOne({
                sender: userId,
                linkId: postId,
                type: action === 'like' ? 'LIKE_POST' : 'DISLIKE_POST'
            });
        }
        else {
            await Post.findByIdAndUpdate(postId, {
                $addToSet: { [mainAction]: userId },
                $pull: { [sideAction]: userId }
            })

            // Tạo thông báo nếu người like không phải là chủ bài viết
            if (post.user.toString() !== userId.toString()) {
                const sender = await User.findById(userId).select('name');
                const type = action === 'like' ? 'LIKE_POST' : 'DISLIKE_POST';
                const content = action === 'like' 
                    ? `${sender.name} đã thích bài viết của bạn`
                    : `${sender.name} đã bày tỏ cảm xúc không thích bài viết của bạn`;

                // Kiểm tra xem đã có thông báo tương tự chưa để tránh spam
                const existingNotif = await Notification.findOne({
                    receiver: post.user,
                    sender: userId,
                    type,
                    linkId: postId
                });

                if (!existingNotif) {
                    const newNotif = await new Notification({
                        receiver: post.user,
                        sender: userId,
                        type,
                        content,
                        linkId: postId,
                        onModel: 'Post'
                    }).save();

                    // Emit socket event for notification
                    const io = req.io;
                    const socketId = userSocketMap.get(post.user.toString());
                    if (socketId) {
                        const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name image');
                        io.to(socketId).emit('newNotification', populatedNotif);
                    }
                }
            }
        }

        const updatedPost = await Post.findById(postId)
            .populate("user", "name image")
            .populate("likes", "name image")
            .populate("dislikes", "name image");

        res.status(200).json(updatedPost);
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({ error: "Lỗi khi like!" });
    }
}

export const createComment = async (req, res) => {
    try {
        const userId = req.user;
        const postId = req.params.postId;
        const { content, parentCommentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Nội dung bình luận không được để trống!" });
        }

        const commentData = {
            user: userId,
            post: postId,
            content: content.trim(),
            parentComment: parentCommentId || null
        };

        const newCommentDoc = new Comment(commentData);
        await newCommentDoc.save();

        // Tạo thông báo
        const sender = await User.findById(userId).select('name');
        const post = await Post.findById(postId);
        
        if (parentCommentId) {
            // Trường hợp trả lời bình luận
            const parentComment = await Comment.findById(parentCommentId);
            if (parentComment && parentComment.user.toString() !== userId.toString()) {
                const newNotif = await new Notification({
                    receiver: parentComment.user,
                    sender: userId,
                    type: 'REPLY',
                    content: `${sender.name} đã trả lời bình luận của bạn`,
                    linkId: postId,
                    onModel: 'Post' // Điều hướng tới bài viết chứa comment đó
                }).save();

                // Emit socket event for reply notification
                const io = req.io;
                const socketId = userSocketMap.get(parentComment.user.toString());
                if (socketId) {
                    const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name image');
                    io.to(socketId).emit('newNotification', populatedNotif);
                }
            }
        } else if (post && post.user.toString() !== userId.toString()) {
            // Trường hợp bình luận bài viết
            const newNotif = await new Notification({
                receiver: post.user,
                sender: userId,
                type: 'COMMENT',
                content: `${sender.name} đã bình luận bài viết của bạn`,
                linkId: postId,
                onModel: 'Post'
            }).save();

            // Emit socket event for comment notification
            const io = req.io;
            const socketId = userSocketMap.get(post.user.toString());
            if (socketId) {
                const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name image');
                io.to(socketId).emit('newNotification', populatedNotif);
            }
        }

        const newComment = await Comment.findById(newCommentDoc._id)
            .populate("user", "name image")
            .populate("likes", "name image")
            .populate("dislikes", "name image")
            .populate("parentComment", "content user");

        return res.status(201).json(newComment);
    }
    catch (err) {
        console.error("Lỗi khi tạo bình luận:", err);
        return res.status(500).json({ error: "Lỗi hệ thống khi tạo bình luận!", detail: err.message });
    }
}

export const deleteCommentById = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Bình luận không tồn tại!" });
        }

        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Bạn không có quyền thu hồi bình luận này!" });
        }

        comment.isDeleted = true;
        comment.content = "Nội dung đã được thu hồi.";
        await comment.save();

        // Xoá các thông báo liên quan đến bình luận này (ví dụ: thông báo REPLY)
        // Tuy nhiên hiện tại REPLY đang dùng linkId là postId. 
        // Nếu muốn xoá chính xác thông báo REPLY cho comment này, 
        // ta cần lưu thêm commentId vào Notification hoặc tìm theo content/sender.
        // Tạm thời xoá tất cả thông báo của người dùng này về bài viết này nếu là COMMENT/REPLY
        // Nhưng an toàn nhất là xoá thông báo có liên quan đến nội dung này.
        
        // Cách đơn giản nhất: Xoá thông báo mà sender là chủ comment và linkId là postId 
        // và type là COMMENT hoặc REPLY.
        await Notification.deleteMany({
            sender: userId,
            linkId: comment.post,
            type: { $in: ['COMMENT', 'REPLY'] }
            // Lưu ý: Điều này có thể xoá nhầm nếu user có nhiều comment trong cùng 1 post.
            // Để chính xác hơn, Notification nên lưu linkId là Comment ID nếu type là COMMENT/REPLY.
        });

        return res.status(200).json("Thu hồi bình luận thành công!");
    }
    catch (err) {
        console.error("Lỗi khi thu hồi bình luận:", err);
        return res.status(500).json({ error: "Lỗi hệ thống khi thu hồi bình luận!", detail: err.message });
    }
}

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user;
        const userRole = req.role;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Bài viết không tồn tại!" });

        // Admin có thể xoá mọi bài viết, User chỉ có thể xoá bài của chính mình
        if (userRole !== 'admin' && post.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Bạn không có quyền xoá bài viết này!" });
        }

        // Xoá bài viết
        await Post.findByIdAndDelete(postId);

        // Xoá tất cả bình luận của bài viết
        await Comment.deleteMany({ post: postId });

        // Xoá tất cả thông báo liên quan đến bài viết này
        await Notification.deleteMany({ linkId: postId, onModel: 'Post' });

        res.status(200).json({ message: "Xoá bài viết thành công!" });
    } catch (err) {
        console.error("Lỗi khi xoá bài viết:", err);
        res.status(500).json({ error: "Có lỗi xảy ra khi xoá bài viết!" });
    }
}