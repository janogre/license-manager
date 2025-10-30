import { Router } from 'express'
import { forecastController } from '../controllers/forecastController'

const router = Router()

// GET /api/forecast - Get comprehensive invoice forecast
router.get('/', forecastController.getForecast)

// GET /api/forecast/billing-breakdown - Get cost breakdown by billing groups
router.get('/billing-breakdown', forecastController.getBillingGroupBreakdown)

// GET /api/forecast/upcoming-renewals - Get upcoming contract renewals
router.get('/upcoming-renewals', forecastController.getUpcomingRenewals)

export default router