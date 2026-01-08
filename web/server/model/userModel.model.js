import {UserModel} from '../postgres/postgres.js';
// import {WalletModel} from '../postgres/postgres.js';
import {UploadVideoModel} from '../postgres/postgres.js';
import {TransactionModel} from '../postgres/postgres.js';
import { sequelize } from '../postgres/postgres.js';
await sequelize.sync({ alter: true });

// export const getUserWallet = async (phone) => {
//     try {
//         const wallet = await WalletModel.findOne({ where: { phone: phone } });
//         return wallet ? wallet.toJSON() : null;
//     } catch (error) {
//         console.error("Error getting user:", error);
//         throw error;
//     }
// };

export const getUploadVideo = async (phone) => {
    try {
        const upload = await UploadVideoModel.findOne({ where: { phone: phone } });
        return upload ? upload.toJSON() : null;
    } catch (error) {
        console.error("Error getting user:", error);
        throw error;
    }
};


export const uploadingCount = async (transaction) => {
  return await UploadVideoModel.count({
    where: { status: 'uploading' },
    transaction,
  });
};

export const createUploadVideoStatus = async (phone, status, link, transaction) => {
  try {
    const uploadVideo = await UploadVideoModel.create(
      { phone, status, link },
      { transaction }
    );
    console.log('Upload status created with ID:', uploadVideo.id);
    return uploadVideo;
  } catch (error) {
    console.error('Error creating upload status:', error);
    throw error;
  }
};

export const updateUploadVideoStatus = async (phone, status, link, transaction) => {
  try {
    const uploadVideo = await UploadVideoModel.findOne({
      where: { phone },
      transaction,
    });

    if (!uploadVideo) {
      throw new Error("No upload status found for the provided phone");
    }

    await uploadVideo.update({ status, link }, { transaction });
    console.log(`Upload status updated for phone: ${phone}, new status: ${status}, link: ${link}`);
    return uploadVideo;
  } catch (error) {
    console.error('Error updating upload status:', error);
    throw error;
  }
};


export const getUserList = async () => {
  try {
    const users = await UserModel.findAll();
    return users.map(user => user.toJSON());
  } catch (error) {
    console.error("Error fetching user list:", error);
    throw error;
  }
};





export const createTransaction = async (from, to, value, message, status = 1, transaction) => {
  try {
    const newTransaction = await TransactionModel.create(
      {
        from,
        to,
        value,
        message,
        status: status,
      },
      { transaction }
    );
    //sequelize.literal(): cho phép giảm trực tiếp giá trị trong cơ sở dữ liệu mà không cần fetch model về rồi .save().
    await UserModel.update(
      { balance: sequelize.literal(`balance - ${value}`) },
      { where: { phone: from }, transaction }
    );
    await UserModel.update(
      { balance: sequelize.literal(`balance + ${value}`) },
      { where: { phone: to }, transaction }
    );
    console.log('Transaction created');
    return newTransaction.toJSON();
  } catch (error) {
    console.error('Error creating transaction:', error.message);
    await TransactionModel.create(
      {
        from,
        to,
        value,
        message: message || 'Failed transaction attempt',
        status: 0,
      },
      { transaction }
    );
    throw error;
  }
};