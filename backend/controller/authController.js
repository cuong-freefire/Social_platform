import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { username, repassword, email, name } = req.body;
        //Hash password
        const existedUsername = await User.findOne({ username: username });
        const existedEmail = await User.findOne({ email: email });
        if (existedUsername) {
            return res.status(409).json({ error: "Tên tài khoản đã tồn tại!" })
        }
        if (existedEmail) {
            return res.status(409).json({ error: "Email đã tồn tại!" })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(repassword, salt);
        const newUser = new User({ username, email, password: hashedPassword, name });
        await newUser.save();
        return res.status(201).json({ message: "Đăng ký thành công" })
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Sai tài khoản hoặc mật khẩu" })
        }
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(404).json({ error: "Sai tài khoản hoặc mật khẩu" })
        }

        //Tạo token
        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: "1d" })
        // const { password, ...others } = user.toObject();

        //Setup token vào cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        })

        return res.status(200).json({ message: "Đăng nhập thành công", token, user: { id: user._id, username: user.username, name: user.name } });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });
    return res.status(200).json({ message: "Đăng xuất thành công" });
}