import { DataTypes } from 'sequelize';

export const createUploadVideoModel = (sequelize) => {
    const UploadVideo = sequelize.define('UploadVideo', {
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status:{
            type:DataTypes.STRING,
            allowNull: false,
            defaultValue: "uploading",
        },
        link:{
            type:DataTypes.STRING,
            allowNull: false,
            defaultValue: null,
        }
        
    });

    return UploadVideo;
};
