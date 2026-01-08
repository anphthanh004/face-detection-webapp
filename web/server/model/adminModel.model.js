import {AdminModel, UploadVideoModel, UserModel} from '../postgres/postgres.js';
import { sequelize } from '../postgres/postgres.js';
await sequelize.sync({ alter: true });
import env from 'dotenv'
env.config();
export const getAdminExist = async (username) => {
  try {
    const admin = await AdminModel.findOne({
      where: { username },  
    });
    return admin ? admin.toJSON() : null;
    // return admin;
  } catch (error) {
    console.error("Error getting admin:", error);
    throw error;
  }
};

export const getUploadVideo = async (phone) => {
    try {
        const upload = await UploadVideoModel.findOne({ where: { phone: phone } });
        return upload ? upload.toJSON() : null;
    } catch (error) {
        console.error("Error getting user:", error);
        throw error;
    }
};


import cloudinary from 'cloudinary';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const acceptVideo = async (phone) => {
  if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const missingVars = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingVars.push('CLOUDINARY_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missingVars.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missingVars.push('CLOUDINARY_API_SECRET');
    throw new Error(`Cloudinary credentials are missing: ${missingVars.join(', ')}`);
  }

  const oldPublicId = `uploaded_videos/${phone}`;
  const newPublicId = `accepted_videos/${phone}`;

  try {
    // B1: Tìm bản ghi video trong cơ sở dữ liệu
    const uploadVideo = await UploadVideoModel.findOne({
      where: { phone },
    });
    console.log('Upload Video Record:', uploadVideo?.toJSON());
    if (!uploadVideo) {
      throw new Error('No upload status found for the provided phone');
    }
    // B2: Di chuyển video trên Cloudinary(không thể di chuyển nên sẽ đổi publicId)
    const renameResult = await cloudinary.v2.uploader.rename(
      oldPublicId,
      newPublicId,
      { resource_type: 'video' }
    );

    console.log('Cloudinary Rename Result:', renameResult);

    if (!renameResult.public_id) {
      throw new Error('Failed to rename video on Cloudinary');
    }
    //  B3: Cập nhật embedding thành 1 trong bảng User
    const [updatedCount] = await UserModel.update(
      { embedding: 1 },
      { where: { phone } }
    );

    if (updatedCount === 0) {
      throw new Error('User not found or embedding update failed');
    }

    // B4: Xóa bản ghi video upload
    await uploadVideo.destroy();
    console.log(`Upload status deleted for phone: ${phone}`);

    return {
      message: 'Video accepted, moved and user updated successfully',
      newVideoUrl: renameResult.secure_url || null,
    };
  } catch (error) {
    console.error('Error accepting video:', error);

    if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed: Invalid API key or secret');
    }
    if (error.http_code === 404) {
      throw new Error('Video not found on Cloudinary. Please check the public_id.');
    }
    if (error.message !== 'No upload status found for the provided phone') {
      try {
        await cloudinary.v2.uploader.rename(
          newPublicId,
          oldPublicId,
          { resource_type: 'video' }
        );
        console.log('Rollback successful: video moved back to waiting_videos');
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }
    }

    throw error;
  }
};


export const deleteVideo = async (phone) => {
  if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const missingVars = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingVars.push('CLOUDINARY_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missingVars.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missingVars.push('CLOUDINARY_API_SECRET');
    throw new Error(`Cloudinary credentials are missing: ${missingVars.join(', ')}`);
  }
  const publicId = `accepted_videos/${phone}`;
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'video' });
    console.log(`Video deletion result for ${publicId}:`, result);
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete video: ${result.result}`);
    }
    return {
      message: `Video with public_id ${publicId} deleted successfully from Cloudinary`,
    };
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

export const getWaitingVideo = async () => {
  try {
    const waiting_list = await UploadVideoModel.findAll({
      where: { status: 'waiting' },
      // raw: true
    });
    return waiting_list.length ? waiting_list.map(video => video.toJSON()) : null;
  } catch (error) {
    console.error('Error getting waiting list:', error);
    throw error;
  }
};



export const addEmbeddings = async (embeddingData) => {
  const results = [];
  const sastified=(inputEmbedding)=>{
      return inputEmbedding===0||inputEmbedding===1||(Array.isArray(inputEmbedding) && inputEmbedding.length===512)
  }
  for (const item of embeddingData) {
    const { phone, embedding } = item;
    if (!phone || !sastified(embedding)) {
      results.push({
        success: false,
        phone: phone || null,
        message: "Missing phone or embedding",
      });
      continue;
    }
    try {
      const [updatedCount] = await UserModel.update(
        { embedding },
        { where: { phone } }
      );
      if (updatedCount === 0) {
        results.push({
          success: false,
          phone,
          message: `No user found with phone ${phone}`,
        });
      } else {
        results.push({
          success: true,
          phone,
          message: "Embedding updated successfully",
        });
      }
    } catch (error) {
      results.push({
        success: false,
        phone,
        message: `Error updating embedding: ${error.message}`,
      });
    }
  }

  return results;
};


export const deleteEmbedding=async(phone)=>{
  try {
    const user = await UserModel.findOne({ where: { phone }});
    if (!user) return null;
    await user.update({ embedding: 0 });
    return user;
  } catch (error) {
    console.error(`Error delete embedding  for ${phone}:`, error);
    throw error;
  }
}

export const increaseUserBalance = async (phone, amount, transaction) => {
  try {
    const user = await UserModel.findOne({ where: { phone }, transaction });
    if (!user) return null;
    await user.update({ balance: user.balance + amount }, { transaction });
    return user;
  } catch (error) {
    console.error(`Error increasing balance for ${phone}:`, error);
    throw error;
  }
};
