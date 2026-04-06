import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import Message from "../models/Message.js";
import { uploadToCloudinary } from "./cloudinaryController.js";

export const getConversations = async (req, res) => {
    try {
        const userId = req.user;

        const conversations = await Conversation.find({ participants: userId })
            .populate("participants", "-password")
            .populate({
                path: 'lastMessage',
                select: 'user content isDeleted isEdited createdAt imageUrl',
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

        // Chỉ creator hoặc participant mới có quyền đổi tên? Ở đây cho phép bất kỳ ai trong nhóm đổi tên
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