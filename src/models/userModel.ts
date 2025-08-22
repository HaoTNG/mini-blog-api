import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name?: string;
  avatarUrl: string;
  role: "user" | "moderator" | "admin";
  description: string;
  refreshToken: string | null;
  posts: mongoose.Types.ObjectId[];     // mảng post ids
  comments: mongoose.Types.ObjectId[];  // mảng comment ids
  score: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    avatarUrl: { type: String, default: "/default-avatar.png" },
    role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },
    description: { type: String, default: "" },
    refreshToken: { type: String, default: null },
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],       // array of post ids
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }], // array of comment ids
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password trước khi save
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
