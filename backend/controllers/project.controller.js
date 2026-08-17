import projectModel from '../models/project.model.js';
import projectService from '../services/project.service.js';
import { validationResult } from 'express-validator';
import userModel from '../models/user.model.js';

export const createProject = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { name } = req.body;
        const loggedInUserId = await userModel.findOne({ email: req.user.email }).select('_id');

        const userId = loggedInUserId._id;

        const newProject = await projectService.createProject(name, userId);

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}


export const getAllProjects = async (req, res) => {
    try {

        const loggedInUserId = await userModel.findOne({ email: req.user.email }).select('_id');

        const allProjects = await projectService.getAllProjectsByUserId(loggedInUserId._id);

        res.status(200).json(allProjects);

    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(400).json({ error: error.message });
    }
}

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId, projectId } = req.body;

        const loggedInUserId = await userModel.findOne({ email: req.user.email }).select('_id');

        if (!loggedInUserId) {
            return res.status(404).json({ error: 'Logged-in user not found' });
        }

        const project = await projectModel.findOne({ _id: projectId, users: loggedInUserId._id });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const updatedProject = await projectService.addUserToProject(userId, projectId);

        return res.status(200).json({ message: 'User added to project successfully', project: updatedProject });


    } catch (error) {
        console.error('Error adding user to project:', error);
        res.status(400).json({ error: error.message });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const loggedInUserId = await userModel.findOne({ email: req.user.email }).select('_id');

        const project = await projectModel.findOne({ _id: projectId, users: loggedInUserId._id });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(400).json({ error: error.message });
    }
};