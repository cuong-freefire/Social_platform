import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/Notification.js";
import cloudinary from "../config/cloudinary.js";
import { uploadToCloudinary } from "./cloudinaryController.js";
import { userSocketMap } from "../server.js";

export const getUserInfo = async (req, res) => {
    const id = req.user;
    try {
        const userObject = await User.findById(id).select('-password')
            .populate({
                path: 'friends',
                select: '-password'
            })
            .lean();
        if (!userObject) {
            return res.status(401).json({ error: "Người dùng chưa đăng nhập!" });
        }
        return res.status(200).json({ userObject });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export const getUserInfoById = async (req, res) => {
    const id = req.params.id;
    try {
        const userObject = await User.findById(id).select('-password')
            .populate({
                path: 'friends',
                select: '-password'
            })
            .lean();
        if (!userObject) {
            return res.status(401).json({ error: "Người dùng chưa đăng nhập!" });
        }
        return res.status(200).json({ userObject });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export const updateUserInfo = async (req, res) => {
    const id = req.user;
    const updates = {};
    try {
        const userObj = await User.findById(id).select('email image public_id').lean();
        if (!userObj) {
            return res.status(404).json({ error: "Không tìm thấy người dùng!" });
        }

        if (req.body.name !== undefined) {
            const validName = req.body.name.trim();
            if (!validName) {
                return res.status(400).json({ error: "Tên không được để trống!" });
            }
            updates.name = validName;
        }
        if (req.body.email && (userObj.email !== req.body.email)) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ error: "Email already used" });
            }
            updates.email = req.body.email;
        }
        if (req.file) {
            const oldPublicId = userObj.public_id;
            const fileBuffer = req.file.buffer;
            // upload lên cloudinary
            const result = await uploadToCloudinary(fileBuffer);
            updates.image = result.secure_url;
            updates.public_id = result.public_id;
            if (oldPublicId) {
                await cloudinary.uploader.destroy(oldPublicId);
            }

        }
        const updatedUser = await User.findByIdAndUpdate(id, updates, { returnDocument: 'after' })
            .select('-password')
            .populate({
                path: 'friends',
                select: '-password'
            })
            .lean();
        return res.status(200).json({
            message: "Cập nhật thành công!",
            user: updatedUser
        });
    }
    catch (err) {
        console.error("Lỗi khi cập nhật thông tin người dùng:", err);
        return res.status(500).json({ error: err.message });
    }
}

export const unfriend = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user;
        await User.findByIdAndUpdate(id, { $pull: { friends: userId } });
        const newUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { friends: id } }
        )
            .select('-password')
            .populate({
                path: 'friends',
                select: '-password'
            })
            .lean()
            ;
        
        // Xoá thông báo liên quan đến việc kết bạn của 2 người này
        await Notification.deleteMany({
            $or: [
                { sender: userId, receiver: id, type: { $in: ['FRIEND_REQUEST', 'FRIEND_ACCEPT'] } },
                { sender: id, receiver: userId, type: { $in: ['FRIEND_REQUEST', 'FRIEND_ACCEPT'] } }
            ]
        });

        res.status(200).json(newUser);
    }
    catch (err) {
        console.error("Lỗi khi huỷ kết bạn:", err);
        return res.status(500).json({ error: "Có lỗi xảy ra khi huỷ kết bạn!" });
    }
}

export const sendFriendRequest = async (req, res) => {
    try {
        const receiverId = req.body.id;
        const senderId = req.user;

        const sender = await User.findById(senderId);
        if (sender.friends.includes(receiverId)) {
            return res.status(400).json({ error: "Các bạn đã là bạn bè!" });
        }

        const existingRequest = await FriendRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        })

        if (existingRequest) {
            return res.status(400).json({ error: "Yêu cầu kết bạn đã được gửi trước đó!" });
        }

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId
        });

        await newRequest.save();

        const senderUser = await User.findById(senderId).select('name');
        const notification = new Notification({
            sender: senderId,
            receiver: receiverId,
            type: 'FRIEND_REQUEST',
            content: `${senderUser.name} đã gửi cho bạn một lời mời kết bạn`
        })
        await notification.save();

        // Emit socket event for friend request notification
        const io = req.io;
        const socketId = userSocketMap.get(receiverId.toString());
        if (socketId) {
            const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name image');
            io.to(socketId).emit('newNotification', populatedNotif);
        }

        res.status(200).json("Đã gửi lời mời kết bạn!");
    }
    catch (err) {
        console.error("Lỗi khi kết bạn:", err);
        return res.status(500).json({ error: "Có lỗi xảy ra!" });
    }
}

