import { DataTypes } from 'sequelize';

export const createTransactionModel = (sequelize) => {
    const Transaction = sequelize.define('Transaction', {
        from: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        to: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        value: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        status:{
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        message:{
            type:DataTypes.STRING,
            allowNull: false
        }
        
    });
    return Transaction;
};
