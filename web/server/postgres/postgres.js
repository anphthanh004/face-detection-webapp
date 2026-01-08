import { Sequelize } from 'sequelize';
import { createUserModel } from '../model/userSchema.js';
import { createUploadVideoModel } from '../model/uploadVideoSchema.js';
import { createAdminModel } from '../model/adminSchema.js';
import { createTransactionModel } from '../model/transactionSchema.js';
import env from 'dotenv';
env.config();



const sequelize = new Sequelize('postgres', 'postgres', process.env.PASSWORD, {
  host: 'localhost',
  dialect: 'postgres',
});
// 'database': tên database bạn muốn kết nối (phải thay bằng tên thực tế, ví dụ mydb).
// 'username': username để login vào PostgreSQL (ví dụ postgres).
// 'password': password tương ứng với username đó.
// host: 'localhost': database server nằm ở máy local (127.0.0.1).
// dialect: 'postgres': bạn đang dùng PostgreSQL (Sequelize còn hỗ trợ MySQL, MariaDB, SQLite, MSSQL...).

let UserModel = null;
let UploadVideoModel = null;
let AdminModel = null;
let TransactionModel = null;

const connection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to PostgreSQL has been established successfully.');
        UserModel = await createUserModel(sequelize);
        UploadVideoModel = await createUploadVideoModel(sequelize);
        AdminModel = await createAdminModel(sequelize);
        TransactionModel = await createTransactionModel(sequelize)
        await sequelize.sync();
        console.log("Database Synced");
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}


export{ 
    connection,
    UserModel,
    AdminModel,
    UploadVideoModel,
    TransactionModel,
    sequelize,
 }
