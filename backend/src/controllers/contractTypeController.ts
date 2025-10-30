import { Request, Response } from 'express'
import { prisma } from '../index'
import { z } from 'zod'

// Validation schemas
const createContractTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false)
})

const updateContractTypeSchema = createContractTypeSchema.partial()

export const contractTypeController = {
  // Get all contract types
  async getContractTypes(req: Request, res: Response) {
    try {
      const { isActive } = req.query

      const where: any = {}
      if (isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      const contractTypes = await prisma.contractTypeManagement.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' }, // Default types first
          { name: 'asc' }
        ]
      })

      res.json({ contractTypes })
    } catch (error) {
      console.error('Error fetching contract types:', error)
      res.status(500).json({ error: 'Failed to fetch contract types' })
    }
  },

  // Get single contract type
  async getContractTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const contractType = await prisma.contractTypeManagement.findUnique({
        where: { id }
      })

      if (!contractType) {
        return res.status(404).json({ error: 'Contract type not found' })
      }

      res.json({ contractType })
    } catch (error) {
      console.error('Error fetching contract type:', error)
      res.status(500).json({ error: 'Failed to fetch contract type' })
    }
  },

  // Create new contract type
  async createContractType(req: Request, res: Response) {
    try {
      const validatedData = createContractTypeSchema.parse(req.body)

      // Check if name already exists
      const existingType = await prisma.contractTypeManagement.findUnique({
        where: { name: validatedData.name }
      })

      if (existingType) {
        return res.status(400).json({ error: 'Contract type with this name already exists' })
      }

      // If setting as default, unset other defaults
      if (validatedData.isDefault) {
        await prisma.contractTypeManagement.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        })
      }

      const contractType = await prisma.contractTypeManagement.create({
        data: validatedData
      })

      res.status(201).json({ contractType })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error creating contract type:', error)
      res.status(500).json({ error: 'Failed to create contract type' })
    }
  },

  // Update contract type
  async updateContractType(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validatedData = updateContractTypeSchema.parse(req.body)

      // Check if contract type exists
      const existingType = await prisma.contractTypeManagement.findUnique({
        where: { id }
      })

      if (!existingType) {
        return res.status(404).json({ error: 'Contract type not found' })
      }

      // Check if name already exists (if updating name)
      if (validatedData.name && validatedData.name !== existingType.name) {
        const nameExists = await prisma.contractTypeManagement.findUnique({
          where: { name: validatedData.name }
        })

        if (nameExists) {
          return res.status(400).json({ error: 'Contract type with this name already exists' })
        }
      }

      // If setting as default, unset other defaults
      if (validatedData.isDefault && !existingType.isDefault) {
        await prisma.contractTypeManagement.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        })
      }

      const contractType = await prisma.contractTypeManagement.update({
        where: { id },
        data: validatedData
      })

      res.json({ contractType })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error updating contract type:', error)
      res.status(500).json({ error: 'Failed to update contract type' })
    }
  },

  // Delete contract type
  async deleteContractType(req: Request, res: Response) {
    try {
      const { id } = req.params

      // Check if contract type exists
      const existingType = await prisma.contractTypeManagement.findUnique({
        where: { id }
      })

      if (!existingType) {
        return res.status(404).json({ error: 'Contract type not found' })
      }

      // Check if it's the default type
      if (existingType.isDefault) {
        return res.status(400).json({ 
          error: 'Cannot delete the default contract type. Set another type as default first.' 
        })
      }

      // Instead of hard delete, soft delete (deactivate)
      const contractType = await prisma.contractTypeManagement.update({
        where: { id },
        data: { isActive: false }
      })

      res.json({ 
        message: 'Contract type deactivated successfully',
        contractType 
      })
    } catch (error) {
      console.error('Error deleting contract type:', error)
      res.status(500).json({ error: 'Failed to delete contract type' })
    }
  },

  // Activate contract type
  async activateContractType(req: Request, res: Response) {
    try {
      const { id } = req.params

      const contractType = await prisma.contractTypeManagement.update({
        where: { id },
        data: { isActive: true }
      })

      res.json({ contractType })
    } catch (error) {
      console.error('Error activating contract type:', error)
      res.status(500).json({ error: 'Failed to activate contract type' })
    }
  },

  // Set default contract type
  async setDefaultContractType(req: Request, res: Response) {
    try {
      const { id } = req.params

      // Check if contract type exists and is active
      const existingType = await prisma.contractTypeManagement.findUnique({
        where: { id }
      })

      if (!existingType) {
        return res.status(404).json({ error: 'Contract type not found' })
      }

      if (!existingType.isActive) {
        return res.status(400).json({ error: 'Cannot set inactive contract type as default' })
      }

      // Unset all other defaults
      await prisma.contractTypeManagement.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })

      // Set new default
      const contractType = await prisma.contractTypeManagement.update({
        where: { id },
        data: { isDefault: true }
      })

      res.json({ contractType })
    } catch (error) {
      console.error('Error setting default contract type:', error)
      res.status(500).json({ error: 'Failed to set default contract type' })
    }
  }
}