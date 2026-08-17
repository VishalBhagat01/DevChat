import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import { authUser } from '../middleware/auth.middleware.js';


const router = Router();


router.post('/create', 
    authUser,
    body('name').isString().withMessage('Project name must be a string').notEmpty().withMessage('Project name is required'),
    projectController.createProject
);

router.get('/all', authUser, projectController.getAllProjects);

router.put('/add-user', authUser,
    body('userId').isString().withMessage('User ID must be a string').notEmpty().withMessage('User ID is required'),
    projectController.addUserToProject);


router.get('/get-project/:projectId', authUser, projectController.getProjectById);

export default router;