import multer from 'multer';
import path from 'path';
import env from './env';
import { Request } from 'express';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Allowed document types (B2 supports any format; we restrict for security/UX)
export const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',                                                                 // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',           // .docx
  'application/vnd.ms-excel',                                                            // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',                  // .xlsx
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_DOCUMENT_MIMES.includes(file.mimetype as typeof ALLOWED_DOCUMENT_MIMES[number])) {
    cb(null, true);
  } else {
    cb(new Error('Only documents are allowed (PDF, Word, Excel, text, CSV, images)'));
  }
};

// Multer configuration for document uploads
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const maxFileSize = parseInt(env.MAX_FILE_SIZE, 10);
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number.isNaN(maxFileSize) ? DEFAULT_MAX_FILE_SIZE : maxFileSize,
  },
});

// Avatar upload: memory storage, images only, 2MB max
const avatarStorage = multer.memoryStorage();
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const avatarFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: AVATAR_MAX_SIZE },
});

export default upload;
