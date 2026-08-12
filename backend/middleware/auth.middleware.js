import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import redisClient from '../services/redis.service.js';

export const authMiddleware = async (req, res, next) => {

    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if(!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const isBlacklisted = await redisClient.get(`blacklist_${token}`);

        if (isBlacklisted) {

            res.cookie('token','');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};