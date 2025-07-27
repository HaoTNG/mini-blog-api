import User,{IUser} from "../models/userModel";
import jwt from "jsonwebtoken";
import { Request,Response, NextFunction } from "express";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({message:"Not authorized"})
    }

    try{
        const decode = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await User.findById((decode as any).id);
        if(!user) throw new Error("User not found");

        (req as Request & {user?: IUser}).user = user;
        next();
    }catch(err: any){
        res.status(401).json({message:"Unauthorized"});
    }
};

export const restrictTo = (...roles: string[]) =>{
    return (req: Request, res: Response, next : NextFunction)=>{
        if(!roles.includes((req as Request & { user?: IUser }).user?.role!)){
            return res.status(403).json({message:"You do not have permission"});
        }
        next();
    }
}

