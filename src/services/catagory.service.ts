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
}

// Custom error class for better error handling
class CustomError extends Error {
  status?: number;
  
  constructor(message: string, status?: number, name = 'Error') {
    super(message);
    this.status = status;
    this.name = name;
  }
}

// Extend Error interface to include status property
interface ErrorWithStatus extends Error {
  status?: number;
}

/**
 * Create a new category
 * @param {CategoryCreateData} categoryData - The category data
 * @returns {Promise<Object>} Created category object
 */
export const createCategory = async (categoryData: CategoryCreateData) => {
  try {
    const { name, slug, description, parentId } = categoryData;

    // Validate required fields
    if (!slug) {
      throw new Error('Slug is required');
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    });
    if (existingCategory) {
      const err = new Error('Category with this slug already exists') as ErrorWithStatus;
      err.name = 'BadRequestError';
      err.status = 400;
      throw err;
    }

    // If parentId is provided, validate that parent exists
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    // Create the category
    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId
      },
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
    throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get all categories with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} [filters.parentId] - Filter by parent category ID
 * @param {boolean} [filters.includeChildren=true] - Include children categories
 * @param {boolean} [filters.includeParent=true] - Include parent category info
 * @param {boolean} [filters.includeServices=false] - Include services count
 * @returns {Promise<Array>} Array of category objects
 */
interface CategoryFilters {
  parentId?: string | null;
  includeChildren?: boolean;
  includeParent?: boolean;
  includeServices?: boolean;
}

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
            description: true
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
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};

/**
 * Get category by ID
 * @param {string} id - Category ID
 * @param {Object} options - Additional options
 * @param {boolean} [options.includeChildren=true] - Include children categories
 * @param {boolean} [options.includeParent=true] - Include parent category info
 * @param {boolean} [options.includeServices=false] - Include services
 * @returns {Promise<Object|null>} Category object or null if not found
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
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
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
    throw new Error(`Failed to fetch category: ${error.message}`);
  }
};

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @param {Object} options - Additional options
 * @param {boolean} [options.includeChildren=true] - Include children categories
 * @param {boolean} [options.includeParent=true] - Include parent category info
 * @param {boolean} [options.includeServices=false] - Include services
 * @returns {Promise<Object|null>} Category object or null if not found
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
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
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
    throw new Error(`Failed to fetch category: ${error.message}`);
  }
};

/**
 * Update a category
 * @param {string} id - Category ID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.name] - Category name
 * @param {string} [updateData.slug] - Category slug
 * @param {string} [updateData.description] - Category description
 * @param {string} [updateData.parentId] - Parent category ID
 * @returns {Promise<Object>} Updated category object
 */
export const updateCategory = async (id: string, updateData: CategoryUpdateData) => {
  try {
    const { name, slug, description, parentId } = updateData;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // If slug is being updated, check if new slug already exists
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug }
      });
      if (slugExists) {
        const err = new Error('Category with this slug already exists') as ErrorWithStatus;
        err.name = 'BadRequestError';
        err.status = 400;
        throw err;
      }
    }

    // If parentId is being updated, validate that parent exists and prevent circular references
    if (parentId && parentId !== existingCategory.parentId) {
      if (parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Check for circular reference by checking if the current category is an ancestor of the new parent
      const isCircularReference = await checkCircularReference(id, parentId);
      if (isCircularReference) {
        throw new Error('Cannot create circular reference in category hierarchy');
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId })
      },
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
    throw new Error(`Failed to update category: ${error.message}`);
  }
};

/**
 * Delete a category
 * @param {string} id - Category ID
 * @param {Object} options - Delete options
 * @param {boolean} [options.force=false] - Force delete even if category has children or services
 * @returns {Promise<Object>} Deleted category object
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
      throw new Error('Category not found');
    }

    // Check if category has children or services and force is not enabled
    if (!force) {
      if (existingCategory.children.length > 0) {
        throw new Error('Cannot delete category with child categories. Use force option or delete children first.');
      }
      if (existingCategory._count.services > 0) {
        throw new Error('Cannot delete category with associated services. Use force option or remove services first.');
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
    throw new Error(`Failed to delete category: ${error.message}`);
  }
};

/**
 * Get root categories (categories with no parent)
 * @param {Object} options - Additional options
 * @param {boolean} [options.includeChildren=true] - Include children categories
 * @returns {Promise<Array>} Array of root category objects
 */
export const getRootCategories = async (options: RootCategoryOptions = {}) => {
  try {
    const { includeChildren = true } = options;

    return await getAllCategories({
      parentId: null,
      includeChildren,
      includeParent: false,
      includeServices: true
    });
  } catch (error) {
    throw new Error(`Failed to fetch root categories: ${error.message}`);
  }
};

/**
 * Get category hierarchy starting from a specific category
 * @param {string} categoryId - Starting category ID
 * @returns {Promise<Object>} Category with full hierarchy
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
    throw new Error(`Failed to fetch category hierarchy: ${error.message}`);
  }
};

/**
 * Helper function to check for circular references in category hierarchy
 * @param {string} categoryId - Current category ID
 * @param {string} newParentId - New parent category ID
 * @returns {Promise<boolean>} True if circular reference would be created
 */
const checkCircularReference = async (categoryId: string, newParentId: string): Promise<boolean> => {
  let currentParentId = newParentId;
  
  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true; // Circular reference found
    }
    
    const parent = await prisma.category.findUnique({
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
 * @param {string} searchTerm - Search term
 * @param {Object} options - Search options
 * @param {boolean} [options.includeChildren=true] - Include children categories
 * @param {boolean} [options.includeParent=true] - Include parent category info
 * @returns {Promise<Array>} Array of matching categories
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
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
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
    throw new Error(`Failed to search categories: ${error.message}`);
  }
};
