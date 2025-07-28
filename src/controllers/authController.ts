import User, { IUser } from '../models/userModel';
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';

export async function register(req: Request, res: Response)  {
    const { email, password, username, name } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields (email, username, password)"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const user = await User.create({ email, password, username, name });

        res.status(201).json({
            success: true,
            message: "Register successful. Please login to continue.",
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Register failed",
            error: error.message
        });
    }
};

const generateAccessTOken = (user: IUser) => {
    return jwt.sign(
        {id: user._id},
        process.env.JWT_SECRET!,
        {expiresIn: '15m'}
    );
};
export async function login(req: Request, res: Response){
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: "All fields are mandatory"
        });
    }

    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }
        const matchPassword = await user.comparePassword(password);
        if(!matchPassword){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        const token = generateAccessTOken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                name: user.name,
                role: user.role
            }
        })
    }catch(error: any){
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};
