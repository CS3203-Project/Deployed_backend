import express from 'express';
import * as companyController from '../controllers/company.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import validationMiddleware from '../middlewares/validation.middleware.js';
import { createCompanySchema, updateCompanySchema } from '../validators/company.validator.js';

const router: import('express').Router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all companies for the authenticated provider
router.get('/', companyController.getCompanies);

// Create a new company
router.post('/', validationMiddleware(createCompanySchema), companyController.createCompany);

// Update a company
router.put('/:companyId', validationMiddleware(updateCompanySchema), companyController.updateCompany);

// Delete a company
router.delete('/:companyId', companyController.deleteCompany);

export default router;
