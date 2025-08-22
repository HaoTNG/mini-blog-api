import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment extends Document {
    content: string;
    author: Types.ObjectId;
    post: Types.ObjectId;
    parentComment?: Types.ObjectId | null; 
    createdAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
        parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IComment>('Comment', commentSchema);
