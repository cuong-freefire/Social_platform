export const verifyRegister = (req, res, next) => {
    const { username, password, repassword, email, name } = req.body;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // ===== USERNAME =====
    if (!username) {
        return res.status(400).json({ error: "Username không được để trống" });
    }

    if (username.length < 8) {
        return res.status(400).json({ error: "Username phải có ít nhất 8 ký tự" });
    }

    if (username.length > 30) {
        return res.status(400).json({ error: "Username không được vượt quá 30 ký tự" });
    }

    // ===== PASSWORD =====
    if (!password) {
        return res.status(400).json({ error: "Password không được để trống" });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password phải có ít nhất 8 ký tự" });
    }

    if (password.length > 30) {
        return res.status(400).json({ error: "Password không được vượt quá 30 ký tự" });
    }

    if (!strongRegex.test(password)) {
        return res.status(400).json({
            error: "Password phải có chữ hoa, chữ thường, số và ký tự đặc biệt",
        });
    }

    // ===== RE-PASSWORD (confirm) =====
    if (!repassword) {
        return res.status(400).json({ error: "Vui lòng nhập lại password" });
    }

    if (password !== repassword) {
        return res.status(400).json({ error: "Password không khớp" });
    }

    // ===== EMAIL =====
    if (!email) {
        return res.status(400).json({ error: "Email không được để trống" });
    }

    if (email.length > 255) {
        return res.status(400).json({ error: "Email không được vượt quá 255 ký tự" });
    }

    // regex email cơ bản (tương đương Validators.email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email không hợp lệ" });
    }

    // ===== NAME =====
    if (!name) {
        return res.status(400).json({ error: "Tên không được để trống" });
    }

    if (name.length < 2) {
        return res.status(400).json({ error: "Tên phải có ít nhất 2 ký tự" });
    }

    if (name.length > 50) {
        return res.status(400).json({ error: "Tên không được vượt quá 50 ký tự" });
    }

    // ===== SUCCESS =====
    next();
}