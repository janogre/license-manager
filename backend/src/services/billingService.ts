import { prisma } from '../index'
import type { BillingType } from '@prisma/client'

export interface AutoAssignmentConfig {
  billingType: BillingType
  balanceThreshold: number // Percentage (e.g., 10 = 10%)
  preferredGroupPattern?: string // e.g., "H1-{year}", "H2-{year}"
}

export const billingService = {
  /**
   * Auto-assign new asset to appropriate billing group based on configured strategy
   */
  async autoAssignAsset(assetId: string, config?: AutoAssignmentConfig): Promise<void> {
    try {
      // Get the asset to ensure it exists
      const asset = await prisma.hardwareAsset.findUnique({
        where: { id: assetId }
      })

      if (!asset) {
        throw new Error('Asset not found')
      }

      // Check if asset is already assigned to an active billing group
      const existingMapping = await prisma.assetBillingMapping.findFirst({
        where: {
          assetId,
          isActive: true
        }
      })

      if (existingMapping) {
        console.log(`Asset ${assetId} is already assigned to a billing group`)
        return
      }

      // Get default billing cycle configuration if not provided
      const defaultConfig = config || await this.getDefaultBillingConfig()

      // Find active billing groups for the current year
      const currentYear = new Date().getFullYear()
      const activeBillingGroups = await prisma.billingGroup.findMany({
        where: {
          isActive: true,
          billingType: defaultConfig.billingType,
          periodStart: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`)
          }
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

      if (activeBillingGroups.length === 0) {
        // Create billing groups for the current year if none exist
        await this.createDefaultBillingGroups(currentYear, defaultConfig.billingType)
        
        // Retry getting billing groups
        const newGroups = await prisma.billingGroup.findMany({
          where: {
            isActive: true,
            billingType: defaultConfig.billingType,
            periodStart: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`)
            }
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
        
        if (newGroups.length > 0) {
          activeBillingGroups.push(...newGroups)
        }
      }

      // Find the billing group with the least assets (load balancing)
      const targetGroup = activeBillingGroups.reduce((minGroup, currentGroup) => {
        // Check capacity constraints
        if (currentGroup.maxAssets && currentGroup._count.assetMappings >= currentGroup.maxAssets) {
          return minGroup
        }

        return !minGroup || currentGroup._count.assetMappings < minGroup._count.assetMappings
          ? currentGroup
          : minGroup
      }, null as typeof activeBillingGroups[0] | null)

      if (!targetGroup) {
        throw new Error('No available billing group found for asset assignment')
      }

      // Assign the asset to the selected billing group
      await prisma.assetBillingMapping.create({
        data: {
          assetId,
          billingGroupId: targetGroup.id,
          assignedBy: 'system-auto-assignment',
          notes: `Auto-assigned on ${new Date().toISOString()} using load balancing strategy`
        }
      })

      console.log(`Asset ${assetId} auto-assigned to billing group ${targetGroup.name}`)
    } catch (error) {
      console.error('Error in auto-assignment:', error)
      throw error
    }
  },

  /**
   * Get default billing configuration
   */
  async getDefaultBillingConfig(): Promise<AutoAssignmentConfig> {
    const defaultCycle = await prisma.billingCycle.findFirst({
      where: { isDefault: true }
    })

    return {
      billingType: defaultCycle?.billingType || 'SEMI_ANNUAL',
      balanceThreshold: Number(defaultCycle?.balanceThreshold) || 10
    }
  },

  /**
   * Create default billing groups for a given year
   */
  async createDefaultBillingGroups(year: number, billingType: BillingType): Promise<void> {
    const groups = []

    switch (billingType) {
      case 'SEMI_ANNUAL':
        groups.push(
          {
            name: `H1-${year}`,
            description: `First half of ${year} billing group`,
            billingType,
            periodStart: new Date(`${year}-01-01`),
            periodEnd: new Date(`${year}-06-30`)
          },
          {
            name: `H2-${year}`,
            description: `Second half of ${year} billing group`,
            billingType,
            periodStart: new Date(`${year}-07-01`),
            periodEnd: new Date(`${year}-12-31`)
          }
        )
        break

      case 'QUARTERLY':
        for (let q = 1; q <= 4; q++) {
          const startMonth = (q - 1) * 3 + 1
          const endMonth = q * 3
          const endDay = endMonth === 12 ? 31 : new Date(year, endMonth, 0).getDate()

          groups.push({
            name: `Q${q}-${year}`,
            description: `Quarter ${q} of ${year} billing group`,
            billingType,
            periodStart: new Date(year, startMonth - 1, 1),
            periodEnd: new Date(year, endMonth - 1, endDay)
          })
        }
        break

      case 'ANNUAL':
        groups.push({
          name: `${year}`,
          description: `Annual billing group for ${year}`,
          billingType,
          periodStart: new Date(`${year}-01-01`),
          periodEnd: new Date(`${year}-12-31`)
        })
        break

      case 'MONTHLY':
        for (let m = 1; m <= 12; m++) {
          const monthName = new Date(year, m - 1).toLocaleString('en', { month: 'long' })
          const endDay = new Date(year, m, 0).getDate()

          groups.push({
            name: `${monthName}-${year}`,
            description: `${monthName} ${year} billing group`,
            billingType,
            periodStart: new Date(year, m - 1, 1),
            periodEnd: new Date(year, m - 1, endDay)
          })
        }
        break
    }

    // Create all groups in a transaction
    await prisma.$transaction(
      groups.map(group =>
        prisma.billingGroup.create({ data: group })
      )
    )

    console.log(`Created ${groups.length} default billing groups for ${year}`)
  },

  /**
   * Balance assets across billing groups
   */
  async balanceBillingGroups(billingGroupIds: string[], targetBalanceThreshold = 10): Promise<void> {
    try {
      // Get billing groups with asset counts
      const billingGroups = await prisma.billingGroup.findMany({
        where: {
          id: { in: billingGroupIds },
          isActive: true
        },
        include: {
          assetMappings: {
            where: { isActive: true },
            include: {
              asset: true
            }
          }
        }
      })

      if (billingGroups.length < 2) {
        throw new Error('Need at least 2 billing groups to balance')
      }

      // Calculate current distribution
      const totalAssets = billingGroups.reduce((sum, group) => sum + group.assetMappings.length, 0)
      const averageAssetsPerGroup = Math.floor(totalAssets / billingGroups.length)
      
      // Sort groups by asset count
      billingGroups.sort((a, b) => a.assetMappings.length - b.assetMappings.length)

      const underloadedGroup = billingGroups[0]
      const overloadedGroup = billingGroups[billingGroups.length - 1]

      const difference = overloadedGroup.assetMappings.length - underloadedGroup.assetMappings.length
      const thresholdDifference = Math.ceil((targetBalanceThreshold / 100) * averageAssetsPerGroup)

      if (difference <= thresholdDifference) {
        console.log('Billing groups are already balanced within threshold')
        return
      }

      // Calculate how many assets to move
      const assetsToMove = Math.ceil(difference / 2)
      const assetsToReassign = overloadedGroup.assetMappings.slice(0, assetsToMove)

      // Move assets in a transaction
      await prisma.$transaction(async (tx) => {
        for (const mapping of assetsToReassign) {
          // Deactivate current mapping
          await tx.assetBillingMapping.update({
            where: { id: mapping.id },
            data: {
              isActive: false,
              effectiveTo: new Date()
            }
          })

          // Create new mapping to underloaded group
          await tx.assetBillingMapping.create({
            data: {
              assetId: mapping.assetId,
              billingGroupId: underloadedGroup.id,
              assignedBy: 'system-rebalancing',
              notes: `Rebalanced from ${overloadedGroup.name} on ${new Date().toISOString()}`
            }
          })
        }
      })

      console.log(`Rebalanced ${assetsToMove} assets from ${overloadedGroup.name} to ${underloadedGroup.name}`)
    } catch (error) {
      console.error('Error balancing billing groups:', error)
      throw error
    }
  },

  /**
   * Generate forecast for upcoming invoices
   */
  async generateInvoiceForecast(year: number): Promise<any> {
    try {
      const billingGroups = await prisma.billingGroup.findMany({
        where: {
          isActive: true,
          periodStart: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-12-31`)
          }
        },
        include: {
          assetMappings: {
            where: { isActive: true },
            include: {
              asset: {
                include: {
                  model: true,
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
        }
      })

      const forecast = billingGroups.map(group => {
        const assets = group.assetMappings.map(mapping => mapping.asset)
        
        // Calculate estimated costs based on asset purchase prices and contract costs
        const assetCosts = assets.reduce((sum, asset) => {
          const contractCosts = asset.contracts.reduce((contractSum, mapping) => {
            const annualCost = Number(mapping.contract.annualCost) || 0
            return contractSum + (annualCost / 2) // Semi-annual portion
          }, 0)
          
          return sum + contractCosts
        }, 0)

        return {
          billingGroup: {
            id: group.id,
            name: group.name,
            periodStart: group.periodStart,
            periodEnd: group.periodEnd
          },
          assetCount: assets.length,
          estimatedAmount: assetCosts,
          currency: 'NOK',
          assets: assets.map(asset => ({
            id: asset.id,
            serialNumber: asset.serialNumber,
            model: asset.model.modelName,
            estimatedCost: asset.contracts.reduce((sum, mapping) => {
              return sum + (Number(mapping.contract.annualCost) || 0) / 2
            }, 0)
          }))
        }
      })

      return {
        year,
        totalGroups: forecast.length,
        totalAssets: forecast.reduce((sum, f) => sum + f.assetCount, 0),
        totalEstimatedAmount: forecast.reduce((sum, f) => sum + f.estimatedAmount, 0),
        forecast
      }
    } catch (error) {
      console.error('Error generating invoice forecast:', error)
      throw error
    }
  },

  /**
   * Get unassigned assets that need billing group assignment
   */
  async getUnassignedAssets(): Promise<any[]> {
    try {
      const unassignedAssets = await prisma.hardwareAsset.findMany({
        where: {
          status: 'ACTIVE',
          billingMappings: {
            none: {
              isActive: true
            }
          }
        },
        include: {
          model: true,
          contracts: {
            where: { status: 'active' },
            include: {
              contract: true
            }
          }
        },
        orderBy: { purchaseDate: 'desc' }
      })

      return unassignedAssets
    } catch (error) {
      console.error('Error fetching unassigned assets:', error)
      throw error
    }
  }
}