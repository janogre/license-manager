import React, { useState } from 'react'
import { TrendingUp, Calendar, DollarSign, AlertTriangle, RefreshCw, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Form'
import { useForecast, useBillingGroupBreakdown, useUpcomingRenewals } from '@/hooks/useForecast'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import { format, differenceInDays } from 'date-fns'

export default function ForecastPage() {
  const [forecastMonths, setForecastMonths] = useState(12)
  const [renewalMonths, setRenewalMonths] = useState(12)

  // Fetch forecast data
  const { data: forecastData, isLoading: forecastLoading, error: forecastError, refetch } = useForecast({
    months: forecastMonths
  })

  const { data: breakdownData, isLoading: breakdownLoading } = useBillingGroupBreakdown()
  const { data: renewalsData, isLoading: renewalsLoading } = useUpcomingRenewals(renewalMonths)

  const forecast = forecastData?.forecast
  const breakdown = breakdownData?.breakdown || []
  const renewals = renewalsData?.renewals || []

  const formatCurrency = (value: number) => `${Math.round(value).toLocaleString()} kr`

  if (forecastError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading forecast: {(forecastError as any).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Forecasting</h1>
          <p className="text-sm text-gray-600 mt-1">
            Predict future invoice costs and plan your budget
          </p>
        </div>
        <div className="flex gap-3">
          <Select
            value={forecastMonths.toString()}
            onChange={(e) => setForecastMonths(parseInt(e.target.value))}
            options={[
              { value: '6', label: '6 Months' },
              { value: '12', label: '12 Months' },
              { value: '18', label: '18 Months' },
              { value: '24', label: '24 Months' },
            ]}
          />
          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={forecastLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${forecastLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {forecastLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      ) : forecast ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Forecast</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(forecast.summary.totalForecast)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Next {forecastMonths} months
                </p>
              </div>
              <div className="ml-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Monthly Average</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(forecast.summary.averageMonthly)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Per month average
                </p>
              </div>
              <div className="ml-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Peak Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(forecast.summary.peakMonth.amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {forecast.summary.peakMonth.period}
                </p>
              </div>
              <div className="ml-4">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Upcoming Renewals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forecast.summary.nextRenewals.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Next {forecastMonths} months
                </p>
              </div>
              <div className="ml-4">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Forecast Chart */}
        <Card className="p-6">
          {forecastLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : forecast ? (
            <LineChart
              title="Monthly Forecast"
              data={forecast.periods.map(period => ({
                label: period.period,
                value: period.totalPeriodCost
              }))}
              valueFormatter={formatCurrency}
              color="#3b82f6"
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No forecast data available</p>
            </div>
          )}
        </Card>

        {/* Billing Group Breakdown */}
        <Card className="p-6">
          {breakdownLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : breakdown.length > 0 ? (
            <BarChart
              title="Cost by Billing Group"
              data={breakdown.map(group => ({
                label: group.name,
                value: group.periodCost,
                color: '#10b981'
              }))}
              valueFormatter={formatCurrency}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No billing groups found</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Billing Periods */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Billing Periods</h3>
            <Badge variant="info">{forecast?.summary.upcomingBillingPeriods.length || 0} periods</Badge>
          </div>
          
          <div className="space-y-3">
            {forecastLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : forecast?.summary.upcomingBillingPeriods.length > 0 ? (
              forecast.summary.upcomingBillingPeriods.map((period) => (
                <div key={period.groupId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{period.groupName}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(period.nextBillingDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(period.estimatedCost)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {differenceInDays(new Date(period.nextBillingDate), new Date())} days
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming billing periods</p>
            )}
          </div>
        </Card>

        {/* Upcoming Contract Renewals */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h3>
            <div className="flex gap-2">
              <Select
                value={renewalMonths.toString()}
                onChange={(e) => setRenewalMonths(parseInt(e.target.value))}
                options={[
                  { value: '6', label: '6 Months' },
                  { value: '12', label: '12 Months' },
                  { value: '24', label: '24 Months' },
                ]}
              />
              <Badge variant="warning">{renewals.length} renewals</Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {renewalsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : renewals.length > 0 ? (
              renewals.slice(0, 5).map((renewal) => (
                <div key={renewal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{renewal.contractNumber}</div>
                    <div className="text-sm text-gray-500">{renewal.vendor}</div>
                    <div className="text-xs text-gray-400">
                      {renewal.assetCount} assets • {renewal.autoRenewal ? 'Auto-renewal' : 'Manual renewal'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(renewal.annualCost)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {renewal.daysUntilRenewal !== null ? (
                        renewal.daysUntilRenewal > 0 ? (
                          `${renewal.daysUntilRenewal} days`
                        ) : (
                          'Overdue'
                        )
                      ) : (
                        'No date set'
                      )}
                    </div>
                    {renewal.daysUntilRenewal !== null && renewal.daysUntilRenewal <= 30 && (
                      <Badge variant="danger" className="text-xs">Urgent</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming renewals</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}