import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";
import { createService } from "../services/user.service.js";
import * as userService from "../services/user.service.js";
import redisClient from "../services/redis.service.js";

// Helper for consistent cookie options (Priority 4.5)
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
};

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.warn('[Register Validation Failed]', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log(`[Register Attempt] for email: ${req.body.email}`);
        const user = await createService(req.body.email, req.body.password);

        const token = await user.generateJWT();
        delete user._doc.password;

        // Priority 4.5: Set HTTP-only secure cookie for authentication
        res.cookie('token', token, getCookieOptions());

        console.log(`[Register Success] User registered: ${user.email}`);
        res.status(201).json({ user, token, message: 'User registered successfully' });
    } catch (error) {
        console.error('[Register Error]', error.message || error);
        res.status(400).json({ error: error.message, message: error.message });
    }
};

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.warn('[Login Validation Failed]', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        console.log(`[Login Attempt] for email: ${email}`);

        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            console.warn(`[Login Failed] User not found: ${email}`);
            return res.status(400).json({ error: 'Invalid email or password', message: 'Invalid email or password' });
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            console.warn(`[Login Failed] Invalid password for: ${email}`);
            return res.status(400).json({ error: 'Invalid email or password', message: 'Invalid email or password' });
        }

        const token = await user.generateJWT();
        delete user._doc.password;

        // Priority 4.5: Set HTTP-only secure cookie for authentication
        res.cookie('token', token, getCookieOptions());

        console.log(`[Login Success] User logged in: ${email}`);
        res.status(200).json({ user, token, message: 'Login successful' });

    } catch (err) {
        console.error('[Login Controller Error]', err.message || err);
        res.status(400).json({ error: err.message, message: err.message });
    }
};

export const profileUserController = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        // Priority 2.6: Use .lean() and exclude password
        const user = await userModel.findById(userId).select('-password').lean();
        res.status(200).json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const logoutUserController = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (token) {
            try {
                await redisClient.set(`blacklist_${token}`, 'logout', 'EX', 24 * 60 * 60);
            } catch (redisErr) {
                // Redis offline or unauthenticated
            }
        }

        // Priority 4.5: Explicitly clear HTTP-only cookie with matching flags
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllUsersController = async (req, res) => {
    try {
        // Priority 2.1: Use req.user.id directly from JWT payload, eliminating redundant findOne
        const userId = req.user.id || req.user._id;

        // Priority 2.3: Support query filter & bounded pagination
        const search = req.query.q || req.query.search || '';
        const limit = req.query.limit;
        const page = req.query.page;

        const users = await userService.getAllUsersService({
            userId,
            search,
            limit,
            page
        });

        res.status(200).json({ users });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }   
};
