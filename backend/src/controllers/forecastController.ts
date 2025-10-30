import { Request, Response } from 'express'
import { prisma } from '../index'
import { z } from 'zod'

// Validation schema for forecast query parameters
const forecastQuerySchema = z.object({
  months: z.string().optional().transform(val => val ? parseInt(val) : 12),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

interface ForecastPeriod {
  period: string // YYYY-MM format
  periodStart: Date
  periodEnd: Date
  billingGroupCosts: {
    groupId: string
    groupName: string
    totalCost: number
    assetCount: number
  }[]
  contractRenewals: {
    contractId: string
    contractNumber: string
    vendor: string
    renewalCost: number
    renewalDate: Date
  }[]
  totalBillingCosts: number
  totalRenewalCosts: number
  totalPeriodCost: number
}

interface ForecastSummary {
  totalForecast: number
  averageMonthly: number
  peakMonth: {
    period: string
    amount: number
  }
  nextRenewals: {
    contractId: string
    contractNumber: string
    renewalDate: Date
    cost: number
  }[]
  upcomingBillingPeriods: {
    groupId: string
    groupName: string
    nextBillingDate: Date
    estimatedCost: number
  }[]
}

export const forecastController = {
  // Get comprehensive invoice forecast
  async getForecast(req: Request, res: Response) {
    try {
      const { months, startDate, endDate } = forecastQuerySchema.parse(req.query)
      
      // Calculate forecast period
      const now = new Date()
      const forecastStart = startDate ? new Date(startDate) : now
      const forecastEnd = endDate 
        ? new Date(endDate) 
        : new Date(forecastStart.getFullYear(), forecastStart.getMonth() + months, 0)

      // Generate monthly periods for forecast
      const periods = generateMonthlyPeriods(forecastStart, forecastEnd)
      
      // Get all active billing groups with their assets
      const billingGroups = await prisma.billingGroup.findMany({
        where: {
          isActive: true,
          OR: [
            {
              periodStart: { lte: forecastEnd },
              periodEnd: { gte: forecastStart }
            },
            {
              // Include groups that will have future periods
              billingType: { in: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'] }
            }
          ]
        },
        include: {
          assetMappings: {
            where: {
              isActive: true,
              effectiveFrom: { lte: forecastEnd },
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: forecastStart } }
              ]
            },
            include: {
              asset: {
                include: {
                  model: true,
                  contracts: {
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

      // Get maintenance contracts that need renewal in forecast period
      const renewalContracts = await prisma.maintenanceContract.findMany({
        where: {
          isActive: true,
          OR: [
            {
              renewalDate: {
                gte: forecastStart,
                lte: forecastEnd
              }
            },
            {
              endDate: {
                gte: forecastStart,
                lte: forecastEnd
              }
            }
          ]
        }
      })

      // Calculate forecast for each period
      const forecastPeriods: ForecastPeriod[] = []
      
      for (const period of periods) {
        const billingGroupCosts = await calculateBillingGroupCosts(
          billingGroups, 
          period.start, 
          period.end
        )
        
        const contractRenewals = calculateContractRenewals(
          renewalContracts,
          period.start,
          period.end
        )

        const totalBillingCosts = billingGroupCosts.reduce((sum, group) => sum + group.totalCost, 0)
        const totalRenewalCosts = contractRenewals.reduce((sum, renewal) => sum + renewal.renewalCost, 0)

        forecastPeriods.push({
          period: period.label,
          periodStart: period.start,
          periodEnd: period.end,
          billingGroupCosts,
          contractRenewals,
          totalBillingCosts,
          totalRenewalCosts,
          totalPeriodCost: totalBillingCosts + totalRenewalCosts
        })
      }

      // Calculate summary statistics
      const summary = calculateForecastSummary(forecastPeriods, renewalContracts, billingGroups)

      res.json({
        forecast: {
          periods: forecastPeriods,
          summary,
          metadata: {
            forecastStart,
            forecastEnd,
            totalPeriods: periods.length,
            generatedAt: new Date()
          }
        }
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: error.errors })
      }
      console.error('Error generating forecast:', error)
      res.status(500).json({ error: 'Failed to generate forecast' })
    }
  },

  // Get cost breakdown by billing groups
  async getBillingGroupBreakdown(req: Request, res: Response) {
    try {
      const billingGroups = await prisma.billingGroup.findMany({
        where: { isActive: true },
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
          }
        }
      })

      const breakdown = billingGroups.map(group => {
        const assets = group.assetMappings.map(mapping => mapping.asset)
        const totalValue = assets.reduce((sum, asset) => {
          const price = asset.purchasePrice ? parseFloat(asset.purchasePrice.toString()) : 0
          return sum + price
        }, 0)

        // Calculate period cost based on billing type
        const periodMultiplier = getBillingPeriodMultiplier(group.billingType)
        const periodCost = totalValue * periodMultiplier

        return {
          id: group.id,
          name: group.name,
          billingType: group.billingType,
          periodStart: group.periodStart,
          periodEnd: group.periodEnd,
          assetCount: assets.length,
          totalAssetValue: totalValue,
          periodCost,
          estimatedAnnualCost: totalValue
        }
      })

      res.json({ breakdown })

    } catch (error) {
      console.error('Error getting billing group breakdown:', error)
      res.status(500).json({ error: 'Failed to get billing group breakdown' })
    }
  },

  // Get upcoming contract renewals
  async getUpcomingRenewals(req: Request, res: Response) {
    try {
      const { months = 12 } = req.query
      const monthsAhead = parseInt(months as string)
      
      const cutoffDate = new Date()
      cutoffDate.setMonth(cutoffDate.getMonth() + monthsAhead)

      const upcomingRenewals = await prisma.maintenanceContract.findMany({
        where: {
          isActive: true,
          OR: [
            {
              renewalDate: {
                gte: new Date(),
                lte: cutoffDate
              }
            },
            {
              endDate: {
                gte: new Date(),
                lte: cutoffDate
              }
            }
          ]
        },
        include: {
          assets: {
            include: {
              asset: {
                include: {
                  model: true
                }
              }
            }
          }
        },
        orderBy: [
          { renewalDate: 'asc' },
          { endDate: 'asc' }
        ]
      })

      const renewals = upcomingRenewals.map(contract => ({
        id: contract.id,
        contractNumber: contract.contractNumber,
        vendor: contract.vendor,
        contractType: contract.contractType,
        currentEndDate: contract.endDate,
        renewalDate: contract.renewalDate,
        annualCost: contract.annualCost ? parseFloat(contract.annualCost.toString()) : 0,
        assetCount: contract.assets.length,
        autoRenewal: contract.autoRenewal,
        daysUntilRenewal: contract.renewalDate 
          ? Math.ceil((new Date(contract.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      }))

      res.json({ renewals })

    } catch (error) {
      console.error('Error getting upcoming renewals:', error)
      res.status(500).json({ error: 'Failed to get upcoming renewals' })
    }
  }
}

// Helper functions

function generateMonthlyPeriods(start: Date, end: Date) {
  const periods = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  
  while (current <= end) {
    const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    periods.push({
      label: `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}`,
      start: new Date(current),
      end: periodEnd
    })
    current.setMonth(current.getMonth() + 1)
  }
  
  return periods
}

async function calculateBillingGroupCosts(
  billingGroups: any[], 
  periodStart: Date, 
  periodEnd: Date
) {
  return billingGroups.map(group => {
    const assets = group.assetMappings.map((mapping: any) => mapping.asset)
    
    // Check if this billing group has a billing period that overlaps with forecast period
    const groupStart = new Date(group.periodStart)
    const groupEnd = new Date(group.periodEnd)
    
    // Calculate if billing occurs in this period
    const shouldBill = checkBillingPeriodOverlap(
      group.billingType,
      groupStart,
      groupEnd,
      periodStart,
      periodEnd
    )
    
    let totalCost = 0
    if (shouldBill) {
      totalCost = assets.reduce((sum: number, asset: any) => {
        const price = asset.purchasePrice ? parseFloat(asset.purchasePrice.toString()) : 0
        return sum + price
      }, 0)
      
      // Apply billing period multiplier
      const periodMultiplier = getBillingPeriodMultiplier(group.billingType)
      totalCost = totalCost * periodMultiplier
    }

    return {
      groupId: group.id,
      groupName: group.name,
      totalCost,
      assetCount: assets.length
    }
  })
}

function calculateContractRenewals(
  contracts: any[],
  periodStart: Date,
  periodEnd: Date
) {
  return contracts.filter(contract => {
    const renewalDate = contract.renewalDate ? new Date(contract.renewalDate) : new Date(contract.endDate)
    return renewalDate >= periodStart && renewalDate <= periodEnd
  }).map(contract => ({
    contractId: contract.id,
    contractNumber: contract.contractNumber,
    vendor: contract.vendor,
    renewalCost: contract.annualCost ? parseFloat(contract.annualCost.toString()) : 0,
    renewalDate: contract.renewalDate ? new Date(contract.renewalDate) : new Date(contract.endDate)
  }))
}

function getBillingPeriodMultiplier(billingType: string): number {
  switch (billingType) {
    case 'MONTHLY': return 1/12
    case 'QUARTERLY': return 0.25
    case 'SEMI_ANNUAL': return 0.5
    case 'ANNUAL': return 1
    default: return 0.5 // Default to semi-annual
  }
}

function checkBillingPeriodOverlap(
  billingType: string,
  groupStart: Date,
  groupEnd: Date,
  periodStart: Date,
  periodEnd: Date
): boolean {
  // Simplified logic - in a real scenario, you'd calculate exact billing dates
  // based on billingType frequency and group start date
  
  // For now, assume billing occurs if the group period overlaps with forecast period
  return groupStart <= periodEnd && groupEnd >= periodStart
}

function calculateForecastSummary(
  periods: ForecastPeriod[],
  renewalContracts: any[],
  billingGroups: any[]
): ForecastSummary {
  const totalForecast = periods.reduce((sum, period) => sum + period.totalPeriodCost, 0)
  const averageMonthly = totalForecast / periods.length
  
  // Find peak month
  const peakPeriod = periods.reduce((max, period) => 
    period.totalPeriodCost > max.totalPeriodCost ? period : max
  )

  // Get next 5 renewals
  const nextRenewals = renewalContracts
    .filter(contract => {
      const renewalDate = contract.renewalDate ? new Date(contract.renewalDate) : new Date(contract.endDate)
      return renewalDate >= new Date()
    })
    .sort((a, b) => {
      const dateA = a.renewalDate ? new Date(a.renewalDate) : new Date(a.endDate)
      const dateB = b.renewalDate ? new Date(b.renewalDate) : new Date(b.endDate)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)
    .map(contract => ({
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      renewalDate: contract.renewalDate ? new Date(contract.renewalDate) : new Date(contract.endDate),
      cost: contract.annualCost ? parseFloat(contract.annualCost.toString()) : 0
    }))

  // Get upcoming billing periods
  const upcomingBillingPeriods = billingGroups
    .filter(group => new Date(group.periodEnd) >= new Date())
    .sort((a, b) => new Date(a.periodEnd).getTime() - new Date(b.periodEnd).getTime())
    .slice(0, 5)
    .map(group => {
      const assets = group.assetMappings.map((mapping: any) => mapping.asset)
      const totalValue = assets.reduce((sum: number, asset: any) => {
        const price = asset.purchasePrice ? parseFloat(asset.purchasePrice.toString()) : 0
        return sum + price
      }, 0)
      const periodMultiplier = getBillingPeriodMultiplier(group.billingType)
      
      return {
        groupId: group.id,
        groupName: group.name,
        nextBillingDate: new Date(group.periodEnd),
        estimatedCost: totalValue * periodMultiplier
      }
    })

  return {
    totalForecast,
    averageMonthly,
    peakMonth: {
      period: peakPeriod.period,
      amount: peakPeriod.totalPeriodCost
    },
    nextRenewals,
    upcomingBillingPeriods
  }
}