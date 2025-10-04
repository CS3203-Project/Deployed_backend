import { prisma } from '../utils/database.js';

// Types
interface CompanyCreateData {
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  contact?: string;
  socialmedia?: any;
}

interface CompanyUpdateData {
  name?: string;
  description?: string;
  logo?: string;
  address?: string;
  contact?: string;
  socialmedia?: any;
}

export const createCompany = async (userId: string, companyData: CompanyCreateData) => {
  // Check if user is a verified provider
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    select: { id: true, isVerified: true }
  });

  if (!provider) {
    throw new Error('Provider profile not found');
  }

  if (!provider.isVerified) {
    throw new Error('Only verified providers can create companies');
  }

  const company = await prisma.company.create({
    data: {
      providerId: provider.id,
      name: companyData.name,
      description: companyData.description,
      logo: companyData.logo,
      address: companyData.address,
      contact: companyData.contact,
      socialmedia: companyData.socialmedia || []
    }
  });

  return company;
};

export const updateCompany = async (userId: string, companyId: string, companyData: CompanyUpdateData) => {
  // Check if user owns this company
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: {
      companies: {
        where: { id: companyId }
      }
    }
  });

  if (!provider) {
    throw new Error('Provider profile not found');
  }

  if (provider.companies.length === 0) {
    throw new Error('Company not found or you do not have permission to update it');
  }

  const updatedData: any = {};
  if (companyData.name !== undefined) updatedData.name = companyData.name;
  if (companyData.description !== undefined) updatedData.description = companyData.description;
  if (companyData.logo !== undefined) updatedData.logo = companyData.logo;
  if (companyData.address !== undefined) updatedData.address = companyData.address;
  if (companyData.contact !== undefined) updatedData.contact = companyData.contact;
  if (companyData.socialmedia !== undefined) updatedData.socialmedia = companyData.socialmedia;

  const company = await prisma.company.update({
    where: { id: companyId },
    data: updatedData
  });

  return company;
};

export const deleteCompany = async (userId: string, companyId: string) => {
  // Check if user owns this company
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: {
      companies: {
        where: { id: companyId }
      }
    }
  });

  if (!provider) {
    throw new Error('Provider profile not found');
  }

  if (provider.companies.length === 0) {
    throw new Error('Company not found or you do not have permission to delete it');
  }

  await prisma.company.delete({
    where: { id: companyId }
  });
};

export const getCompanies = async (userId: string) => {
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: {
      companies: true
    }
  });

  if (!provider) {
    throw new Error('Provider profile not found');
  }

  return provider.companies;
};
