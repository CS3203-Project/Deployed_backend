import { prisma } from '../../utils/database.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
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

  async getAllServiceProvidersWithDetails() {
    const serviceProviders = await prisma.serviceProvider.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            imageUrl: true,
            location: true,
            address: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            socialmedia: true,
          },
        },
        companies: true,
        services: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            services: true,
            schedules: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serviceProviders;
  }

  async updateServiceProviderVerification(providerId: string, isVerified: boolean): Promise<any> {
    // First check if the service provider exists
    const existingProvider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingProvider) {
      throw new Error('Service provider not found');
    }

    // Update the verification status
    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isVerified },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            imageUrl: true,
            location: true,
            address: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            socialmedia: true,
          },
        },
        companies: true,
        services: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            services: true,
            schedules: true,
            payments: true,
          },
        },
      },
    });

    return updatedProvider;
  }

  async getCustomerCount(): Promise<number> {
    const customerCount = await prisma.user.count({
      where: {
        role: 'USER',
        
      },
    });

    return customerCount;
  }

  async getAllCustomers() {
    const customers = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        imageUrl: true,
        location: true,
        address: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        socialmedia: true,
        _count: {
          select: {
            payments: true,
            schedules: true,
            customerReviewsWritten: true,
            customerReviewsReceived: true,
            writtenServiceReviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return customers;
  }

  async getAllServicesWithCategories() {
    const services = await prisma.service.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                location: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            schedules: true,
            payments: true,
            serviceReviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return services;
  }

  // Payment Analytics Methods
  async getPaymentStatistics(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    totalPlatformFees: number;
    totalProviderEarnings: number;
  }> {
    const payments = await prisma.payment.findMany({
      select: {
        amount: true,
        platformFee: true,
        providerAmount: true,
        status: true,
      },
    });

    const totalTransactions = payments.length;
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalPlatformFees = payments.reduce((sum, payment) => sum + Number(payment.platformFee || 0), 0);
    const totalProviderEarnings = payments.reduce((sum, payment) => sum + Number(payment.providerAmount || 0), 0);
    
    const successfulTransactions = payments.filter(p => p.status === 'SUCCEEDED').length;
    const failedTransactions = payments.filter(p => p.status === 'FAILED').length;
    const pendingTransactions = payments.filter(p => p.status === 'PENDING').length;
    
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      totalPlatformFees,
      totalProviderEarnings,
    };
  }

  async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<{
    date: string;
    revenue: number;
    transactions: number;
  }[]> {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SUCCEEDED',
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const revenueByDate = new Map<string, { revenue: number; transactions: number }>();
    
    payments.forEach(payment => {
      const dateStr = payment.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (dateStr) {
        const existing = revenueByDate.get(dateStr) || { revenue: 0, transactions: 0 };
        existing.revenue += Number(payment.amount);
        existing.transactions += 1;
        revenueByDate.set(dateStr, existing);
      }
    });

    return Array.from(revenueByDate.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.transactions,
    }));
  }

  async getTopProvidersByRevenue(limit: number = 10): Promise<{
    providerId: string;
    providerName: string;
    totalRevenue: number;
    totalTransactions: number;
  }[]> {
    const providerRevenue = await prisma.payment.groupBy({
      by: ['providerId'],
      where: {
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: limit,
    });

    // Get provider details
    const providerIds = providerRevenue.map(p => p.providerId);
    const providers = await prisma.serviceProvider.findMany({
      where: {
        id: {
          in: providerIds,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return providerRevenue.map(revenue => {
      const provider = providers.find(p => p.id === revenue.providerId);
      return {
        providerId: revenue.providerId,
        providerName: provider ? `${provider.user.firstName} ${provider.user.lastName}` : 'Unknown Provider',
        totalRevenue: Number(revenue._sum.amount || 0),
        totalTransactions: revenue._count.id,
      };
    });
  }

  async getPaymentStatusDistribution(): Promise<{
    status: string;
    count: number;
    percentage: number;
  }[]> {
    const statusCounts = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalPayments = statusCounts.reduce((sum, status) => sum + status._count.id, 0);

    return statusCounts.map(status => ({
      status: status.status,
      count: status._count.id,
      percentage: totalPayments > 0 ? (status._count.id / totalPayments) * 100 : 0,
    }));
  }

  async getRecentPayments(limit: number = 20): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    serviceName: string;
    providerName: string;
    customerName: string;
    createdAt: Date;
  }[]> {
    const payments = await prisma.payment.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        service: {
          select: {
            title: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      serviceName: payment.service?.title || 'Unknown Service',
      providerName: payment.provider?.user ? `${payment.provider.user.firstName} ${payment.provider.user.lastName}` : 'Unknown Provider',
      customerName: payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : 'Unknown Customer',
      createdAt: payment.createdAt,
    }));
  }

  async getMonthlyRevenueComparison(): Promise<{
    currentMonth: number;
    previousMonth: number;
    growthPercentage: number;
  }> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: currentMonthStart,
          },
          status: 'SUCCEEDED',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
          status: 'SUCCEEDED',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const currentMonth = Number(currentMonthRevenue._sum.amount || 0);
    const previousMonth = Number(previousMonthRevenue._sum.amount || 0);
    
    const growthPercentage = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    return {
      currentMonth,
      previousMonth,
      growthPercentage,
    };
  }
}

export const adminService = new AdminService();
