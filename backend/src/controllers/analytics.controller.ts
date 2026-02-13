import { Request, Response } from 'express';
import * as activityService from '../services/activity.service';
import Document from '../models/Document';
import Workspace from '../models/Workspace';
import logger from '../utils/logger';

/**
 * GET /api/analytics/me
 * Returns activity streak, last active date, 365-day grid, and summary stats.
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const userId = user._id.toString();
    const [activity, docCount, workspaceCount] = await Promise.all([
      activityService.getActivityForUser(userId),
      Document.countDocuments({ uploadedBy: user._id }),
      Workspace.countDocuments({
        $or: [{ owner: user._id }, { 'members.user': user._id }],
      }),
    ]);
    res.json({
      success: true,
      data: {
        streak: activity.streak,
        lastActiveDate: activity.lastActiveDate,
        days: activity.days,
        totalDocuments: docCount,
        totalWorkspaces: workspaceCount,
      },
    });
  } catch (error) {
    logger.error('analytics me error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to load analytics' } });
  }
}
