import type { Request, Response, NextFunction } from 'express';
import * as companyService from '../services/company.service.js';

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.createCompany((req as any).user.id, req.body);
    res.status(201).json({ 
      message: 'Company created successfully', 
      company 
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await companyService.updateCompany((req as any).user.id, req.params.companyId!, req.body);
    res.status(200).json({ 
      message: 'Company updated successfully', 
      company 
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await companyService.deleteCompany((req as any).user.id, req.params.companyId!);
    res.status(200).json({ 
      message: 'Company deleted successfully' 
    });
  } catch (err) {
    next(err);
  }
};

export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await companyService.getCompanies((req as any).user.id);
    res.status(200).json(companies);
  } catch (err) {
    next(err);
  }
};
