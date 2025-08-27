import User, { IUser } from "../models/userModel";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;
    if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id);
        if (!user) throw new Error("User not found");

        (req as Request & { user?: IUser }).user = user;
        next();
    } catch (err: any) {
        return res.status(401).json({ message: "Unauthorized or invalid token" });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes((req as Request & { user?: IUser }).user?.role!)) {
            return res.status(403).json({ message: "You do not have permission" });
        }
        next();
    };
};
