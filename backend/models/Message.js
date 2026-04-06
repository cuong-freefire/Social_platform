
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    content: {
        type: String,
        trim: true,
        maxLength: [2000, 'Tin nhắn quá dài, vui lòng rút gọn lại.']
    },
    imageUrl: {
        type: String,
        default: null
    },
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    isSystem: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

messageSchema.index({ content: 'text' });
const Message = mongoose.model('Message', messageSchema);
export default Message;

