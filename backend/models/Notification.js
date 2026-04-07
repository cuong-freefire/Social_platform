import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'LIKE_POST',      // Like bài viết
            'DISLIKE_POST',      // Like bài viết
            'LIKE_COMMENT',   // Like bình luận (mở rộng)
            'DISLIKE_COMMENT',   // Like bình luận (mở rộng)
            'COMMENT',        // Bình luận mới vào bài viết
            'REPLY',          // Trả lời bình luận của người dùng
            'NEW_MESSAGE',    // Có tin nhắn mới
            'FRIEND_REQUEST', // Có lời mời kết bạn
            'FRIEND_ACCEPT'   // Người khác đồng ý kết bạn
        ],
        required: true
    },
    linkId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel' // "Nhìn vào trường onModel để biết ID này thuộc bảng nào"
    },
    onModel: {
        type: String,
        required: function(){
            return this.linkId != null
        },
        enum: ['Post', 'Conversation', 'Comment', 'User']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

// Xoá thông báo sau 1 năm nếu đã được đọc (TTL Index)
// 1 năm = 31536000 giây
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 31536000 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;