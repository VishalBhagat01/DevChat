import userModel from "../models/user.model.js";
import { createService } from "../services/user.service.js";

export const createUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await createService(req.body.email, req.body.password);

        const token = await user.generateJWT();

        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const loginUserController = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {email , password} = req.body;

        const user = await userModel.findOne({ email });

        if(!user){
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

    } catch (err){
        res.status(400).json({ error: err.message });
    }
}