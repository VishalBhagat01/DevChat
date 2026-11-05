import { Router } from 'express';
import { body, param } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { sensitiveRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/create', 
    authUser,
    sensitiveRateLimiter,
    body('name').isString().withMessage('Project name must be a string').trim().notEmpty().withMessage('Project name is required'),
    projectController.createProject
);

router.get('/all', authUser, projectController.getAllProjects);

// Priority 4.4: Input validation on projectId across routes
router.put('/add-user', 
    authUser,
    sensitiveRateLimiter,
    body('projectId').isMongoId().withMessage('Invalid project ID format'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    body('users').optional().isArray({ min: 1 }).withMessage('Users must be a non-empty array'),
    projectController.addUserToProject
);

router.get('/get-project/:projectId', 
    authUser,
    param('projectId').isMongoId().withMessage('Invalid project ID format'),
    projectController.getProjectById
);

router.put('/update-file-tree', 
    authUser,
    body('projectId').isMongoId().withMessage('Invalid project ID format'),
    body('fileTree').isObject().withMessage('Valid file tree object is required'),
    projectController.updateFileTree
);

// Priority 3.4 & 4.4: Chat Message Persistence & Pagination with projectId validation
router.get('/:projectId/messages', 
    authUser,
    param('projectId').isMongoId().withMessage('Invalid project ID format'),
    projectController.getProjectMessages
);

router.get('/messages/:projectId', 
    authUser,
    param('projectId').isMongoId().withMessage('Invalid project ID format'),
    projectController.getProjectMessages
);

export default router;
