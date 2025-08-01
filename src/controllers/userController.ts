import User, {IUser} from "../models/userModel";
import { Request, Response } from "express";
import jwt  from "jsonwebtoken";

exports.getMe = async (req: Request, res: Response) =>{
    try{
        const user = await User.findById((req as Request &{user? : IUser}).user?._id).select("-password");
        res.status(200).json(user);
    } catch(error: any){
        res.status(400).json({
            message: "failed to get user",
            error: error.message
        });
    }
};

exports.updateMe = async (req: Request, res: Response) => {
    const update = req.body;

    delete update.role;
    delete update.password;

    try{
        const updateUser = await User.findByIdAndUpdate((req as Request &{user? : IUser}).user?._id,
                update,
                {new: true, runValidators: true}).select("-password");
        res.status(200).json(updateUser);
    }catch(error: any){
        res.status(400).json({
            message:"Cannot update the profile",
            error: error.message
        });
    }
};

exports.deleteMe = async (req: Request,  res: Response) => {
    try{
        await User.findByIdAndDelete((req as Request &{user? : IUser}).user?._id);
        res.status(200).json({message:"your account has been deleted successfully"});
    } catch(error: any){
        res.status(400).json({
            message:"failed to delete your account",
            error: error.message
        });
    }
};


//moderator api

exports.getAllUsers = async (req: Request, res: Response) => {
    try{
        const users = await User.find().select("-password");
        res.status(200).json(users);
    }catch(error: any){
        res.status(400).json({
            message: "Cannot find all the users",
            error: error.message
        });
    }
};

exports.deleteUser = async (req: Request, res: Response) => {
    try{
        const user = await User.findById(req.params.id);
        if(!user){
            return res.status(400).json({message: "cannot found user"})
        }

        await user.deleteOne();
        res.status(200).json({message:"delete user successfully"});
    }catch(error: any){
        res.status(400).json({
            message:"failed to delete user",
            error: error.message
        });
    }
};


//moderator api

exports.updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Role updated", user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};