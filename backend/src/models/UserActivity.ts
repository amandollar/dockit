import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  count: number;
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    count: { type: Number, default: 1 },
  },
  { timestamps: false }
);

UserActivitySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
