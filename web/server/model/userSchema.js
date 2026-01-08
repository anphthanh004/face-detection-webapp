import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';

export const createUserModel = (sequelize) => {
    const User = sequelize.define('User', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        embedding: {
            type: DataTypes.JSONB,
            allowNull: true,
            validate: {
                isEmbeddingValid(value) {
                    if (value === null) return;
                    if (value === 0 || value === 1) return;
                    if (Array.isArray(value)) {
                        if (value.length !== 512) {
                            throw new Error("Embedding array must contain exactly 512 elements");
                        }
                        if (!value.every(v => typeof v === 'number')) {
                            throw new Error("Each embedding element must be a number");
                        }
                    } else {
                        throw new Error("Embedding must be either 0, 1, or a 512-element array");
                    }
                }
            }
        }
    }, {
        hooks: {
            beforeCreate: async (user) => {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            },
        }
    });

    return User;
};
