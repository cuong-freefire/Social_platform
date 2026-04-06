
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // const token = req.headers.authorization?.split(" ")[1];
    const token = req.cookies.token;
    
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