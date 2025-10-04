import { prisma } from '../utils/database.js';

// Type definitions
interface CategoryCreateData {
  name?: string;
  slug: string;
  description?: string;
  parentId?: string;
}

interface CategoryUpdateData {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

interface CategoryFilters {
  parentId?: string | null;
  includeChildren?: boolean;
  includeParent?: boolean;
  includeServices?: boolean;
}

interface CategoryOptions {
  includeChildren?: boolean;
  includeParent?: boolean;
  includeServices?: boolean;
}

interface DeleteOptions {
  force?: boolean;
}

interface SearchOptions {
  includeChildren?: boolean;
  includeParent?: boolean;
}

interface RootCategoryOptions {
  includeChildren?: boolean;
  includeServices?: boolean;
}

// Custom error class for better error handling
class CategoryError extends Error {
  status: number | undefined;
  
  constructor(message: string, status?: number, name = 'CategoryError') {
    super(message);
    if (status !== undefined) {
      this.status = status;
    }
    this.name = name;
  }
}

/**
 * Create a new category
 * @param categoryData - The category data
 * @returns Created category object
 */
export const createCategory = async (categoryData: CategoryCreateData) => {
  try {
    const { name, slug, description, parentId } = categoryData;

    // Validate required fields
    if (!slug) {
      throw new CategoryError('Slug is required', 400);
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });
    if (existingCategory) {
      throw new CategoryError('Category with this slug already exists', 400);
    }

    // If parentId is provided, validate that parent exists
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });
      if (!parentCategory) {
        throw new CategoryError('Parent category not found', 404);
      }
    }

    // Create data object with only defined properties
    const createData: any = { slug };
    if (name !== undefined) createData.name = name;
    if (description !== undefined) createData.description = description;
    if (parentId !== undefined) createData.parentId = parentId;

    // Create the category
    const newCategory = await prisma.category.create({
      data: createData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    return newCategory;
  } catch (error) {
    if (error instanceof CategoryError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to create category: ${errorMessage}`);
  }
};

/**
 * Get all categories with optional filtering
 * @param filters - Optional filters
 * @returns Array of category objects
 */
export const getAllCategories = async (filters: CategoryFilters = {}) => {
  try {
    const { 
      parentId, 
      includeChildren = true, 
      includeParent = true, 
      includeServices = false 
    } = filters;

    const whereClause: any = {};
    if (parentId !== undefined) {
      whereClause.parentId = parentId;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parent: includeParent ? {
          select: {
            id: true,
            name: true,
            slug: true
          }
        } : false,
        children: includeChildren ? {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            _count: {
              select: {
                services: true
              }
            }
          }
        } : false,
        _count: includeServices ? {
          select: {
            services: true
          }
        } : false
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to fetch categories: ${errorMessage}`);
  }
};

/**
 * Get category by ID
 * @param id - Category ID
 * @param options - Additional options
 * @returns Category object or null if not found
 */
export const getCategoryById = async (id: string, options: CategoryOptions = {}) => {
  try {
    const { 
      includeChildren = true, 
      includeParent = true, 
      includeServices = false 
    } = options;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: includeParent ? {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        } : false,
        children: includeChildren ? {
          include: {
            _count: {
              select: {
                services: true
              }
            }
          }
        } : false,
        services: includeServices ? {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            isActive: true
          }
        } : false,
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    return category;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to fetch category: ${errorMessage}`);
  }
};

/**
 * Get category by slug
 * @param slug - Category slug
 * @param options - Additional options
 * @returns Category object or null if not found
 */
export const getCategoryBySlug = async (slug: string, options: CategoryOptions = {}) => {
  try {
    const { 
      includeChildren = true, 
      includeParent = true, 
      includeServices = false 
    } = options;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: includeParent ? {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        } : false,
        children: includeChildren ? {
          include: {
            _count: {
              select: {
                services: true
              }
            }
          }
        } : false,
        services: includeServices ? {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            isActive: true
          }
        } : false,
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    return category;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to fetch category: ${errorMessage}`);
  }
};

/**
 * Update a category
 * @param id - Category ID
 * @param updateData - Data to update
 * @returns Updated category object
 */
