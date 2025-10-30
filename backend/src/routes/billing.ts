import { Router } from 'express'
import { billingController } from '../controllers/billingController'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

// Apply authentication middleware to all billing routes
router.use(authenticate)

// Billing Groups routes
router.get('/groups', billingController.getBillingGroups)
router.get('/groups/:id', billingController.getBillingGroupById)
router.post('/groups', billingController.createBillingGroup)
router.put('/groups/:id', billingController.updateBillingGroup)
router.delete('/groups/:id', billingController.deleteBillingGroup)

// Asset Billing Mapping routes
router.post('/assign-asset', billingController.assignAssetToBillingGroup)
router.delete('/assign-asset/:assetId/:billingGroupId', billingController.removeAssetFromBillingGroup)

// Invoice Records routes
router.get('/invoices', billingController.getInvoiceRecords)
router.post('/invoices', billingController.createInvoiceRecord)
router.put('/invoices/:id', billingController.updateInvoiceRecord)

// Analytics routes
router.get('/analytics', billingController.getBillingAnalytics)

// Utility routes
router.get('/unassigned-assets', billingController.getUnassignedAssets)
router.get('/forecast', billingController.getInvoiceForecast)
router.post('/balance-groups', billingController.balanceBillingGroups)

export default router