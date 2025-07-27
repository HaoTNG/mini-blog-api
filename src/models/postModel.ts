import mongoose, {Schema, Document, Types} from "mongoose";

export interface IPost extends Document{
    title: string;
    content: string;
    author: string;
    likes: Types.ObjectId[];
    dislikes: Types.ObjectId[];
    createAt: Date;
    updateAt: Date;
}

const postSchema = new Schema<IPost>({
    title: {
        type: String,
        require: [true, "Please add a title"],
    },
    content: {
        type: String,
        require: [true, "Please add content"],
    },
    author: {
        type: String,
        require: [true, "Please add the author"],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
},{
    timestamps: true,
});

const Post = mongoose.model<IPost>('Post', postSchema);
export default Post;