import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user;
        const notifications = await Notification.find({ receiver: userId })
            .sort({ createdAt: -1 })
            .populate('sender', 'name image')
            .limit(20);
        
        const unreadCount = await Notification.countDocuments({ receiver: userId, isRead: false });

        res.status(200).json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const markAsRead = async (req, res) => {
    try {
        const notifId = req.params.id;
        await Notification.findByIdAndUpdate(notifId, { 
            isRead: true,
            readAt: new Date()
        });
        res.status(200).json({ message: "Đã đánh dấu đã đọc" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user;
        await Notification.updateMany(
            { receiver: userId, isRead: false }, 
            { isRead: true, readAt: new Date() }
        );
        res.status(200).json({ message: "Đã đánh dấu tất cả đã đọc" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