export const updateCategory = async (id: string, updateData: CategoryUpdateData) => {
  try {
    const { name, slug, description, parentId } = updateData;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });
    if (!existingCategory) {
      throw new CategoryError('Category not found', 404);
    }

    // If slug is being updated, check if new slug already exists
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug }
      });
      if (slugExists) {
        throw new CategoryError('Category with this slug already exists', 400);
      }
    }

    // If parentId is being updated, validate that parent exists and prevent circular references
    if (parentId && parentId !== existingCategory.parentId) {
      if (parentId === id) {
        throw new CategoryError('Category cannot be its own parent', 400);
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });
      if (!parentCategory) {
        throw new CategoryError('Parent category not found', 404);
      }

      // Check for circular reference by checking if the current category is an ancestor of the new parent
      const isCircularReference = await checkCircularReference(id, parentId);
      if (isCircularReference) {
        throw new CategoryError('Cannot create circular reference in category hierarchy', 400);
      }
    }

    // Create update data object with only defined properties
    const updateDataObj: any = {};
    if (name !== undefined) updateDataObj.name = name;
    if (slug !== undefined) updateDataObj.slug = slug;
    if (description !== undefined) updateDataObj.description = description;
    if (parentId !== undefined) updateDataObj.parentId = parentId;

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateDataObj,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    return updatedCategory;
  } catch (error) {
    if (error instanceof CategoryError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to update category: ${errorMessage}`);
  }
};

/**
 * Delete a category
 * @param id - Category ID
 * @param options - Delete options
 * @returns Deleted category object
 */
export const deleteCategory = async (id: string, options: DeleteOptions = {}) => {
  try {
    const { force = false } = options;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    if (!existingCategory) {
      throw new CategoryError('Category not found', 404);
    }

    // Check if category has children or services and force is not enabled
    if (!force) {
      if (existingCategory.children.length > 0) {
        throw new CategoryError('Cannot delete category with child categories. Use force option or delete children first.', 400);
      }
      if (existingCategory._count.services > 0) {
        throw new CategoryError('Cannot delete category with associated services. Use force option or remove services first.', 400);
      }
    }

    // If force delete, handle children and services
    if (force) {
      // Set children's parentId to null (make them root categories)
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { parentId: null }
      });

      // Note: Services will be orphaned but not deleted
      // You might want to handle this differently based on business requirements
    }

    // Delete the category
    const deletedCategory = await prisma.category.delete({
      where: { id }
    });

    return deletedCategory;
  } catch (error) {
    if (error instanceof CategoryError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to delete category: ${errorMessage}`);
  }
};

/**
 * Get root categories (categories with no parent)
 * @param options - Additional options
 * @returns Array of root category objects
 */
export const getRootCategories = async (options: RootCategoryOptions = {}) => {
  try {
    const { includeChildren = true, includeServices = true } = options;

    return await getAllCategories({
      parentId: null,
      includeChildren,
      includeParent: false,
      includeServices
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to fetch root categories: ${errorMessage}`);
  }
};

/**
 * Get category hierarchy starting from a specific category
 * @param categoryId - Starting category ID
 * @returns Category with full hierarchy
 */
export const getCategoryHierarchy = async (categoryId: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          include: {
            parent: {
              include: {
                parent: true // Up to 3 levels up
              }
            }
          }
        },
        children: {
          include: {
            children: {
              include: {
                children: true // Up to 3 levels down
              }
            }
          }
        }
      }
    });

    return category;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to fetch category hierarchy: ${errorMessage}`);
  }
};

/**
 * Helper function to check for circular references in category hierarchy
 * @param categoryId - Current category ID
 * @param newParentId - New parent category ID
 * @returns True if circular reference would be created
 */
const checkCircularReference = async (categoryId: string, newParentId: string): Promise<boolean> => {
  let currentParentId: string | null = newParentId;
  
  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true; // Circular reference found
    }
    
    const parent: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true }
    });
    
    if (!parent) break;
    currentParentId = parent.parentId;
  }
  
  return false;
};

/**
 * Search categories by name or description
 * @param searchTerm - Search term
 * @param options - Search options
 * @returns Array of matching categories
 */
export const searchCategories = async (searchTerm: string, options: SearchOptions = {}) => {
  try {
    const { includeChildren = true, includeParent = true } = options;

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        parent: includeParent ? {
          select: {
            id: true,
            name: true,
            slug: true
          }
        } : false,
        children: includeChildren ? {
          include: {
            _count: {
              select: {
                services: true
              }
            }
          }
        } : false,
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new CategoryError(`Failed to search categories: ${errorMessage}`);
  }
};
