import mongoose, { Document, Schema } from "mongoose";

export type AuthProvider = "credentials" | "google";

export interface UserDocument extends Document {
  username: string;
  email?: string;
  passwordHash?: string;
  provider: AuthProvider;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      default: null,
    },
    passwordHash: { type: String },
    provider: { type: String, enum: ["credentials", "google"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $exists: true, $ne: null } },
  }
);

const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export default UserModel;

