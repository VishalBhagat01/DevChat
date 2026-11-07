import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './db/db.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import messageModel from './models/message.model.js';
import { generateResultStream } from './services/ai.service.js';
import { corsOptions } from './config/cors.js';
import redisClient, { createRedisClient } from './services/redis.service.js';
import { checkSocketAiRateLimit } from './middleware/rateLimiter.middleware.js';
import { createAdapter } from '@socket.io/redis-adapter';

const PORT = process.env.PORT || 3000;

const requiredProductionEnv = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_AI_KEY', 'CLIENT_URL'];

const validateEnvironment = () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = requiredProductionEnv.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }
};

const server = http.createServer(app);

// ─── Priority 3.5: Cloud Load Balancer WebSocket Disconnect Prevention ─────────
// Configured ping timeout and intervals to avoid aggressive TCP termination by ALB / Render / Cloudflare
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// ─── Priority 3.1: Socket.IO Redis Adapter for Multi-Instance Horizontal Scaling 
const initRedisAdapter = async () => {
  let pubClient = null;
  let subClient = null;
  try {
    pubClient = createRedisClient({ enableOfflineQueue: true, maxRetriesPerRequest: 1 });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.warn('[Redis Pub Error]', err.message));
    subClient.on('error', (err) => console.warn('[Redis Sub Error]', err.message));

    // Verify connectivity before attaching adapter to avoid unhandled reconnection drops
    await Promise.race([
      pubClient.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 3000))
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.IO] Redis adapter connected and enabled for multi-instance scaling');
  } catch (adapterErr) {
    if (pubClient) {
      try { pubClient.disconnect(); } catch (_) {}
    }
    if (subClient) {
      try { subClient.disconnect(); } catch (_) {}
    }
    console.warn(`[Socket.IO] Redis adapter unavailable (${adapterErr.message}). Running with in-memory adapter.`);
  }
};

initRedisAdapter();

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query?.projectId;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        let isBlackListed = null;
        try {
            isBlackListed = await redisClient.get(`blacklist_${token}`);
        } catch (redisErr) {
            // Redis error or unauthenticated, allow auth to proceed via JWT verification
        }

        if (isBlackListed) {
            return next(new Error('Authentication error: Token is blacklisted'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || (!decoded.id && !decoded._id)) {
            return next(new Error('Authentication error'));
        }

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return next(new Error('Project not found'));
        }

        const userId = (decoded.id || decoded._id).toString();
        const isAuthorized = Array.isArray(project.users) && project.users.some(user => user.toString() === userId);

        if (!isAuthorized) {
            return next(new Error('Forbidden: You are not a collaborator on this project'));
        }

        socket.user = decoded;
        socket.project = project;

        next();
    } catch (error) {
        next(error);
    }
});

io.on('connection', socket => {
    if (!socket.project?._id) {
        socket.disconnect(true);
        return;
    }

    socket.roomId = socket.project._id.toString();
    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        try {
            if (!data || !data.message) return;

            const rawMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
            const aiIsPresentInMessage = rawMessage.includes('@ai');

            const sender = {
                _id: (socket.user && (socket.user.id || socket.user._id)) || (data.sender && data.sender._id) || 'unknown',
                email: (socket.user && socket.user.email) || (data.sender && data.sender.email) || 'User'
            };

            const userMessagePayload = {
                message: rawMessage,
                sender,
                isAi: false,
                timestamp: new Date().toISOString()
            };

            // Broadcast user message to other collaborators in the room
            socket.broadcast.to(socket.roomId).emit('project-message', userMessagePayload);

            // Priority 3.4: Asynchronously persist user message to MongoDB
            messageModel.create({
                projectId: socket.project._id,
                sender,
                message: rawMessage,
                isAi: false,
                timestamp: new Date()
            }).catch(err => console.error('[Message Persistence Error (User)]:', err.message));

            if (aiIsPresentInMessage) {
                // Rate-limit @ai commands: 10 per minute per user
                const rateCheck = checkSocketAiRateLimit(socket);
                if (!rateCheck.allowed) {
                    const rateLimitMsg = {
                        message: JSON.stringify({
                            text: `⚠️ Rate limit exceeded. You can send another @ai message in ${Math.ceil(rateCheck.retryAfterMs / 1000)} seconds.`
                        }),
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        },
                        isAi: true,
                        timestamp: new Date().toISOString()
                    };
                    socket.emit('project-message', rateLimitMsg);
                    return;
                }

                const prompt = rawMessage.replace('@ai', '').trim();

                // Priority 3.3: Emit ai-status "generating" to entire room
                io.to(socket.roomId).emit('ai-status', {
                    status: 'generating',
                    prompt,
                    sender
                });

                // Priority 3.2: Robust try/catch prevents unhandled AI rejection from crashing Node.js process
                try {
                    let chunkIndex = 0;
                    const result = await generateResultStream(prompt, (chunkText) => {
                        chunkIndex++;
                        io.to(socket.roomId).emit('ai-chunk', {
                            chunk: chunkText,
                            index: chunkIndex
                        });
                    });

                    const aiPayload = {
                        message: result,
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        },
                        isAi: true,
                        timestamp: new Date().toISOString()
                    };

                    io.to(socket.roomId).emit('ai-status', { status: 'done' });
                    io.to(socket.roomId).emit('project-message', aiPayload);
                    io.to(socket.roomId).emit('ai-status', { status: 'idle' });

                    // Priority 3.4: Asynchronously persist AI generation to MongoDB
                    messageModel.create({
                        projectId: socket.project._id,
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        },
                        message: result,
                        isAi: true,
                        timestamp: new Date()
                    }).catch(err => console.error('[Message Persistence Error (AI)]:', err.message));

                } catch (aiErr) {
                    console.error('[AI Socket Error]:', aiErr.message || aiErr);

                    // Notify room of error and clear thinking state without crashing server
                    io.to(socket.roomId).emit('ai-status', {
                        status: 'error',
                        error: aiErr.message || 'AI generation failed'
                    });

                    io.to(socket.roomId).emit('ai-error', {
                        message: aiErr.message || 'AI generation failed'
                    });

                    const fallbackMessage = {
                        message: JSON.stringify({
                            text: `⚠️ AI is temporarily unavailable: ${aiErr.message || 'Failed to generate response'}. Please try again.`
                        }),
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        },
                        isAi: true,
                        timestamp: new Date().toISOString()
                    };

                    io.to(socket.roomId).emit('project-message', fallbackMessage);
                    io.to(socket.roomId).emit('ai-status', { status: 'idle' });

                    // Persist error message for chat history continuity
                    messageModel.create({
                        projectId: socket.project._id,
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        },
                        message: fallbackMessage.message,
                        isAi: true,
                        timestamp: new Date()
                    }).catch(() => {});
                }
            }
        } catch (eventErr) {
            console.error('[Socket project-message Error]:', eventErr.message || eventErr);
        }
    });

    socket.on('disconnect', () => {
        socket.leave(socket.roomId);
    });
});

const startServer = async () => {
  validateEnvironment();
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

const shutdown = async (signal) => {
  console.log(`[Shutdown] Received ${signal}. Closing server gracefully...`);
  server.close(async () => {
    await mongoose.disconnect();
    redisClient.disconnect();
    console.log('[Shutdown] Server stopped');
    process.exit(0);
  });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

startServer().catch((error) => {
  console.error('[Startup Error] Backend stopped during startup:', error.message);
  process.exit(1);
});
