export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  role: 'admin' | 'user' | 'client';
  plan: 'free' | 'premium';
  isBanned: boolean;
  chats: number;
  premiumUntil: Date | string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// In-memory / MongoDB Schema Definition
export const UserSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  isBanned: { type: Boolean, default: false },
  chats: { type: Number, default: 0 },
  premiumUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
};

export default UserSchema;
