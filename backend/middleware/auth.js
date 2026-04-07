
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // Ưu tiên token từ cookie, nếu không có thì lấy từ header Authorization
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    }
    
    if (!token) {
        return res.status(401).json({ error: "Bạn chưa đăng nhập" })
    }

    jwt.verify(token, process.env.SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token ko hợp lệ" })
        }
        req.user = user.id;
        next();
    })
}