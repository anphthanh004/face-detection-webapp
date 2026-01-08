import { createUser, deleteUser, getUserExist } from '../model/authentication.model.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';

export const Login = async (req, res, next) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        console.log('Login failed: Missing phone or password');
        return res.status(400).json({ message: 'Phone and password are required' });
    }

    try {
        const user = await getUserExist(phone);
        console.log(user);
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log(isPasswordMatch);
        if (!isPasswordMatch) {
            console.log('Login failed: Incorrect password');
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        console.log('Login successful');
        // req.user = { name: user.name, email: user.email };
        return res.status(200).json({
            message: 'Login successful',
            user: { name: user.name, email: user.email, phone: user.phone },
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const Register = async (req, res) => {
    const { name, password,confirmPassword, email, phone } = req.body;

    if (!name || !password || !email || !phone) {
        console.log('Register failed: Missing some fields');
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
    console.log('Register failed: Passwords do not match');
    return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!validator.isEmail(email)) {
        console.log('Register failed: Invalid email format');
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
        console.log('Register failed: Password too short');
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        const existingUser = await getUserExist(phone);
        if (existingUser) {
            console.log('Register failed: Phone number is already registered');
            return res.status(409).json({ message: `Phone number: ${phone} is already registered` });
        }
        await createUser(name, password, email, phone);

        console.log(`Register successful for phone: ${phone}`);
        return res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const DeleteUser = async (req, res) => {
    const { phone, password } = req.body;
    console.log(phone);
    console.log(password);
    if (!phone||!password) {
        console.log('Delete failed: Missing phone or password');
        return res.status(400).json({ message: 'Phone and password are required' });
    }
    try {
        const user = await getUserExist(phone);
        console.log(user);

        if (!user) {
            console.log(`Delete failed: No user found for phone: ${phone}`);
            return res.status(401).json({ message: 'User not found' });
        }
        console.log(user.password);
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log(isPasswordMatch);
        if (!isPasswordMatch) {
            console.log(`Delete failed: Incorrect password for phone: ${phone}`);
            return res.status(401).json({ message: 'Invalid password' });
        }
        await deleteUser(phone, password); 
        console.log(`User with phone ${phone} deleted successfully`);
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


