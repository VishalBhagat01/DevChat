import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";


export const authUser = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User' });
        }

        const isBlackListed = await redisClient.get(`blacklist_${token}`);

        if (isBlackListed) {
            res.clearCookie('token');

            return res.status(401).send({ error: 'Unauthorized User' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error?.name === 'TokenExpiredError') {
            res.clearCookie('token');
            return res.status(401).send({ error: 'Token expired. Please login again.' });
        }

        if (error?.name === 'JsonWebTokenError') {
            res.clearCookie('token');
            return res.status(401).send({ error: 'Invalid token. Please login again.' });
        }

        console.error('Auth middleware error:', error);
        return res.status(401).send({ error: 'Unauthorized User' });
    }
}