import {UserModel} from '../postgres/postgres.js';
import { sequelize } from '../postgres/postgres.js';
import bcrypt from 'bcryptjs';
await sequelize.sync({ alter: true });

export const getUserExist = async (phone) => {
  try {
    const results = await sequelize.query(`
      SELECT 
        "Users".*,
        "UploadVideos"."status" as "uploadStatus"
      FROM 
        "Users"
      LEFT JOIN 
        "UploadVideos" ON "Users"."phone" = "UploadVideos"."phone"
      WHERE 
        "Users"."phone" = :phone
      LIMIT 1
    `, {
      replacements: { phone },
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const createUser = async (name, password, email, phone) => {
    const t = await sequelize.transaction();
    try {
        const user = await UserModel.create({
            name,
            password, 
            email,
            phone,
            balance: 0,
            embedding: 0,
        // }, { transaction: t });
        });
        // await WalletModel.create({
        //     name: user.name,
        //     phone: user.phone,
        //     balance: 0,
        //     identified:false,
        // }, { transaction: t })
        // await t.commit();
        console.log('User created with ID:', user.id);
        return user;
    } catch (error) {
        // await t.rollback();
        console.error('Error creating user:', error);
        throw error;
    }
};
export const deleteUser = async (phone, password) => {
    const t = await sequelize.transaction();
    try {
        const user = await UserModel.findOne({ where: { phone }, transaction: t });
        if (!user) {
            console.log("User not found");
            await t.rollback();
            return false;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Incorrect password");
            await t.rollback();
            return false;
        }

        await user.destroy({ transaction: t });

        await t.commit();
        console.log("User and wallet deleted successfully");
        return true;
    } catch (error) {
        await t.rollback();
        console.error("Error deleting user:", error);
        throw error;
    }
};


export const getUserID = async (phone) => {
    try {
        const user = await UserModel.findOne({
            where: { phone: phone },
            attributes: ['id'], 
        });

        return user ? user.id : null;
    } catch (error) {
        console.error("Error getting user by phone:", error);
        throw error;
    }
};

export const getUserById = async (userId) => {
    try {
        const user = await UserModel.findByPk(userId); 
        return user ? user.toJSON() : null;
    } catch (error) {
        console.error('Error getting user by userId:', error);
        throw error;
    }
};
