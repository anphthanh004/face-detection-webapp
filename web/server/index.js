import express from 'express';
import {connection} from './postgres/postgres.js';
import clientRoute from './routes/clientRoute.js';
import adminRoute from './routes/adminRoute.js';
import cors from 'cors';
import env from 'dotenv';
env.config();

const app = express();

// console.log
app.use(express.json());// phải dùng trước router để dữ liệu được parse
app.use(cors({credentials: true, origin: ['http://localhost:3000', 'http://localhost:4000']}));

app.use('/client', clientRoute);
app.use('/admin', adminRoute);

 
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});

connection();