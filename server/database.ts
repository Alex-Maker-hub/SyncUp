import mongoose, { Schema, Document } from "mongoose";

// Interface Definitions for Mongo Documents
export interface IMoodHistory {
  date: string;
  mood: string;
  note?: string;
}

export interface IUserDocument extends Document {
  clerkUserId: string; // Linking clerk account
  googleEmail?: string;
  email?: string;
  username: string; // Anonymous nickname e.g. SoothingPanda120
  avatarSeed: string;
  role: "user" | "admin";
  streak: number;
  moodHistory: IMoodHistory[];
  bookmarks: string[];
  createdAt: Date;
}
export interface IComment {
  _id?: string;
  content: string;
  username: string;
  avatarSeed: string;
  clerkUserId: string;
  createdAt: Date;
}

export interface IPostDocument extends Document {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  createdAt: Date;
  username: string;
  clerkUserId: string;
  avatarSeed: string;
  reactions: Map<string, number>;
  userReactions: Map<string, string>; // clerkUserId -> reactionType
  isReported: boolean;
  reportsCount: number;
  reportReason?: string;
  aiModerated: boolean;
  aiSafetyStatus: "clean" | "flagged" | "pending";
  aiReflection?: string;
  comments: IComment[];
}

// Mongoose Schema Registrations
const MoodHistorySchema = new Schema<IMoodHistory>({
  date: { type: String, required: true },
  mood: { type: String, required: true },
  note: { type: String }
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  clerkUserId: { type: String, required: true, unique: true, index: true },
  googleEmail: { type: String, index: true },
  email: { type: String, index: true },
  username: { type: String, required: true, unique: true },
  avatarSeed: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  streak: { type: Number, default: 0 },
  moodHistory: [MoodHistorySchema],
  bookmarks: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  username: { type: String, required: true },
  avatarSeed: { type: String, required: true },
  clerkUserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new Schema<IPostDocument>({
  title: { type: String, default: "Reflecting in the Moment" },
  content: { type: String, required: true },
  category: { type: String, required: true, index: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  username: { type: String, required: true },
  clerkUserId: { type: String, required: true },
  avatarSeed: { type: String, required: true },
  reactions: {
    type: Map,
    of: Number,
    default: () => new Map([
      ["support", 0],
      ["hugs", 0],
      ["metoo", 0],
      ["listen", 0],
      ["heart", 0]
    ])
  } as any,
  userReactions: {
    type: Map,
    of: String,
    default: () => new Map()
  } as any,
  isReported: { type: Boolean, default: false },
  reportsCount: { type: Number, default: 0 },
  reportReason: { type: String },
  aiModerated: { type: Boolean, default: false },
  aiSafetyStatus: { type: String, enum: ["clean", "flagged", "pending"], default: "pending" },
  aiReflection: { type: String },
  comments: [CommentSchema]
});

export const User = (mongoose.models.User || mongoose.model("User", UserSchema)) as any;
export const Post = (mongoose.models.Post || mongoose.model("Post", PostSchema)) as any;

// Connection state helper
let isConnected = false;
let connectionFailed = false;

export async function connectToDatabase() {
  const URI = process.env.MONGODB_URI;
  if (!URI || URI.includes("mongodb+srv://...")) {
    if (!connectionFailed) {
      console.warn("⚠️ MONGODB_URI is not configured in .env. Falling back safely to persistent in-memory operations for sandbox compatibility!");
      connectionFailed = true;
    }
    return false;
  }

  if (isConnected) {
    return true;
  }

  if (connectionFailed) {
    return false;
  }

  try {
    console.log("🔌 Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 4000, // Fail-fast after 4 seconds instead of hanging for 30s
    });
    isConnected = true;
    console.log("🔌 Successfully connected to MongoDB Atlas via Mongoose!");
    return true;
  } catch (error: any) {
    connectionFailed = true;
    console.log("ℹ️ MongoDB Atlas is not accessible or your IP is not whitelisted. Falling back safely to persistent in-memory state.");
    return false;
  }
}
