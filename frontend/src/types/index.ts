// API Types matching backend Prisma schema

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

export type ModelType = 'ROUTER' | 'SWITCH' | 'FIREWALL' | 'WIRELESS_AP' | 'CONTROLLER' | 'OTHER'

export type AssetStatus = 'ACTIVE' | 'SPARE' | 'DEFECT' | 'RETIRED' | 'IN_REPAIR' | 'MISSING'

export type LicenseType = 'SUBSCRIPTION' | 'PERPETUAL' | 'FEATURE' | 'TRIAL'

export type ContractType = 'JUNIPER_CARE' | 'PREMIUM_CARE' | 'THIRD_PARTY' | 'OTHER'

export interface HardwareModel {
  id: string
  manufacturer: string
  modelName: string
  modelType: ModelType
  description?: string
  technicalSpecs?: any
  eolDate?: string
  eosDate?: string
  eolAnnouncedAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface License {
  id: string
  licenseKey?: string
  licenseType: LicenseType
  softwareProduct: string
  quantity: number
  purchaseDate?: string
  expiryDate?: string
  cost?: number
  vendorContractNumber?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  assets?: AssetLicenseMapping[]
}

export interface MaintenanceContract {
  id: string
  contractNumber: string
  contractType: ContractType
  vendor: string
  startDate: string
  endDate: string
  renewalDate?: string
  annualCost?: number
  serviceLevel?: string
  autoRenewal: boolean
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  assets?: AssetContractMapping[]
}

export interface HardwareAsset {
  id: string
  modelId: string
  serialNumber: string
  assetTag?: string
  hostname?: string
  purchaseDate?: string
  purchasePrice?: number
  location?: string
  rackPosition?: string
  status: AssetStatus
  owner?: string
  notes?: string
  observiumId?: number
  lastSyncAt?: string
  lastAuditDate?: string
  createdAt: string
  updatedAt: string
  model?: HardwareModel
  licenses?: AssetLicenseMapping[]
  contracts?: AssetContractMapping[]
}

export interface AssetLicenseMapping {
  id: string
  assetId: string
  licenseId: string
  assignedDate: string
  status: string
  createdAt: string
  updatedAt: string
  asset?: HardwareAsset
  license?: License
}

export interface AssetContractMapping {
  id: string
  assetId: string
  contractId: string
  coverageStart: string
  coverageEnd: string
  status: string
  createdAt: string
  updatedAt: string
  asset?: HardwareAsset
  contract?: MaintenanceContract
}

// API Request/Response Types

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResponse {
  total: number
  page: number
  limit: number
  pages: number
}

export interface GetAssetsParams extends PaginationParams {
  search?: string
  status?: AssetStatus
  modelId?: string
}

export interface GetAssetsResponse {
  assets: HardwareAsset[]
  pagination: PaginationResponse
}

export interface CreateAssetInput {
  modelId: string
  serialNumber: string
  assetTag?: string
  hostname?: string
  purchaseDate?: string
  purchasePrice?: number
  location?: string
  rackPosition?: string
  status: AssetStatus
  owner?: string
  notes?: string
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  id: string
}

export interface GetLicensesParams extends PaginationParams {
  search?: string
  licenseType?: LicenseType
}

export interface GetLicensesResponse {
  licenses: License[]
  pagination: PaginationResponse
}

export interface GetContractsParams extends PaginationParams {
  search?: string
  contractType?: ContractType
  isActive?: boolean
}

export interface GetContractsResponse {
  contracts: MaintenanceContract[]
  pagination: PaginationResponse
}

export interface GetModelsParams extends PaginationParams {
  search?: string
  modelType?: ModelType
}

export interface GetModelsResponse {
  models: HardwareModel[]
  pagination: PaginationResponse
}

export interface DashboardStats {
  totalAssets: number
  assetsWithoutContracts: number
  activeContracts: number
  expiringContracts: number
  totalLicenses: number
  totalAnnualCost: number
}
