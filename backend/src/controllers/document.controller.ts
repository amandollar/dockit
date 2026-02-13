import fs from 'fs/promises';
import { Request, Response } from 'express';
import Document from '../models/Document';
import * as documentService from '../services/document.service';
import { generateSummary, streamDocumentAnswerToResponse } from '../services/ai/vercel-ai.service';
import { extractTextFromBuffer } from '../utils/extract-text';
import { isValidObjectId } from '../utils/validators';
import logger from '../utils/logger';
import * as activityService from '../services/activity.service';

export async function upload(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const workspaceId = req.body?.workspaceId ?? req.query?.workspaceId;
    if (!workspaceId || !isValidObjectId(String(workspaceId))) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid workspaceId is required' } });
      return;
    }
    const file = req.file;
    if (!file?.path) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document file is required' } });
      return;
    }
    const doc = await documentService.uploadDocument(
      String(workspaceId),
      user,
      file.path,
      file.originalname || 'document',
      file.mimetype || 'application/octet-stream'
    );
    if (!doc) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No access to workspace or not allowed to upload' } });
      return;
    }
    const populated = await Document.findById(doc._id).populate('uploadedBy', 'name email avatar').lean();
    await activityService.recordActivity(user._id.toString());
    res.status(201).json({ success: true, data: populated || doc });
  } catch (error) {
    logger.error('document upload error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Upload failed' } });
  }
}

export async function summarizeFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const file = req.file;
    if (!file?.path) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A file is required (PDF or text)' } });
      return;
    }
    const buffer = await fs.readFile(file.path);
    await fs.unlink(file.path).catch(() => {});
    const text = await extractTextFromBuffer(buffer, file.mimetype);
    const summary = await generateSummary(file.originalname.replace(/\.[^.]+$/i, '') || 'Document', text);
    await activityService.recordActivity(req.user!._id.toString());
    res.json({ success: true, data: { summary } });
  } catch (error) {
    logger.error('summarize-file error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Summarization failed' } });
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const workspaceId = req.params.workspaceId ?? req.query?.workspaceId;
    if (!workspaceId || !isValidObjectId(String(workspaceId))) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid workspaceId is required' } });
      return;
    }
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 20));
    const result = await documentService.listByWorkspace(String(workspaceId), user._id.toString(), page, limit);
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found or no access' } });
      return;
    }
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    logger.error('document list error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list documents' } });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const doc = await documentService.getById(req.params.id, user._id.toString());
    if (!doc) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
      return;
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    logger.error('document getById error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get document' } });
  }
}

export async function download(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const result = await documentService.getDownloadStream(req.params.id, user._id.toString());
    if (!result) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
      return;
    }
    const safeName = result.filename.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_') || 'document';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.send(result.buffer);
  } catch (error) {
    logger.error('document download error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Download failed' } });
  }
}

export async function summarize(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const docMeta = await documentService.getDocumentForAi(req.params.id, user._id.toString());
    if (!docMeta) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
      return;
    }
    const text = await extractTextFromBuffer(docMeta.buffer, docMeta.mimeType);
    const summary = await generateSummary(docMeta.title, text);
    await documentService.updateDocumentSummary(req.params.id, user._id.toString(), summary);
    await activityService.recordActivity(user._id.toString());
    res.json({ success: true, data: { summary } });
  } catch (error) {
    logger.error('document summarize error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Summarization failed' } });
  }
}

export async function ask(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const question = (req.body?.question ?? req.body?.message ?? '').trim();
    if (!question) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'question is required' } });
      return;
    }
    const docMeta = await documentService.getDocumentForAi(req.params.id, user._id.toString());
    if (!docMeta) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
      return;
    }
    const text = await extractTextFromBuffer(docMeta.buffer, docMeta.mimeType);
    await streamDocumentAnswerToResponse(docMeta.title, text, question, res);
  } catch (error) {
    logger.error('document ask error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Ask failed' } });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    const ok = await documentService.removeDocument(req.params.id, user._id.toString());
    if (!ok) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found or no permission' } });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('document remove error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Delete failed' } });
  }
}
