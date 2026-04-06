import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
     status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
     }
}, {timestamps: true});

//Ràng buộc để không thể gửi lời mời kết bạn cho chính mình
friendRequestSchema.path('sender').validate(function (value) {
    return value.toString() !== this.receiver.toString();
}, 'Bạn không thể gửi lời mời kết bạn cho chính mình.');

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export default FriendRequest;