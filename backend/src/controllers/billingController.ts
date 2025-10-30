import { Request, Response } from 'express'
import { prisma } from '../index'
import { z } from 'zod'
import { billingService } from '../services/billingService'

// Validation schemas
const createBillingGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  billingType: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM']).default('SEMI_ANNUAL'),
  periodStart: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  periodEnd: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  maxAssets: z.number().int().positive().optional(),
  isActive: z.boolean().default(true)
})

const updateBillingGroupSchema = createBillingGroupSchema.partial()

const assignAssetToBillingGroupSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  billingGroupId: z.string().uuid('Invalid billing group ID'),
  effectiveFrom: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  effectiveTo: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  notes: z.string().optional()
})

const createInvoiceRecordSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  billingGroupId: z.string().uuid('Invalid billing group ID'),
  vendor: z.string().default('Juniper Networks'),
  invoiceDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().default('NOK'),
  status: z.enum(['DRAFT', 'PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  notes: z.string().optional(),
  attachmentUrl: z.string().url().optional()
})

const updateInvoiceRecordSchema = createInvoiceRecordSchema.partial()

export const billingController = {
  // Billing Groups
  async getBillingGroups(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, isActive } = req.query

      const where: any = {}
      if (isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      const billingGroups = await prisma.billingGroup.findMany({
        where,
        include: {
          _count: {
            select: {
              assetMappings: {
                where: { isActive: true }
              },
              invoiceRecords: true
            }
          },
          assetMappings: {
            where: { isActive: true },
            include: {
              asset: {
                include: {
                  contracts: {
                    where: { status: 'active' },
                    include: {
                      contract: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      })

      const total = await prisma.billingGroup.count({ where })

      // Calculate totals for each billing group
      const billingGroupsWithTotals = billingGroups.map(group => {
        let totalAnnualCost = 0
        let totalAssetValue = 0

        // Calculate costs from assigned assets
        group.assetMappings?.forEach(mapping => {
          // Add contract costs
          const contractCosts = mapping.asset.contracts.reduce((sum, contractMapping) => {
            return sum + (Number(contractMapping.contract.annualCost) || 0)
          }, 0)
          totalAnnualCost += contractCosts

          // Add asset purchase price
          totalAssetValue += Number(mapping.asset.purchasePrice) || 0
        })

        // Calculate billing period portion based on billing type
        let periodMultiplier = 1
        switch (group.billingType) {
          case 'SEMI_ANNUAL':
            periodMultiplier = 0.5 // Half year
            break
          case 'QUARTERLY':
            periodMultiplier = 0.25 // Quarter year
            break
          case 'MONTHLY':
            periodMultiplier = 1/12 // Month
            break
          case 'ANNUAL':
            periodMultiplier = 1 // Full year
            break
          case 'CUSTOM':
            // Calculate based on actual period length
            const start = new Date(group.periodStart)
            const end = new Date(group.periodEnd)
            const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            periodMultiplier = days / 365
            break
        }

        const periodCost = totalAnnualCost * periodMultiplier

        return {
          ...group,
          totals: {
            totalAnnualCost,
            totalAssetValue,
            periodCost,
            periodMultiplier
          }
        }
      })

      res.json({
        billingGroups: billingGroupsWithTotals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      console.error('Error fetching billing groups:', error)
      res.status(500).json({ error: 'Failed to fetch billing groups' })
    }
  },

  async getBillingGroupById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const billingGroup = await prisma.billingGroup.findUnique({
        where: { id },
        include: {
          assetMappings: {
            where: { isActive: true },
            include: {
              asset: {
                include: {
                  model: true
                }
              }
            }
          },
          invoiceRecords: {
            orderBy: { invoiceDate: 'desc' }
          },
          _count: {
            select: {
              assetMappings: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      if (!billingGroup) {
        return res.status(404).json({ error: 'Billing group not found' })
      }

      res.json({ billingGroup })
    } catch (error) {
      console.error('Error fetching billing group:', error)
      res.status(500).json({ error: 'Failed to fetch billing group' })
    }
  },

  async createBillingGroup(req: Request, res: Response) {
    try {
      const validatedData = createBillingGroupSchema.parse(req.body)

      // Check if name already exists
      const existingGroup = await prisma.billingGroup.findUnique({
        where: { name: validatedData.name }
      })

      if (existingGroup) {
        return res.status(400).json({ error: 'Billing group with this name already exists' })
      }

      const billingGroup = await prisma.billingGroup.create({
        data: {
          ...validatedData,
          periodStart: new Date(validatedData.periodStart),
          periodEnd: new Date(validatedData.periodEnd)
        },
        include: {
          _count: {
            select: {
              assetMappings: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      res.status(201).json({ billingGroup })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error creating billing group:', error)
      res.status(500).json({ error: 'Failed to create billing group' })
    }
  },

  async updateBillingGroup(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validatedData = updateBillingGroupSchema.parse(req.body)

      // Check if billing group exists
      const existingGroup = await prisma.billingGroup.findUnique({
        where: { id }
      })

      if (!existingGroup) {
        return res.status(404).json({ error: 'Billing group not found' })
      }

      // Check if name already exists (if updating name)
      if (validatedData.name && validatedData.name !== existingGroup.name) {
        const nameExists = await prisma.billingGroup.findUnique({
          where: { name: validatedData.name }
        })

        if (nameExists) {
          return res.status(400).json({ error: 'Billing group with this name already exists' })
        }
      }

      const updateData: any = { ...validatedData }
      if (validatedData.periodStart) {
        updateData.periodStart = new Date(validatedData.periodStart)
      }
      if (validatedData.periodEnd) {
        updateData.periodEnd = new Date(validatedData.periodEnd)
      }

      const billingGroup = await prisma.billingGroup.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              assetMappings: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      res.json({ billingGroup })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error updating billing group:', error)
      res.status(500).json({ error: 'Failed to update billing group' })
    }
  },

  async deleteBillingGroup(req: Request, res: Response) {
    try {
      const { id } = req.params

      // Check if billing group exists and has active mappings
      const billingGroup = await prisma.billingGroup.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              assetMappings: {
                where: { isActive: true }
              },
              invoiceRecords: true
            }
          }
        }
      })

      if (!billingGroup) {
        return res.status(404).json({ error: 'Billing group not found' })
      }

      if (billingGroup._count.assetMappings > 0) {
        return res.status(400).json({
          error: 'Cannot delete billing group with active asset mappings. Remove all assets first.'
        })
      }

      if (billingGroup._count.invoiceRecords > 0) {
        return res.status(400).json({
          error: 'Cannot delete billing group with invoice records. Archive the group instead.'
        })
      }

      await prisma.billingGroup.delete({
        where: { id }
      })

      res.json({ message: 'Billing group deleted successfully' })
    } catch (error) {
      console.error('Error deleting billing group:', error)
      res.status(500).json({ error: 'Failed to delete billing group' })
    }
  },

  // Asset Billing Mappings
  async assignAssetToBillingGroup(req: Request, res: Response) {
    try {
      const validatedData = assignAssetToBillingGroupSchema.parse(req.body)

      // Check if asset and billing group exist
      const [asset, billingGroup] = await Promise.all([
        prisma.hardwareAsset.findUnique({ where: { id: validatedData.assetId } }),
        prisma.billingGroup.findUnique({ where: { id: validatedData.billingGroupId } })
      ])

      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' })
      }

      if (!billingGroup) {
        return res.status(404).json({ error: 'Billing group not found' })
      }

      // Check if asset is already assigned to an active billing group
      const existingMapping = await prisma.assetBillingMapping.findFirst({
        where: {
          assetId: validatedData.assetId,
          isActive: true
        }
      })

      if (existingMapping) {
        return res.status(400).json({
          error: 'Asset is already assigned to an active billing group. Remove current assignment first.'
        })
      }

      // Check billing group capacity
      if (billingGroup.maxAssets) {
        const currentCount = await prisma.assetBillingMapping.count({
          where: {
            billingGroupId: validatedData.billingGroupId,
            isActive: true
          }
        })

        if (currentCount >= billingGroup.maxAssets) {
          return res.status(400).json({
            error: `Billing group has reached maximum capacity of ${billingGroup.maxAssets} assets`
          })
        }
      }

      const mapping = await prisma.assetBillingMapping.create({
        data: {
          assetId: validatedData.assetId,
          billingGroupId: validatedData.billingGroupId,
          effectiveFrom: validatedData.effectiveFrom ? new Date(validatedData.effectiveFrom) : new Date(),
          effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : undefined,
          notes: validatedData.notes
        },
        include: {
          asset: {
            include: {
              model: true
            }
          },
          billingGroup: true
        }
      })

      res.status(201).json({ mapping })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error assigning asset to billing group:', error)
      res.status(500).json({ error: 'Failed to assign asset to billing group' })
    }
  },

  async removeAssetFromBillingGroup(req: Request, res: Response) {
    try {
      const { assetId, billingGroupId } = req.params

      const mapping = await prisma.assetBillingMapping.findFirst({
        where: {
          assetId,
          billingGroupId,
          isActive: true
        }
      })

      if (!mapping) {
        return res.status(404).json({ error: 'Asset billing mapping not found' })
      }

      await prisma.assetBillingMapping.update({
        where: { id: mapping.id },
        data: {
          isActive: false,
          effectiveTo: new Date()
        }
      })

      res.json({ message: 'Asset removed from billing group successfully' })
    } catch (error) {
      console.error('Error removing asset from billing group:', error)
      res.status(500).json({ error: 'Failed to remove asset from billing group' })
    }
  },

  // Invoice Records
  async getInvoiceRecords(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, billingGroupId, status } = req.query

      const where: any = {}
      if (billingGroupId) {
        where.billingGroupId = billingGroupId as string
      }
      if (status) {
        where.status = status as string
      }

      const invoiceRecords = await prisma.invoiceRecord.findMany({
        where,
        include: {
          billingGroup: true,
          lineItems: {
            include: {
              asset: {
                include: {
                  model: true
                }
              },
              contract: true
            }
          },
          _count: {
            select: {
              lineItems: true
            }
          }
        },
        orderBy: { invoiceDate: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      })

      const total = await prisma.invoiceRecord.count({ where })

      res.json({
        invoiceRecords,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      console.error('Error fetching invoice records:', error)
      res.status(500).json({ error: 'Failed to fetch invoice records' })
    }
  },

  async createInvoiceRecord(req: Request, res: Response) {
    try {
      const validatedData = createInvoiceRecordSchema.parse(req.body)

      // Check if invoice number already exists
      const existingInvoice = await prisma.invoiceRecord.findUnique({
        where: { invoiceNumber: validatedData.invoiceNumber }
      })

      if (existingInvoice) {
        return res.status(400).json({ error: 'Invoice number already exists' })
      }

      // Check if billing group exists
      const billingGroup = await prisma.billingGroup.findUnique({
        where: { id: validatedData.billingGroupId }
      })

      if (!billingGroup) {
        return res.status(404).json({ error: 'Billing group not found' })
      }

      const invoiceRecord = await prisma.invoiceRecord.create({
        data: {
          ...validatedData,
          invoiceDate: new Date(validatedData.invoiceDate),
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined
        },
        include: {
          billingGroup: true,
          lineItems: true
        }
      })

      res.status(201).json({ invoiceRecord })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error creating invoice record:', error)
      res.status(500).json({ error: 'Failed to create invoice record' })
    }
  },

  async updateInvoiceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validatedData = updateInvoiceRecordSchema.parse(req.body)

      const existingInvoice = await prisma.invoiceRecord.findUnique({
        where: { id }
      })

      if (!existingInvoice) {
        return res.status(404).json({ error: 'Invoice record not found' })
      }

      // Check if invoice number already exists (if updating)
      if (validatedData.invoiceNumber && validatedData.invoiceNumber !== existingInvoice.invoiceNumber) {
        const numberExists = await prisma.invoiceRecord.findUnique({
          where: { invoiceNumber: validatedData.invoiceNumber }
        })

        if (numberExists) {
          return res.status(400).json({ error: 'Invoice number already exists' })
        }
      }

      const updateData: any = { ...validatedData }
      if (validatedData.invoiceDate) {
        updateData.invoiceDate = new Date(validatedData.invoiceDate)
      }
      if (validatedData.dueDate) {
        updateData.dueDate = new Date(validatedData.dueDate)
      }

      const invoiceRecord = await prisma.invoiceRecord.update({
        where: { id },
        data: updateData,
        include: {
          billingGroup: true,
          lineItems: true
        }
      })

      res.json({ invoiceRecord })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Error updating invoice record:', error)
      res.status(500).json({ error: 'Failed to update invoice record' })
    }
  },

  // Utility endpoints
  async getUnassignedAssets(req: Request, res: Response) {
    try {
      const unassignedAssets = await billingService.getUnassignedAssets()

      res.json({ 
        unassignedAssets,
        count: unassignedAssets.length
      })
    } catch (error) {
      console.error('Error fetching unassigned assets:', error)
      res.status(500).json({ error: 'Failed to fetch unassigned assets' })
    }
  },

  async getInvoiceForecast(req: Request, res: Response) {
    try {
      const { year = new Date().getFullYear() } = req.query
      
      const forecast = await billingService.generateInvoiceForecast(Number(year))
      
      res.json({ forecast })
    } catch (error) {
      console.error('Error generating invoice forecast:', error)
      res.status(500).json({ error: 'Failed to generate invoice forecast' })
    }
  },

  async balanceBillingGroups(req: Request, res: Response) {
    try {
      const { billingGroupIds, threshold = 10 } = req.body

      if (!billingGroupIds || !Array.isArray(billingGroupIds) || billingGroupIds.length < 2) {
        return res.status(400).json({ 
          error: 'Must provide at least 2 billing group IDs to balance' 
        })
      }

      await billingService.balanceBillingGroups(billingGroupIds, Number(threshold))
      
      res.json({ message: 'Billing groups balanced successfully' })
    } catch (error) {
      console.error('Error balancing billing groups:', error)
      res.status(500).json({ error: 'Failed to balance billing groups' })
    }
  },

  // Billing Analytics
  async getBillingAnalytics(req: Request, res: Response) {
    try {
      const { year = new Date().getFullYear() } = req.query

      // Get billing groups summary
      const billingGroupsStats = await prisma.billingGroup.aggregate({
        _count: { id: true },
        where: { isActive: true }
      })

      // Get asset distribution across billing groups
      const assetDistribution = await prisma.assetBillingMapping.groupBy({
        by: ['billingGroupId'],
        where: { isActive: true },
        _count: { assetId: true }
      })

      // Get invoice analytics for the year
      const invoiceStats = await prisma.invoiceRecord.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        where: {
          invoiceDate: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`)
          }
        }
      })

      // Get unassigned assets count
      const totalAssets = await prisma.hardwareAsset.count({
        where: { status: 'ACTIVE' }
      })

      const assignedAssets = await prisma.assetBillingMapping.count({
        where: { isActive: true }
      })

      const unassignedAssets = totalAssets - assignedAssets

      res.json({
        analytics: {
          billingGroups: {
            total: billingGroupsStats._count.id,
            active: billingGroupsStats._count.id
          },
          assets: {
            total: totalAssets,
            assigned: assignedAssets,
            unassigned: unassignedAssets
          },
          invoices: {
            count: invoiceStats._count.id || 0,
            totalAmount: invoiceStats._sum.totalAmount || 0
          },
          distribution: assetDistribution
        }
      })
    } catch (error) {
      console.error('Error fetching billing analytics:', error)
      res.status(500).json({ error: 'Failed to fetch billing analytics' })
    }
  }
}