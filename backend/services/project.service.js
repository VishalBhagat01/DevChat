import projectModel from '../models/project.model.js';
import mongoose from 'mongoose';

export const createProject = async (name , userid) => {

    if(!name || !userid){
        throw new Error('Project name and user ID are required');
    }

    let project;
    try {
        project = await projectModel.create({
            name: name,
            users: [userid]
        });
    } catch (error) {
        if(error.code === 11000) {
            throw new Error('Project name already exists');
        }
        throw new Error('Error creating project: ' + error.message);
    }

    return project;
}
    

export const getAllProjectsByUserId = async (userid) => {
    if(!userid){
        throw new Error('User ID is required');
    }

    const allProjects = await projectModel.find({ users: userid });

    return allProjects;
}

export const addUserToProject = async (userId, projectId) => {
    if(!userId || !projectId){
        throw new Error('User ID and Project ID are required');
    }

    if(!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error('Invalid User ID or Project ID');
    }

    const project = await projectModel.findOne({ _id: projectId, users: userId });

    if(!project){
        throw new Error('Project not found or user already added to the project');
    }

    const updatedProject = await projectModel.findByIdAndUpdate(
        projectId,
        { $addToSet: { users: userId } },
        { new: true }
    );

    return updatedProject;
}

const projectService = {
    createProject,
    getAllProjectsByUserId,
    addUserToProject
};

export default projectService;