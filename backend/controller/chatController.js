import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "./cloudinaryController.js";

export const getConversations = async (req, res) => {
    try {
        const userId = req.user;

        const conversations = await Conversation.find({ participants: userId })
            .populate("participants", "-password")
            .populate("creator", "name image")
            .populate({
                path: 'lastMessage',
                select: 'user content isDeleted isEdited isSystem createdAt imageUrl',
                populate: {
                    path: 'user',
                    select: 'name image',
                }
            })
            .sort({ updatedAt: -1 });
        res.status(200).json(conversations);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Có lỗi xảy ra" })
    }
}

export const getMessageByConversationId = async (req, res) => {
    try {
        const conversationId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ error: "ID cuộc hội thoại không hợp lệ" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('user', 'name image')
            .populate({
                path: 'parentMessage',
                populate: {
                    path: 'user',
                    select: 'name image'
                }
            })
            .sort({ createdAt: 1 });
        return res.status(200).json(messages);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Có lỗi xảy ra" })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user;
        const { conversationId, receiverId, content, parentMessageId } = req.body;
        const file = req.file;

        if (!conversationId && !receiverId) {
            return res.status(400).json({ error: "Thiếu thông tin cuộc hội thoại hoặc người nhận" });
        }

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else if (receiverId) {
            conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] },
                isGroup: false
            });
            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, receiverId]
                });
            }
        }

        if (!conversation) return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });

        let imageUrl = null;
        if (file) {
            const result = await uploadToCloudinary(file.buffer);
            imageUrl = result.secure_url;
        }

        if (!content && !imageUrl) {
            return res.status(400).json({ error: "Nội dung tin nhắn hoặc hình ảnh không được để trống" });
        }

        const messageData = {
            conversation: conversation._id,
            user: senderId,
            content: content ? content.trim() : (imageUrl ? "Đã gửi một ảnh" : ""),
            imageUrl,
            parentMessage: parentMessageId && mongoose.Types.ObjectId.isValid(parentMessageId) ? parentMessageId : null
        };

        const newMessage = await Message.create(messageData);

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('user', 'name image')
            .populate({
                path: 'parentMessage',
                populate: {
                    path: 'user',
                    select: 'name image'
                }
            });

        return res.status(200).json(populatedMessage);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Lỗi khi gửi tin nhắn." });
    }
};

export const createGroup = async (req, res) => {
    try {
        const creatorId = req.user;
        const { groupName, participants } = req.body;

        if (!groupName || !participants || !participants.length) {
            return res.status(400).json({ error: "Thiếu tên nhóm hoặc thành viên" });
        }

        // Thêm creator vào danh sách thành viên nếu chưa có
        const allParticipants = [...new Set([...participants, creatorId.toString()])];

        const conversation = await Conversation.create({
            participants: allParticipants,
            isGroup: true,
            groupName: groupName.trim(),
            creator: creatorId
        });

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate("participants", "-password")
            .populate("creator", "name image");

        res.status(201).json(populatedConversation);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Lỗi khi tạo nhóm chat" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const userId = req.user;
        const { messageId, content } = req.body;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

        if (message.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Bạn không có quyền sửa tin nhắn này" });
        }

        message.content = content.trim();
        message.isEdited = true;
        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate('user', 'name image')
            .populate({
                path: 'parentMessage',
                populate: {
                    path: 'user',
                    select: 'name image'
                }
            });

        res.status(200).json(updatedMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const userId = req.user;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: "Không tìm thấy tin nhắn" });

        if (message.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Bạn không có quyền thu hồi tin nhắn này" });
        }

        message.content = "Tin nhắn đã được thu hồi";
        message.isDeleted = true;
        message.imageUrl = null;
        await message.save();

        res.status(200).json({ messageId, isDeleted: true, content: message.content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const renameGroup = async (req, res) => {
    try {
        const userId = req.user;
        const { conversationId, newGroupName } = req.body;

        if (!newGroupName || !newGroupName.trim()) {
            return res.status(400).json({ error: "Tên nhóm không được để trống" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });

        if (!conversation.isGroup) {
            return res.status(400).json({ error: "Đây không phải là cuộc hội thoại nhóm" });
        }

        if (!conversation.participants.includes(userId.toString())) {
            return res.status(403).json({ error: "Bạn không có quyền đổi tên nhóm này" });
        }

        conversation.groupName = newGroupName.trim();
        await conversation.save();

        const updatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "-password")
            .populate("creator", "name image");

        res.status(200).json(updatedConversation);
    } catch (err) {
        res.status(500).json({ error: "Lỗi khi đổi tên nhóm" });
    }
};

export const updateGroupImage = async (req, res) => {
    try {
        const userId = req.user;
        const { conversationId } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "Vui lòng chọn ảnh" });

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Không tìm thấy cuộc hội thoại" });

        // Nếu nhóm cũ chưa có creator, gán người đang thao tác là creator
        if (!conversation.creator) {
            conversation.creator = userId;
            await conversation.save();
        }

        if (conversation.creator.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Chỉ trưởng nhóm mới có quyền đổi ảnh nhóm" });
        }

        const result = await uploadToCloudinary(file.buffer);
        
        const updatedConv = await Conversation.findByIdAndUpdate(conversationId, 
            { groupImage: result.secure_url }, 
            { new: true }
        ).populate("participants", "-password").populate("creator", "name image");

        res.status(200).json(updatedConv);
    } catch (err) {
        console.error("Error in updateGroupImage:", err);
        res.status(500).json({ error: "Lỗi khi cập nhật ảnh nhóm" });
    }
};

export const kickMember = async (req, res) => {
    try {
        const userId = req.user;
        const { conversationId, memberId } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Không tìm thấy nhóm" });

        if (!conversation.creator) {
            conversation.creator = userId;
            await conversation.save();
        }

        if (conversation.creator.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Chỉ trưởng nhóm mới có quyền xóa thành viên" });
        }

        if (memberId === userId.toString()) {
            return res.status(400).json({ error: "Bạn không thể tự xóa chính mình khỏi nhóm" });
        }

        const admin = await User.findById(userId);
        const member = await User.findById(memberId);

        if (!admin || !member) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        const updatedConversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { $pull: { participants: memberId } },
            { new: true }
        ).populate("participants", "-password").populate("creator", "name image");

        // Tạo tin nhắn hệ thống
        const systemMessage = await Message.create({
            conversation: conversationId,
            user: userId, // Người thực hiện hành động
            content: `${member.name} đã bị ${admin.name} xóa khỏi nhóm`,
            isSystem: true
        });

        // Cập nhật tin nhắn cuối cùng
        updatedConversation.lastMessage = systemMessage._id;
        await updatedConversation.save();

        res.status(200).json(updatedConversation);
    } catch (err) {
        console.error("Error in kickMember:", err);
        res.status(500).json({ error: "Lỗi khi xóa thành viên" });
    }
};

