import 'dotenv/config';
import http from 'http';
import app from './app.js'
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import { corsOptions } from './config/cors.js';
import redisClient from './services/redis.service.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server , {
  cors: corsOptions
});

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


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {


            const prompt = message.replace('@ai', '');

            const result = await generateResult(prompt);


            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: {
                    _id: 'ai',
                    email: 'AI'
                }
            })


            return
        }


    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});