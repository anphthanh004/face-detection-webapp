import {getUserExist} from '../model/authentication.model.js';
import { createUploadVideoStatus, getUploadVideo, updateUploadVideoStatus, uploadingCount, getUserList, createTransaction } from '../model/userModel.model.js';
import {UploadVideoModel} from '../postgres/postgres.js';
import { sequelize } from '../postgres/postgres.js';
await sequelize.sync({ alter: true });

export const GetUserInfo = async (req, res) => {
    const {user_id} = req.query;
    console.log(user_id)
    if (!user_id) {
        console.log('GetUserInfo failed: Missing user_id parameter');
        return res.status(400).json({ message: 'user_id parameter is required' });
    }
    try {
        const result = await getUserExist(user_id);    
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Error getting member information: ', error);
        res.status(500).json({ message: 'Error getting member informaton' });
    }
}

// export const GetUserWallet= async(req, res)=>{
//     const {user_id} = req.query;
//     console.log(user_id)
//     if(!user_id){
//         console.log('GetUserWallet failed: Missing user_id parameter');
//         return res.status(400).json({ message: 'user_id parameter is required' });
//     }
//     try{
//         const result = await getUserWallet(user_id);
//         return res.status(200).json(result);
//     }catch(error){
//         console.error('Error getting member wallet: ', error);
//         res.status(500).json({ message: 'Error getting member wallet' });
//     }
// }


export const UpdateUploadVideoStatus = async (req, res) => {
  const { phone, status, link } = req.body;
  const { user_id } = req.query;
  const transaction = await sequelize.transaction();  
  if (!user_id) {
    console.log("Request failed: Missing user_id query parameter");
    return res.status(400).json({ message: "User ID is required in query parameters" });
  }

  if (!phone || !status || !link) {
    console.log("Request failed: Missing phone or status or link in request body");
    return res.status(400).json({ message: "Phone and upload status are required" });
  }

  try {
    const userExists = await getUploadVideo(user_id);
    if (!userExists) {
      console.log(`User not found: user_id=${user_id}`);
      return res.status(404).json({ message: "User not found" });
    }

    const updatedStatus = await updateUploadVideoStatus(phone, status, link, transaction);
    await transaction.commit();
    if (!updatedStatus) {
      console.log(`Upload status not found for phone: ${phone}`);
      return res.status(404).json({ message: "Upload status not found for the provided phone" });
    }

    console.log(`Upload status updated successfully for phone: ${phone}`);
    return res.status(200).json({ message: "Upload status updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating upload status:", error);
    return res.status(500).json({ message: "Failed to update upload status" });
  }
};


export const CreateUploadVideoStatus = async (req, res) => {
  const { phone, status,link, public_id } = req.body;
  const { user_id } = req.query;

  if (!user_id) {
    console.log("Request failed: Missing user_id query parameter");
    return res.status(400).json({ message: "User ID is required in query parameters" });
  }

  if (!phone || !status) {
    console.log("Request failed: Missing phone, status in request body");
    return res.status(400).json({ message: "Phone, upload status, and public_id are required" });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();
    const userExists = await getUserExist(user_id, transaction);
    console.log(`User check: user_id=${user_id}, exists=${!!userExists}, embedding=${userExists?.embedding}`);
    if (!userExists) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    const embedding = userExists.embedding;
    const isValidEmbedding =
      embedding === 0 ||
      embedding === 1 ||
      (Array.isArray(embedding) && embedding.length === 512);
    if (!isValidEmbedding) {
      console.log(`User already has embedding: user_id=${user_id}`);
      await transaction.rollback();
      return res.status(403).json({ message: "User already has an embedding, cannot create upload status" });
    }
    const existingUpload = await UploadVideoModel.findOne({
      where: { phone },
      transaction,
    });
    console.log(`Existing upload check: phone=${phone}, exists=${!!existingUpload}`);
    if (existingUpload) {
      await transaction.rollback();
      return res.status(409).json({ message: "Upload status already exists for this phone" });
    }

    const uploadCount = await uploadingCount(transaction);
    console.log(`Uploading count: ${uploadCount}`);
    if (uploadCount >= 1) {
      console.log("Too many videos are currently uploading");
      await transaction.rollback();
      return res.status(429).json({ message: "Too many uploads in progress. Please wait." });
    }

    await createUploadVideoStatus(phone, status,link, public_id, transaction);
    await transaction.commit();
    console.log(`Upload status created successfully for phone: ${phone}, public_id: ${public_id}`);
    return res.status(201).json({ message: "Upload status created successfully" });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Error creating upload status:", error);
    return res.status(500).json({ message: "Failed to create upload status", error: error.message });
  }
};



export const GetUserList = async (req, res) => {
  try {
    const users = await getUserList();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
  }
};


export const CreateTransaction= async(req,res)=>{
  const{user_id: from} = req.query
  const{to, value, message, status} = req.body
  if (!from||!to) {
      console.log('CreateTransaction failed: Missing sender or receiver parameter');
      return res.status(400).json({ message: '{from} and {to} parameter is required' });
  }
  if (from === to) {
    return res.status(400).json({ message: 'Sender and receiver must be different' });
  }
  if (value < 3000) {
    return res.status(400).json({ message: 'Minimum transfer amount is 3,000 VND' });
  }
  const transaction = await sequelize.transaction();
  try {
    const sender = await getUserExist(from, transaction);
    if (!sender) {
      await transaction.rollback();
      return res.status(404).json({ message: `Sender with ID ${from} not found` });
    }
    const receiver = await getUserExist(to, transaction);
    if (!receiver) {
      await transaction.rollback();
      return res.status(404).json({ message: `Receiver with ID ${to} not found` });
    }
    if (sender.balance < value) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Insufficient balance for transaction' });
    }
    const newTransaction = await createTransaction(from, to, value, message, status, transaction);
    await transaction.commit();
    return res.status(200).json({
      message: 'Transaction created successfully',
      transaction: newTransaction,
    });
  }catch(err){
    await transaction.rollback();
    return res.status(500).json({ message: "Failed to create Transaction",error: err.message });
  }
}