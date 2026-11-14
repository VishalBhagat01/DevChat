import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';
import projectService from '../services/project.service.js';
import messageModel from '../models/message.model.js';
import { validationResult } from 'express-validator';

// ─── Priority 2.4: File Tree Storage Protection ──────────────────────────────
// Maximum size for in-database fileTree serialization (5MB safe boundary well below 16MB BSON limit)
const MAX_FILE_TREE_BYTES = 5 * 1024 * 1024;
const DISALLOWED_PATH_PATTERNS = [
    /(^|\/)node_modules(\/|$)/,
    /(^|\/)\.git(\/|$)/,
    /(^|\/)\.next(\/|$)/,
    /(^|\/)dist(\/|$)/,
    /(^|\/)build(\/|$)/
];

export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;

        // Priority 2.1: Use req.user.id directly from JWT payload, eliminating redundant DB query
        const userId = req.user.id || req.user._id;

        const newProject = await projectService.createProject(name, userId);

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(400).json({ error: error.message, message: error.message });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        // Priority 2.1: Use req.user.id directly from JWT payload
        const userId = req.user.id || req.user._id;

        // Priority 2.6: Handled via projectService using .lean()
        const allProjects = await projectService.getAllProjectsByUserId(userId);

        res.status(200).json(allProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(400).json({ error: error.message });
    }
};

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId, users, projectId } = req.body;
        const targetUserIds = Array.isArray(users) ? users : userId ? [userId] : [];

        if (!projectId || !targetUserIds.length) {
            return res.status(400).json({ error: 'Project ID and at least one user ID are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        // Priority 2.1: Use req.user.id directly from JWT payload
        const loggedInUserId = req.user.id || req.user._id;

        // Priority 4.2: Verify requester is project owner or existing collaborator
        const project = await projectModel.findOne({ _id: projectId, users: loggedInUserId }).select('_id owner users').lean();

        if (!project) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        const updatedProject = await projectService.addUserToProject(targetUserIds, projectId);

        return res.status(200).json({ message: 'User added to project successfully', project: updatedProject });

    } catch (error) {
        console.error('Error adding user to project:', error);
        res.status(400).json({ error: error.message });
    }
};

export const getProjectById = async (req, res) => {
    // Priority 4.4: Validation error check for projectId parameter
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId } = req.params;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        // Priority 2.1: Use req.user.id directly from JWT payload
        const userId = req.user.id || req.user._id;

        // Priority 2.6: Use .lean() for read-only project fetch
        const project = await projectModel.findOne({ _id: projectId, users: userId })
            .populate('owner', 'email')
            .lean();

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(400).json({ error: error.message });
    }
};

export const updateFileTree = async (req, res) => {
    // Priority 4.4: Validation error check for request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, fileTree } = req.body;

        if (!projectId || !fileTree || typeof fileTree !== 'object' || Array.isArray(fileTree)) {
            return res.status(400).json({ error: 'Project ID and a valid file tree object are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        // Priority 2.4: Validate fileTree payload size to avoid BSON 16MB document limit
        const serialized = JSON.stringify(fileTree);
        const payloadSize = Buffer.byteLength(serialized, 'utf8');
        if (payloadSize > MAX_FILE_TREE_BYTES) {
            return res.status(413).json({
                error: `File tree payload (${(payloadSize / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed limit of 5MB.`
            });
        }

        // Priority 2.4: Reject unneeded heavy artifact directories
        const filePaths = Object.keys(fileTree);
        for (const filePath of filePaths) {
            if (DISALLOWED_PATH_PATTERNS.some(pattern => pattern.test(filePath))) {
                return res.status(400).json({
                    error: `Forbidden path in fileTree: "${filePath}". Directories such as node_modules, .git, and build artifacts cannot be synced to the database.`
                });
            }
        }

        // Priority 2.1: Use req.user.id directly from JWT payload
        const userId = req.user.id || req.user._id;

        const project = await projectModel.findOneAndUpdate(
            { _id: projectId, users: userId },
            { $set: { fileTree } },
            { new: true, runValidators: true }
        ).select('fileTree').lean();

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        return res.status(200).json({ fileTree: project.fileTree });
    } catch (error) {
        console.error('Error updating project file tree:', error);
        return res.status(400).json({ error: error.message });
    }
};

// ─── Priority 3.4 & 4.4: Chat Message Persistence, Pagination & ID Validation ──
export const getProjectMessages = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId } = req.params;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        const userId = req.user.id || req.user._id;

        // Verify authorization: requester must be a member of the project
        const project = await projectModel.findOne({ _id: projectId, users: userId }).select('_id').lean();
        if (!project) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const cursor = req.query.cursor;
        let cursorValue = null;

        if (cursor) {
            try {
                cursorValue = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
                if (!cursorValue.createdAt || !mongoose.Types.ObjectId.isValid(cursorValue.id)) {
                    throw new Error('Invalid cursor');
                }
                cursorValue.createdAt = new Date(cursorValue.createdAt);
                if (Number.isNaN(cursorValue.createdAt.getTime())) {
                    throw new Error('Invalid cursor');
                }
            } catch {
                return res.status(400).json({ error: 'Invalid message cursor' });
            }
        }

        const totalMessages = await messageModel.countDocuments({ projectId });

        const messageQuery = { projectId };
        if (cursorValue) {
            messageQuery.$or = [
                { createdAt: { $lt: cursorValue.createdAt } },
                { createdAt: cursorValue.createdAt, _id: { $lt: cursorValue.id } }
            ];
        }

        // Retrieve the latest messages for the project, returned in chronological order.
        // Cursor requests use createdAt and _id together to avoid duplicates at equal timestamps.
        const messageRequest = messageModel.find(messageQuery)
            .sort(cursorValue ? { createdAt: -1, _id: -1 } : { createdAt: -1 });
        if (cursorValue) {
            messageRequest.limit(limit + 1);
        } else {
            messageRequest.skip((page - 1) * limit).limit(limit);
        }
        const messages = await messageRequest.lean();

        const hasMore = Boolean(cursorValue && messages.length > limit);
        if (hasMore) {
            messages.pop();
        }

        // Reverse to return chronological order (oldest -> newest) for chat rendering
        messages.reverse();

        const nextCursor = hasMore && messages.length > 0
            ? Buffer.from(JSON.stringify({
                createdAt: messages[0].createdAt,
                id: messages[0]._id
            })).toString('base64url')
            : null;

        return res.status(200).json({
            messages,
            page,
            totalPages: Math.ceil(totalMessages / limit),
            totalMessages,
            nextCursor,
            hasMore
        });
    } catch (error) {
        console.error('Error fetching project messages:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
