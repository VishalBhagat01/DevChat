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
        res.status(500).json({ message: 'Internal server error' });
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

        // Priority 2.6: Use .lean() and select only _id for verification
        const project = await projectModel.findOne({ _id: projectId, users: loggedInUserId }).select('_id').lean();

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
    try {
        const { projectId } = req.params;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        // Priority 2.1: Use req.user.id directly from JWT payload
        const userId = req.user.id || req.user._id;

        // Priority 2.6: Use .lean() for read-only project fetch
        const project = await projectModel.findOne({ _id: projectId, users: userId }).lean();

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

// ─── Priority 3.4: Chat Message Persistence & Pagination ─────────────────────
export const getProjectMessages = async (req, res) => {
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
        const skip = (page - 1) * limit;

        const totalMessages = await messageModel.countDocuments({ projectId });

        // Retrieve the latest messages for the project, returned in chronological order
        const messages = await messageModel.find({ projectId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Reverse to return chronological order (oldest -> newest) for chat rendering
        messages.reverse();

        return res.status(200).json({
            messages,
            page,
            totalPages: Math.ceil(totalMessages / limit),
            totalMessages
        });
    } catch (error) {
        console.error('Error fetching project messages:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
