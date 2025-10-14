// @ts-nocheck - Suppress mock typing errors in Jest tests
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } from '../../src/services/category.service.js';
import { prisma } from '../../src/utils/database.js';

jest.mock('../../src/utils/database.js');

describe('Category Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const categoryData = {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
      };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.category.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...categoryData,
      });

      const result = await createCategory(categoryData);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: categoryData.slug },
      });
      expect(prisma.category.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
    });

    it('should throw error if slug already exists', async () => {
      const categoryData = {
        slug: 'existing-slug',
        name: 'Test',
      };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        slug: categoryData.slug,
      });

      await expect(createCategory(categoryData)).rejects.toThrow(
        'Category with this slug already exists'
      );
    });

    it('should throw error if slug is not provided', async () => {
      const categoryData = {
        name: 'Test',
      } as any;

      await expect(createCategory(categoryData)).rejects.toThrow('Slug is required');
    });

    it('should throw error if parent category does not exist', async () => {
      const categoryData = {
        slug: 'test',
        parentId: 'non-existent',
      };

      (prisma.category.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // For slug check
        .mockResolvedValueOnce(null); // For parent check

      await expect(createCategory(categoryData)).rejects.toThrow('Parent category not found');
    });
  });

  describe('getAllCategories', () => {
    it('should get all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', slug: 'category-1' },
        { id: '2', name: 'Category 2', slug: 'category-2' },
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await getAllCategories({});

      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it('should filter by parentId', async () => {
      const filters = { parentId: 'parent-id' };
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      await getAllCategories(filters);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { parentId: 'parent-id' },
        })
      );
    });

    it('should include children when specified', async () => {
      const filters = { includeChildren: true };
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      await getAllCategories(filters);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            children: expect.anything(),
          }),
        })
      );
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID', async () => {
      const mockCategory = {
        id: 'category-id',
        name: 'Test Category',
        slug: 'test-category',
      };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await getCategoryById('category-id', {});

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'category-id' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getCategoryById('non-existent', {});

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const mockUpdatedCategory = {
        id: 'category-id',
        ...updateData,
      };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'category-id',
      });
      (prisma.category.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      const result = await updateCategory('category-id', updateData);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'category-id' },
        data: updateData,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should throw error if category not found', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(updateCategory('non-existent', {})).rejects.toThrow('Category not found');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'category-id',
        children: [],
        _count: { services: 0 },
      });
      (prisma.category.delete as jest.Mock).mockResolvedValue({ id: 'category-id' });

      await deleteCategory('category-id', {});

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'category-id' },
      });
    });

    it('should throw error if category has children and force is not set', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: 'category-id',
        children: [{ id: 'child-1' }, { id: 'child-2' }],
        _count: { services: 0 },
      });

      await expect(deleteCategory('category-id', {})).rejects.toThrow(
        'Cannot delete category with child categories'
      );
    });

    it('should throw error if category not found', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deleteCategory('non-existent', {})).rejects.toThrow('Category not found');
    });
  });
});
