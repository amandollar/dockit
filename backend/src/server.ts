import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { WebSocketServer } from 'ws';
import app from './app';
import env from './config/env';
import connectDatabase from './config/database';
import logger from './utils/logger';
import { handleWorkspaceChatUpgrade } from './websocket/workspace-chat';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    // Ensure upload directory exists so multer can write temp files
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    await fs.mkdir(uploadDir, { recursive: true });
    logger.info(`Upload directory ready: ${uploadDir}`);

    const PORT = parseInt(env.PORT) || 5000;
    const server = http.createServer(app);
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const path = request.url?.split('?')[0] || '';
      if (path !== '/ws') {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        handleWorkspaceChatUpgrade(request, ws, head);
      });
    });

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();
