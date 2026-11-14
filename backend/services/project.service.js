import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';

export const createProject = async (name, userid) => {
    if (!name || !userid) {
        throw new Error('Project name and user ID are required');
    }

    if (!mongoose.Types.ObjectId.isValid(userid)) {
        throw new Error('Invalid user ID format');
    }

    let project;
    try {
        // Priority 4.2: Explicitly assign project owner along with initial users list
        project = await projectModel.create({
            name: name,
            owner: userid,
            users: [userid]
        });
    } catch (error) {
        // Priority 4.1: Handle compound unique index conflict (name + owner)
        if (error.code === 11000) {
            throw new Error('You already have a project with this name');
        }
        throw new Error('Error creating project: ' + error.message);
    }

    return project;
};

export const getAllProjectsByUserId = async (userid) => {
    if (!userid) {
        throw new Error('User ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(userid)) {
        throw new Error('Invalid user ID format');
    }

    // Priority 2.6 & 4.3: Use .lean() and sort by most recently modified
    const allProjects = await projectModel.find({ users: userid })
        .select('_id name owner users createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .lean();

    return allProjects;
};

export const addUserToProject = async (userIds, projectId) => {
    if (!projectId) {
        throw new Error('Project ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid Project ID');
    }

    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const validIds = ids.filter(Boolean);

    if (!validIds.length) {
        throw new Error('User ID and Project ID are required');
    }

    const invalidIds = validIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length) {
        throw new Error('Invalid User ID or Project ID');
    }

    const project = await projectModel.findById(projectId).select('users owner').lean();
    if (!project) {
        throw new Error('Project not found');
    }

    const newUsers = validIds.filter(id => !project.users.some(user => user.toString() === id.toString()));

    const updatedProject = await projectModel.findByIdAndUpdate(
        projectId,
        { $addToSet: { users: { $each: newUsers } } },
        { new: true }
    ).lean();

    return updatedProject;
};

const projectService = {
    createProject,
    getAllProjectsByUserId,
    addUserToProject
};

export default projectService;
