import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';

export const createAdminModel = (sequelize) => {
    const Admin = sequelize.define('Admin', {
        username:{
            type: DataTypes.STRING,
            allowNull:false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    return Admin;
};