export const acceptFriendRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user;

        const request = await FriendRequest.findById(requestId);
        if (!request || request.receiver.toString() !== userId.toString()) {
            return res.status(404).json({ error: "Yêu cầu không tồn tại!" });
        }

        if (request.status === 'accepted') {
            return res.status(400).json({ error: "Yêu cầu đã được chấp nhận trước đó!" });
        }

        // Cập nhật trạng thái yêu cầu
        request.status = 'accepted';
        await request.save();

        // Thêm bạn bè cho cả hai phía
        await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
        await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

        // Xoá thông báo "FRIEND_REQUEST" cũ để tránh trùng lặp
        await Notification.deleteOne({
            receiver: userId,
            sender: request.sender,
            type: 'FRIEND_REQUEST'
        });

        // Tạo thông báo "đã đồng ý kết bạn"
        const senderUser = await User.findById(request.receiver).select('name');
        const newNotif = await new Notification({
            receiver: request.sender,
            sender: request.receiver,
            content: `${senderUser.name} đã chấp nhận lời mời kết bạn của bạn`,
            type: 'FRIEND_ACCEPT'
        }).save();

        // Emit socket event for friend acceptance notification
        const io = req.io;
        const socketId = userSocketMap.get(request.sender.toString());
        if (socketId) {
            const populatedNotif = await Notification.findById(newNotif._id).populate('sender', 'name image');
            io.to(socketId).emit('newNotification', populatedNotif);
        }

        res.status(200).json({ message: "Đã trở thành bạn bè!" });
    }
    catch (err) {
        console.error("Lỗi khi chấp nhận kết bạn:", err);
        res.status(500).json({ error: err.message });
    }
}

export const rejectFriendRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const userId = req.user;

        const request = await FriendRequest.findById(requestId);
        if (!request || request.receiver.toString() !== userId.toString()) {
            return res.status(404).json({ error: "Yêu cầu không tồn tại!" });
        }

        // Xoá yêu cầu kết bạn
        await FriendRequest.findByIdAndDelete(requestId);

        // Xoá thông báo liên quan
        await Notification.deleteOne({
            receiver: userId,
            sender: request.sender,
            type: 'FRIEND_REQUEST'
        });

        res.status(200).json({ message: "Đã từ chối lời mời kết bạn!" });
    } catch (err) {
        console.error("Lỗi khi từ chối kết bạn:", err);
        res.status(500).json({ error: err.message });
    }
}

export const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length === 0) return res.status(200).json([]);

        // Tách query thành các từ và tạo regex tìm kiếm từng từ
        const words = query.trim().split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const searchRegex = new RegExp(words.join('.*'), 'i');

        const users = await User.find({
            $or: [
                { name: { $regex: searchRegex } },
                { username: { $regex: searchRegex } }
            ]
        }).select('name username image').limit(10).lean();

        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user;
        const requests = await FriendRequest.find({
            receiver: userId,
            status: 'pending'
        }).populate('sender', 'name image username').lean();

        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const getFriendShipStatus = async (req, res) => {
    try {
        const userId = req.user;
        const targetId = req.params.id;

        if (userId === targetId) {
            return res.status(200).json({ status: 'self' });
        }

        const user = await User.findById(userId).select('friends').lean();
        const isFriend = user.friends.some(f => f.toString() === targetId);

        if (isFriend) {
            return res.status(200).json({ status: 'friend' });
        }

        // Kiểm tra xem đã gửi request chưa
        const sentRequest = await FriendRequest.findOne({
            sender: userId,
            receiver: targetId,
            status: 'pending'
        }).lean();

        if (sentRequest) {
            return res.status(200).json({ status: 'sent' });
        }

        // Kiểm tra xem có request từ người đó không
        const receivedRequest = await FriendRequest.findOne({
            sender: targetId,
            receiver: userId,
            status: 'pending'
        }).lean();

        if (receivedRequest) {
            return res.status(200).json({ status: 'received', requestId: receivedRequest._id });
        }

        return res.status(200).json({ status: 'none' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
