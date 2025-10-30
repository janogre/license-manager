import { Router } from 'express'
import { contractTypeController } from '../controllers/contractTypeController'

const router = Router()

// GET /api/contract-types - Get all contract types
router.get('/', contractTypeController.getContractTypes)

// GET /api/contract-types/:id - Get single contract type
router.get('/:id', contractTypeController.getContractTypeById)

// POST /api/contract-types - Create new contract type
router.post('/', contractTypeController.createContractType)

// PUT /api/contract-types/:id - Update contract type
router.put('/:id', contractTypeController.updateContractType)

// DELETE /api/contract-types/:id - Soft delete (deactivate) contract type
router.delete('/:id', contractTypeController.deleteContractType)

// PUT /api/contract-types/:id/activate - Activate contract type
router.put('/:id/activate', contractTypeController.activateContractType)

// PUT /api/contract-types/:id/set-default - Set as default contract type
router.put('/:id/set-default', contractTypeController.setDefaultContractType)

export default router