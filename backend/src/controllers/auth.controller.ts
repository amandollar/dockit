import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as activityService from '../services/activity.service';
import User from '../models/User';
import fileStorageService from '../services/file-storage.service';
import * as cloudinaryService from '../services/cloudinary.service';
import logger from '../utils/logger';

/** Avatar in DB is either a full URL (Google) or a B2 file path. Return a URL the frontend can use (signed for B2). */
async function resolveAvatarUrl(avatar: string | undefined): Promise<string | undefined> {
  if (!avatar) return undefined;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  try {
    const signed = await fileStorageService.generateSignedDownloadUrl(avatar, 7 * 24 * 60 * 60); // 7 days
    return signed;
  } catch (err) {
    logger.warn('Could not generate signed avatar URL', { avatar, err });
    return undefined;
  }
}

/**
 * GET /api/auth/google
 * Returns the Google OAuth2 URL for the frontend to redirect the user.
 */
export async function getGoogleAuthUrl(_req: Request, res: Response): Promise<void> {
  try {
    const url = authService.getGoogleAuthUrl();
    res.json({ success: true, data: { url } });
  } catch (error) {
    logger.error('getGoogleAuthUrl error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Failed to generate Google auth URL' },
    });
  }
}

/**
 * POST /api/auth/google/callback
 * Body: { code: string }
 * Exchanges code for user, creates/updates user, returns JWT.
 */
export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    const code = req.body?.code as string;
    if (!code) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CODE', message: 'Authorization code is required' },
      });
      return;
    }
    const profile = await authService.getGoogleUserFromCode(code);
    const user = await authService.createOrGetUser(profile);
    await activityService.recordActivity(user._id.toString());
    const tokens = authService.generateTokens(user);
    const avatarUrl = await resolveAvatarUrl(user.avatar);
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: avatarUrl,
          role: user.role,
        },
        ...tokens,
      },
    });
  } catch (error) {
    logger.error('googleCallback error:', error);
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Google sign-in failed' },
    });
  }
}

/**
 * GET /api/auth/me
 * Requires JWT. Returns current user.
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const avatarUrl = await resolveAvatarUrl(user.avatar);
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: avatarUrl,
        role: user.role,
        workspaces: user.workspaces,
      },
    });
  } catch (error) {
    logger.error('me error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get user' },
    });
  }
}

/**
 * POST /api/auth/me/avatar
 * Multipart: single file field "avatar" (image). Uploads to Cloudinary, updates user.avatar. Requires JWT.
 */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const file = req.file as Express.Multer.File | undefined;
    if (!file || !file.buffer) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FILE', message: 'No image file provided' },
      });
      return;
    }
    const imageUrl = await cloudinaryService.uploadProfileImage(file.buffer, file.originalname);
    user.avatar = imageUrl;
    await user.save();
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        workspaces: user.workspaces,
      },
    });
  } catch (error) {
    logger.error('uploadAvatar error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload avatar';
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message },
    });
  }
}

/**
 * PATCH /api/auth/me
 * Body: { name?: string, avatar?: string }
 * Update current user profile. Requires JWT.
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    const name = req.body?.name as string | undefined;
    const avatar = req.body?.avatar as string | undefined;
    if (name === undefined && avatar === undefined) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Provide at least one of name or avatar' },
      });
      return;
    }
    const updated = await authService.updateProfile(user._id.toString(), { name, avatar });
    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }
    const avatarUrl = await resolveAvatarUrl(updated.avatar);
    res.json({
      success: true,
      data: {
        id: updated._id,
        email: updated.email,
        name: updated.name,
        avatar: avatarUrl,
        role: updated.role,
        workspaces: updated.workspaces,
      },
    });
  } catch (error) {
    logger.error('updateProfile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update profile' },
    });
  }
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 * Returns new access token.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken as string;
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token is required' },
      });
      return;
    }
    const userId = await authService.verifyRefreshToken(refreshToken);
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'User not found' },
      });
      return;
    }
    const tokens = authService.generateTokens(user);
    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (error) {
    logger.error('refresh error:', error);
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
    });
  }
}
