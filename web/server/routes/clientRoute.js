import express from 'express'
import {Login, Register, DeleteUser} from '../controller/authentication.controller.js';
// import { GetUserInfo, GetUserWallet, GetUserList } from '../controller/userController.controller.js';
import { GetUserInfo, GetUserList } from '../controller/userController.controller.js';
import { CreateUploadVideoStatus,UpdateUploadVideoStatus, CreateTransaction } from '../controller/userController.controller.js';
const clientRouter = express.Router()

clientRouter.post("/login", Login);
clientRouter.post("/register", Register);
clientRouter.delete("/deleteUser", DeleteUser);
clientRouter.get("/user-info", GetUserInfo);
// clientRouter.get("/mywallet", GetUserWallet);
clientRouter.post("/upload-video", CreateUploadVideoStatus);
clientRouter.put('/upload-video', UpdateUploadVideoStatus);
clientRouter.get("/user-list", GetUserList);
clientRouter.post("/transaction",CreateTransaction)
// client/usesr-info?user_id=${userId}
export default clientRouter;
