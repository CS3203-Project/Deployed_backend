import { prisma } from '../utils/database.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import type { Admin } from '@prisma/client';

export interface CreateAdminData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginAdminData {
  username: string;
  password: string;
}

export interface UpdateAdminData {
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export class AdminService {
  async createAdmin(data: CreateAdminData): Promise<Omit<Admin, 'password'>> {
    const hashedPassword = await hashPassword(data.password);
    
    const admin = await prisma.admin.create({
      data: {
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return admin;
  }

  async loginAdmin(data: LoginAdminData): Promise<Omit<Admin, 'password'> | null> {
    const admin = await prisma.admin.findUnique({
      where: { username: data.username },
    });

    if (!admin) {
      return null;
    }

    const isPasswordValid = await comparePassword(data.password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: admin.id,
      username: admin.username,
      firstName: admin.firstName,
      lastName: admin.lastName,
    };
  }

  async getAdminById(id: number): Promise<Omit<Admin, 'password'> | null> {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return admin;
  }

  async getAdminByUsername(username: string): Promise<Omit<Admin, 'password'> | null> {
    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return admin;
  }

  async getAllAdmins(): Promise<Omit<Admin, 'password'>[]> {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return admins;
  }

  async updateAdmin(id: number, data: UpdateAdminData): Promise<Omit<Admin, 'password'> | null> {
    // Check if username is being updated and if it already exists
    if (data.username) {
      const existingAdmin = await prisma.admin.findUnique({
        where: { username: data.username },
      });
      
      if (existingAdmin && existingAdmin.id !== id) {
        throw new Error('Username already exists');
      }
    }

    const updateData: any = {};
    
    if (data.username) updateData.username = data.username;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return admin;
  }
}

export const adminService = new AdminService();