export const dissolveGroup = async (req, res) => {
    try {
        const userId = req.user;
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Không tìm thấy nhóm" });

        if (!conversation.creator) {
            conversation.creator = userId;
            await conversation.save();
        }

        if (conversation.creator.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Chỉ trưởng nhóm mới có quyền giải tán nhóm" });
        }

        // Xóa tin nhắn
        await Message.deleteMany({ conversation: conversationId });
        
        // Xóa hội thoại
        await Conversation.deleteOne({ _id: conversationId });

        res.status(200).json({ message: "Đã giải tán nhóm thành công", conversationId });
    } catch (err) {
        console.error("Error in dissolveGroup:", err);
        res.status(500).json({ error: "Lỗi khi giải tán nhóm" });
    }
};

export const addMembers = async (req, res) => {
    try {
        const userId = req.user;
        const { conversationId, memberIds } = req.body;

        if (!memberIds || !memberIds.length) {
            return res.status(400).json({ error: "Vui lòng chọn thành viên để thêm" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ error: "Không tìm thấy nhóm" });

        if (!conversation.isGroup) {
            return res.status(400).json({ error: "Đây không phải là cuộc hội thoại nhóm" });
        }

        // Kiểm tra quyền (chỉ thành viên trong nhóm mới được thêm người mới, hoặc chỉ admin tùy bạn, ở đây cho phép mọi thành viên)
        if (!conversation.participants.includes(userId.toString())) {
            return res.status(403).json({ error: "Bạn không có quyền thêm thành viên vào nhóm này" });
        }

        // Lọc ra những người chưa có trong nhóm
        const newMemberIds = memberIds.filter(id => !conversation.participants.includes(id.toString()));
        
        if (newMemberIds.length === 0) {
            return res.status(400).json({ error: "Các thành viên này đã có trong nhóm" });
        }

        // Cập nhật danh sách thành viên
        conversation.participants.push(...newMemberIds);
        await conversation.save();

        const admin = await User.findById(userId);
        const newMembers = await User.find({ _id: { $in: newMemberIds } });
        const newMemberNames = newMembers.map(m => m.name).join(", ");

        // Tạo tin nhắn hệ thống
        const systemMessage = await Message.create({
            conversation: conversationId,
            user: userId,
            content: `${admin.name} đã thêm ${newMemberNames} vào nhóm`,
            isSystem: true
        });

        conversation.lastMessage = systemMessage._id;
        await conversation.save();

        const updatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "-password")
            .populate("creator", "name image")
            .populate({
                path: 'lastMessage',
                populate: { path: 'user', select: 'name image' }
            });

        res.status(200).json(updatedConversation);
    } catch (err) {
        console.error("Error in addMembers:", err);
        res.status(500).json({ error: "Lỗi khi thêm thành viên" });
    }
};

export const getOrCreateConversation = async (req, res) => {
    try {
        const senderId = req.user;
        const { receiverId } = req.body;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
            $expr: { $eq: [{ $size: "$participants" }, 2] }
        }).populate("participants", "-password")
          .populate({
              path: 'lastMessage',
              populate: { path: 'user', select: 'name image' }
          });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
            conversation = await Conversation.findById(conversation._id).populate("participants", "-password");
        }

        res.status(200).json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};