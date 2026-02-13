import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateParamId } from '../middleware/validateId.middleware';
import upload from '../config/multer';

const router = Router();

router.use(requireAuth);

// Upload: multipart form with field "file" (PDF) and "workspaceId" – multer errors passed to error handler
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) return next(err);
    next();
  });
}, documentController.upload);

// One-off summarize: upload a file, get AI summary (no workspace, no storage)
router.post('/summarize-file', (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) return next(err);
    next();
  });
}, documentController.summarizeFile);

// List documents in a workspace: GET /documents/workspace/:workspaceId
router.get('/workspace/:workspaceId', validateParamId('workspaceId'), documentController.list);

// Get one document metadata
router.get('/:id', validateParamId('id'), documentController.getById);

// Download file
router.get('/:id/download', validateParamId('id'), documentController.download);

// AI: generate summary (Vercel AI SDK + Gemini)
router.post('/:id/summarize', validateParamId('id'), documentController.summarize);

// AI: stream answer to a question about the document
router.post('/:id/ask', validateParamId('id'), documentController.ask);

// Delete document
router.delete('/:id', validateParamId('id'), documentController.remove);

export default router;
