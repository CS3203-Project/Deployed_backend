import { Router } from 'express';
import { 
  createServiceRequest,
  getUserServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  findMatchingServices
} from '../controllers/serviceRequest.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Service Request routes
router.post('/', createServiceRequest);
router.get('/', getUserServiceRequests);
router.get('/:id', getServiceRequestById);
router.put('/:id', updateServiceRequest);
router.delete('/:id', deleteServiceRequest);
router.get('/:id/matching', findMatchingServices);

export default router;
