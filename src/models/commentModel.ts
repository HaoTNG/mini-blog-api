import mongoose, {Schema, Document} from 'mongoose';

export interface IComment extends Document {
    content: String,
    author: mongoose.Types.ObjectId;
    post: mongoose.Types.ObjectId;
    createdAt: Date;
}

const commentSchema = new Schema<IComment>({
    content: {type: String, required: true},
    author: {type: mongoose.Types.ObjectId as any, ref: 'User', required: true},
    post: {type: mongoose.Types.ObjectId as any, ref: 'Post', required: true}
},{
    timestamps: true
})

export default mongoose.model<IComment>('Comment', commentSchema);