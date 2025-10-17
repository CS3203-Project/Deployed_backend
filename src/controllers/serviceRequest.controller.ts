import type { Request, Response } from 'express';
import {
  createServiceRequest as createServiceRequestService,
  getServiceRequests,
  getServiceRequestById as getRequestByIdService,
  updateServiceRequest as updateRequestService,
  deleteServiceRequest as deleteRequestService,
  findMatchingServices as findMatches,
  sendNotificationsToMatchingProviders
} from '../services/serviceRequest.service.js';

/**
 * Create a new service request
 */
export const createServiceRequest = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      // categoryId removed
      address, 
      city,
      state,
      country,
      postalCode,
      latitude, 
      longitude 
    } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Validate required fields
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Prepare request data
    const requestData = {
      userId,
      title,
      description,
      // categoryId is not included
      address,
      city,
      state,
      country,
      postalCode,
      latitude,
      longitude
      // locationLastUpdated is handled inside the service
    };

    const newRequest = await createServiceRequestService(requestData);
    console.log('🎯 SERVICE REQUEST CREATED:', newRequest.id); // Debug log

    // Fire-and-forget: Send notifications to matching providers (don't wait)
    if (newRequest.id) {
      console.log('=====> STARTING AUTOMATIC MATCHING NOTIFICATIONS...'); // Debug log
      sendNotificationsToMatchingProviders(newRequest.id).then(() => {
        console.log('✅ NOTIFICATIONS SENT SUCCESSFULLY');
      }).catch(error => {
        console.error('❌ NOTIFICATIONS FAILED:', error);
        // Don't fail the response if notifications fail
      });
    } else {
      console.log('❌ NO REQUEST ID - NOTIFICATIONS SKIPPED');
    }

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error in createServiceRequest controller:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create service request'
    });
  }
};

/**
 * Get user's service requests
 */
export const getUserServiceRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await getServiceRequests(
      userId,
      pageNum,
      limitNum
    );

    res.status(200).json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve service requests'
    });
  }
};

/**
 * Get a specific service request by ID
 */
export const getServiceRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service request ID is required'
      });
    }
    
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const request = await getRequestByIdService(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Check if request belongs to user (unless admin)
    if (request.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service request retrieved successfully',
      data: request
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve service request'
    });
  }
};

/**
 * Update service request
 */
export const updateServiceRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service request ID is required'
      });
    }
    
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const updateData = req.body;
    const updatedRequest = await updateRequestService(id, updateData, userId);

    res.status(200).json({
      success: true,
      message: 'Service request updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update service request'
    });
  }
};

/**
 * Delete a service request
 */
export const deleteServiceRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service request ID is required'
      });
    }
    
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    await deleteRequestService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Service request deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete service request'
    });
  }
};

/**
 * Find matching services for a service request
 */
export const findMatchingServices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Service request ID is required'
      });
    }
    
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify the request belongs to the user
    const request = await getRequestByIdService(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }
    
    if (request.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const matches = await findMatches(id, pageNum, limitNum);

    res.status(200).json({
      success: true,
      message: 'Matching services found successfully',
      data: matches
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find matching services'
    });
  }
};
