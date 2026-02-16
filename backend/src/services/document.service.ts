import fs from 'fs/promises';
import Document, { IDocument } from '../models/Document';
import Workspace from '../models/Workspace';
import fileStorageService from './file-storage.service';
import { getMemberRole } from './workspace.service';
import { IUser } from '../models/User';
import { PaginatedResponse } from '../types';
import logger from '../utils/logger';

export async function uploadDocument(
  workspaceId: string,
  uploadedBy: IUser,
  localFilePath: string,
  originalFilename: string,
  mimeType: string
): Promise<IDocument | null> {
  const role = await getMemberRole(workspaceId, uploadedBy._id.toString());
  if (!role || (role !== 'admin' && role !== 'editor')) return null;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;

  const safeName = `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const folderPath = `workspaces/${workspaceId}`;
  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(localFilePath);
  } finally {
    await fs.unlink(localFilePath).catch(() => {});
  }
  const result = await fileStorageService.uploadFileBuffer(
    fileBuffer,
    safeName,
    mimeType,
    folderPath
  );

  const title = originalFilename.replace(/\.[^.]+$/i, '') || originalFilename;
  const doc = await Document.create({
    title,
    filename: originalFilename,
    filePath: result.filePath,
    fileId: result.fileId,
    fileSize: result.fileSize,
    mimeType,
    workspace: workspaceId,
    uploadedBy: uploadedBy._id,
  });
  return doc;
}

export async function listByWorkspace(
  workspaceId: string,
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<IDocument> | null> {
  const role = await getMemberRole(workspaceId, userId);
  if (!role) return null;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Document.find({ workspace: workspaceId })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments({ workspace: workspaceId }),
  ]);
  return {
    data: items as IDocument[],
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(documentId: string, userId: string): Promise<IDocument | null> {
  const doc = await Document.findById(documentId).populate('uploadedBy', 'name email avatar').lean();
  if (!doc) return null;
  const role = await getMemberRole(doc.workspace.toString(), userId);
  if (!role) return null;
  return doc as IDocument;
}

export async function getDownloadStream(documentId: string, userId: string): Promise<{ buffer: Buffer; filename: string; mimeType: string } | null> {
  const doc = await Document.findById(documentId);
  if (!doc) return null;
  const role = await getMemberRole(doc.workspace.toString(), userId);
  if (!role) return null;
  const buffer = await fileStorageService.downloadFile(doc.filePath);
  return {
    buffer,
    filename: doc.filename,
    mimeType: doc.mimeType,
  };
}

export async function getDocumentForAi(documentId: string, userId: string): Promise<{ buffer: Buffer; mimeType: string; title: string } | null> {
  const doc = await Document.findById(documentId);
  if (!doc) return null;
  const role = await getMemberRole(doc.workspace.toString(), userId);
  if (!role) return null;
  const buffer = await fileStorageService.downloadFile(doc.filePath);
  return {
    buffer,
    mimeType: doc.mimeType,
    title: doc.title,
  };
}

export async function updateDocumentSummary(documentId: string, userId: string, summary: string): Promise<boolean> {
  const doc = await Document.findById(documentId);
  if (!doc) return false;
  const role = await getMemberRole(doc.workspace.toString(), userId);
  if (!role || (role !== 'admin' && role !== 'editor')) return false;
  doc.summary = summary;
  await doc.save();
  return true;
}

export async function removeDocument(documentId: string, userId: string): Promise<boolean> {
  const doc = await Document.findById(documentId);
  if (!doc) return false;
  const role = await getMemberRole(doc.workspace.toString(), userId);
  if (role !== 'admin' && role !== 'editor') return false;
  const filePath = doc.filePath;
  const fileId = doc.fileId;
  // Delete from DB first so we never leave an orphaned document record if B2 fails
  await Document.findByIdAndDelete(documentId);
  try {
    await fileStorageService.deleteFile(filePath, fileId);
  } catch (err) {
    // Log but still return success – doc is already gone; B2 orphan can be cleaned up later
    logger.error('removeDocument: B2 delete failed after DB delete', { documentId, filePath, err });
  }
  return true;
}
