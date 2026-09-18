import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";
import { createService } from "../services/user.service.js";
import * as userService from "../services/user.service.js";
import redisClient from "../services/redis.service.js";

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

        console.log(`[Register Success] User registered: ${user.email}`);
        res.status(201).json({ user, token, message: 'User registered successfully' });
    } catch (error) {
        console.error('[Register Error]', error.message || error);
        res.status(400).json({ error: error.message, message: error.message });
    }
}

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

        console.log(`[Login Success] User logged in: ${email}`);
        res.status(200).json({ user, token, message: 'Login successful' });

    } catch (err) {
        console.error('[Login Controller Error]', err.message || err);
        res.status(400).json({ error: err.message, message: err.message });
    }
}

export const profileUserController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        res.status(200).json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const logoutUserController = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (token) {
            try {
                await redisClient.set(`blacklist_${token}`, 'logout', 'EX', 24 * 60 * 60);
            } catch (redisErr) {
                // Redis offline or unauthenticated
            }
        }

        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUserId = await userModel.findOne({ email: req.user.email }).select('_id');


        const users = await userService.getAllUsersService({userId: loggedInUserId._id});

        res.status(200).json({ users });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }   
}