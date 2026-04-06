import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },

    isGroup: {
        type: Boolean,
        default: false
    },

    groupName: {
        type: String,
        trim: true
    },

    groupImage: {
        type: String,
        default: 'https://primefaces.org/cdn/primeng/images/demo/avatar/ionitcu.png'
    },

    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true})

conversationSchema.index({participants: 1});
const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;