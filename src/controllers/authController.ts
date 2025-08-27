import User, { IUser } from '../models/userModel';
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';

// generate token
const generateAccessToken = (user: { id: string; role: string }) => {
  return jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user: { id: string; role: string }) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );
};

// register
export async function register(req: Request, res: Response) {
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
            message: "Register successful. Please login to continue."
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Register failed",
            error: error.message
        });
    }
};

// login
export async function login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are mandatory"
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const matchPassword = await user.comparePassword(password);
        if (!matchPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const accessToken = generateAccessToken({ id: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id, role: user.role });


        user.refreshToken = refreshToken;
        await user.save();

        
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            maxAge: 15 * 60 * 1000 // 15m
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
        });
        return res.status(200).json({
            success: true,
            message: "Login successful",
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
            message: "Login failed",
            error: error.message
        });
    }
};

// refresh token
export const refreshAccessToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(400).json({ message: "missing refresh token" });

    try {
        const payload = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET!
        ) as { id: string; role: string };

        const user = await User.findById(payload.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "invalid refresh token" });
        }

        const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
        const newRefreshToken = generateRefreshToken({ id: user.id, role: user.role });
        user.refreshToken = newRefreshToken;
        await user.save();
        res.cookie("accessToken", newAccessToken , {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            maxAge: 15 * 60 * 1000 // 15m
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            sameSite: "strict",
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
        });

        return res.json({ message: "Access token refreshed" });
    } catch (error: any) {
        return res.status(403).json({ message: "invalid or expired refresh token" });
    }
};


// logout
export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(400).json({ message: "missing refresh token" });

    try {
        const user = await User.findOne({ refreshToken });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }else {
            console.warn("Suspicious logout attempt with invalid refreshToken");
        }

        // clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.json({ message: "logout successfully" });
    } catch (error: any) {
        res.status(500).json({ message: "server error" });
    }
};


export const getMe = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: "unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    // Lấy user, bỏ password và refreshToken
    const user = await User.findById(payload.id)
      .select("-password -refreshToken -__v"); 
    if (!user) return res.status(404).json({ message: "user not found" });

    return res.json(user); 
  } catch (err) {
    return res.status(401).json({ message: "invalid or expired token" });
  }
};

