import mongoose, { Document, Schema, Types } from "mongoose";

export type GenerationType = "text" | "image";

export type GenerationStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export interface GenerationDocument extends Document {
  userId?: Types.ObjectId;
  socketId?: string;
  name: string;
  prompt: string;
  type: GenerationType;
  status: GenerationStatus;
  imageSize?: string;
  resultText?: string;
  resultImageUrl?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  processingMs?: number;
  deletedAt?: Date;
}

const generationSchema = new Schema<GenerationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    socketId: { type: String },
    name: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed", "cancelled"],
      required: true,
      default: "pending",
    },
    imageSize: { type: String },
    resultText: { type: String },
    resultImageUrl: { type: String },
    errorMessage: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

generationSchema.virtual("processingMs").get(function (this: GenerationDocument) {
  if (!this.startedAt || !this.completedAt) {
    return undefined;
  }
  return this.completedAt.getTime() - this.startedAt.getTime();
});

const GenerationModel =
  mongoose.models.Generation ||
  mongoose.model<GenerationDocument>("Generation", generationSchema);

export default GenerationModel;

