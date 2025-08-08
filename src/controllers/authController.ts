import User, { IUser } from '../models/userModel';
import { Request, Response } from "express";
import { access } from 'fs';
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


//generate token
const generateAccessToken = (userId: string) => {
    return jwt.sign(
        {id: userId},
        process.env.JWT_SECRET!,
        {expiresIn: '7d'}
    );
};

const generateRefreshToken = (userId: string) =>{
    return jwt.sign(
        {id: userId},
        process.env.JWT_REFRESH_SECRET!, 
        {expiresIn: '7d'}
    )
}
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

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        user.refreshToken = refreshToken;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
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

//refresh token

export const refreshAccessToken = async (req: Request, res: Response) => {
    const {refreshToken} = req.body;
    if(!refreshToken) return res.status(400).json({message: "missing refresh token"});

    try{
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as{id: string};
        const user = await User.findById(payload.id);
        if(!user || user.refreshToken !== refreshToken){
            return res.status(403).json({message: "invalid refresh token"});
        }
        const newAccessToken = generateAccessToken(user.id);
        res.json({accessToken:  newAccessToken})
    }catch(error: any){
        return res.status(403).json({message: "invalid or expired refresh token"})
    }
}

//logout

export const logout  = async (req: Request, res:Response) => {
    const {refreshToken} =req.body;
    if(!refreshToken) return res.status(400).json({message:"missing refresh token"});
    try{
        const user = await User.findOne({refreshToken});
        if(!user){
            return res.status(400).json({message: "invalid refresh token"});
        }
        user.refreshToken = null;
        await user.save();

        return res.json({message: "logout successfully"})

    }catch(error: any){
        res.status(500).json({message: "server error"})
    }
}