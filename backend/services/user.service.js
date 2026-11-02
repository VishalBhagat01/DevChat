import userModel from "../models/user.model.js";

export const createService = async (email, password) => {

    if(!email || !password) {
        throw new Error("Email and password are required");
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userModel.create({ 
        email, 
        password: hashedPassword 
    });

    return user;
}

// ─── Priority 2.3 & 2.6: Bounded Query, Search Filtering & .lean() ───────────
export const getAllUsersService = async ({ userId, search = '', limit = 50, page = 1 }) => {
    const query = { _id: { $ne: userId } };

    if (search && typeof search === 'string' && search.trim()) {
        const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.email = { $regex: sanitized, $options: 'i' };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const users = await userModel.find(query)
        .select('-password')
        .skip(skip)
        .limit(parsedLimit)
        .lean();

    return users;
}
