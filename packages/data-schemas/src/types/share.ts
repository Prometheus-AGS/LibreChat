import type { Types } from 'mongoose';
import type { IMessage } from './message';

export interface ISharedLink {
  _id?: Types.ObjectId;
  conversationId: string;
  title?: string;
  user?: string;
  messages?: Types.ObjectId[];
  shareId?: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShareServiceError extends Error {
  code: string;
}

export interface SharedLinksResult {
  links: Array<{
    shareId: string;
    title: string;
    isPublic: boolean;
    createdAt: Date;
    conversationId: string;
  }>;
  nextCursor?: Date;
  hasNextPage: boolean;
}

export interface AuthContext {
  isAuthenticated: boolean;
  userId: string | null;
  canInteractWithArtifacts: boolean;
  artifactMode: 'interactive' | 'static';
}

export interface SharedMessagesResult {
  conversationId: string;
  messages: Array<IMessage>;
  shareId: string;
  title?: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  authContext?: AuthContext;
}

export interface CreateShareResult {
  shareId: string;
  conversationId: string;
}

export interface UpdateShareResult {
  shareId: string;
  conversationId: string;
}

export interface DeleteShareResult {
  success: boolean;
  shareId: string;
  message: string;
}

export interface GetShareLinkResult {
  shareId: string | null;
  success: boolean;
}

export interface DeleteAllSharesResult {
  message: string;
  deletedCount: number;
}
