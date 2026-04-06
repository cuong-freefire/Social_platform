import express from 'express';
import { login, register, logout } from '../controller/authController.js';
import { verifyRegister } from '../middleware/validator.js';

const authRouter = express.Router();

// login
authRouter.post('/login', login );
authRouter.post('/register', verifyRegister, register);
authRouter.post('/logout', logout);

//export
export default authRouter;

