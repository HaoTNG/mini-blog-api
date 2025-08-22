import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  topic: string;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  comments: Types.ObjectId[];

}

const topics = [
  "Animals", "Anime", "Art", "Astronomy", "Automotive", "Aviation", "Beauty", "Books", "Business", "Career",
  "Cars", "Celebrities", "Climate", "Comedy", "Comics", "Cooking", "Culture", "Current Events", "Cycling", "Dance",
  "Design", "DIY", "Education", "Entrepreneurship", "Environment", "Esports", "Fashion", "Film", "Finance", "Fitness",
  "Food", "Football", "Gaming", "Gardening", "General", "Geography", "Health", "History", "Home Improvement", "Investing",
  "Language Learning", "Lifestyle", "Literature", "Local News", "Marketing", "Martial Arts", "Math", "Medicine", "Mental Health", "Military",
  "Mobile Technology", "Motorsports", "Movies", "Music", "Nature", "News", "Outdoors", "Parenting", "Pets", "Philosophy",
  "Photography", "Physics", "Podcasts", "Poetry", "Politics", "Programming", "Psychology", "Relationships", "Religion", "Robotics",
  "Science", "Self-Improvement", "Skateboarding", "Social Issues", "Space", "Spirituality", "Sports", "Startups", "Technology", "Theater",
  "Travel", "TV Shows", "Urban Development", "UX/UI", "Video Editing", "Virtual Reality", "Volunteering", "Weather", "Web Development", "Wildlife",
  "Wine", "Women’s Issues", "Writing", "Yoga", "Zoology", "Others"
];

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: {
      type: String,
      enum: topics,
      required: true
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

postSchema.index(
  { title: "text", content: "text", topic: "text" },
  {
    weights: { title: 5, content: 3, topic: 1 }, 
    name: "TextIndex_Post"
  }
);

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;
export { topics };
