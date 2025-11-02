import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, AlertTriangle, Download, Upload, Loader2, RefreshCw, Check, FileUp, FileWarning, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Form'
import { api } from '@/api/client'

interface ValidationSummary {
  totalNLogic: number
  totalNEAS: number
  matched: number
  onlyInNLogic: number
  onlyInNEAS: number
  differences: number
  missingContracts: number
  contractDateMismatches: number
}

interface NLogicAsset {
  serialNumber: string
  model: string
  partNumber: string
  productType: string
  location: string
  renew: string
  renewalPrice: number
  startDate: string | null
  endDate: string | null
  comment: string
}

interface NEASAsset {
  id: string
  serialNumber: string
  model: string
  assetTag: string | null
  hostname: string | null
  location: string | null
  status: string
  purchaseDate: string | null
}

interface AssetDifference {
  serialNumber: string
  nlogic: NLogicAsset
  neas: NEASAsset
  differences: {
    field: string
    nlogicValue: any
    neasValue: any
  }[]
}

interface ContractIssue {
  serialNumber: string
  assetId: string
  model: string
  issue: 'missing' | 'date_mismatch'
  nlogicEndDate: string | null
  nlogicRenewalPrice: number
  currentContract?: {
    id: string
    endDate: string
    annualCost: number | null
  }
}

interface ValidationResult {
  summary: ValidationSummary
  onlyInNLogic: NLogicAsset[]
  onlyInNEAS: NEASAsset[]
  differences: AssetDifference[]
  contractIssues: ContractIssue[]
}

export default function ValidationPage() {
  const [activeTab, setActiveTab] = useState<'onlyNLogic' | 'onlyNEAS' | 'differences' | 'contracts'>('onlyNLogic')
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set())
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set())
  const [contractIssueFilter, setContractIssueFilter] = useState<'all' | 'missing' | 'date_mismatch'>('all')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setUploadedFileName(file.name)
    }
  }

  // Handle compare with uploaded file
  const handleCompare = async () => {
    if (!uploadedFile) {
      refetch()
      return
    }

    const formData = new FormData()
    formData.append('file', uploadedFile)

    try {
      const { data } = await api.post<ValidationResult>('/validation/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      queryClient.setQueryData(['validation'], data)
    } catch (error) {
      console.error('Error comparing data:', error)
    }
  }

  // Fetch validation results (initially without file)
  const { data: validationData, isLoading, error, refetch } = useQuery<ValidationResult>({
    queryKey: ['validation'],
    queryFn: async () => {
      const { data } = await api.post<ValidationResult>('/validation/compare', {})
      return data
    },
    enabled: false, // Don't auto-fetch on mount
  })

  // Import single asset
  const importAsset = useMutation({
    mutationFn: async (serialNumber: string) => {
      const { data } = await api.post('/validation/import', { serialNumber })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  // Bulk import assets
  const bulkImport = useMutation({
    mutationFn: async (serialNumbers: string[]) => {
      const { data } = await api.post('/validation/bulk-import', { serialNumbers })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setSelectedForImport(new Set())
    },
  })

  // Update asset from nLogic
  const updateAsset = useMutation({
    mutationFn: async ({
      assetId,
      serialNumber,
      fieldsToUpdate,
    }: {
      assetId: string
      serialNumber: string
      fieldsToUpdate: string[]
    }) => {
      const { data } = await api.put('/validation/update', {
        assetId,
        serialNumber,
        fieldsToUpdate,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })

  // Sync contract from nLogic
  const syncContract = useMutation({
    mutationFn: async ({
      assetId,
      serialNumber,
    }: {
      assetId: string
      serialNumber: string
    }) => {
      const { data } = await api.post('/validation/sync-contract', {
        assetId,
        serialNumber,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  // Bulk sync contracts from nLogic
  const bulkSyncContracts = useMutation({
    mutationFn: async (issues: ContractIssue[]) => {
      const results = []
      for (const issue of issues) {
        const { data } = await api.post('/validation/sync-contract', {
          assetId: issue.assetId,
          serialNumber: issue.serialNumber,
        })
        results.push(data)
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setSelectedContracts(new Set())
    },
  })

  const handleToggleSelect = (serialNumber: string) => {
    const newSet = new Set(selectedForImport)
    if (newSet.has(serialNumber)) {
      newSet.delete(serialNumber)
    } else {
      newSet.add(serialNumber)
    }
    setSelectedForImport(newSet)
  }

  const handleSelectAll = () => {
    if (!validationData) return
    const allSerialNumbers = validationData.onlyInNLogic.map((a) => a.serialNumber)
    setSelectedForImport(new Set(allSerialNumbers))
  }

  const handleDeselectAll = () => {
    setSelectedForImport(new Set())
  }

  const handleBulkImport = async () => {
    await bulkImport.mutateAsync(Array.from(selectedForImport))
  }

  const handleToggleContractSelect = (assetId: string) => {
    const newSet = new Set(selectedContracts)
    if (newSet.has(assetId)) {
      newSet.delete(assetId)
    } else {
      newSet.add(assetId)
    }
    setSelectedContracts(newSet)
  }

  const handleSelectAllContracts = (issues: ContractIssue[]) => {
    setSelectedContracts(new Set(issues.map(issue => issue.assetId)))
  }

  const handleDeselectAllContracts = () => {
    setSelectedContracts(new Set())
  }

  const handleBulkSyncContracts = async () => {
    if (!validationData) return
    const issuesToSync = validationData.contractIssues.filter(issue =>
      selectedContracts.has(issue.assetId)
    )
    await bulkSyncContracts.mutateAsync(issuesToSync)
  }

  // Filter contract issues based on selected filter
  const filteredContractIssues = useMemo(() => {
    if (!validationData) return []
    if (contractIssueFilter === 'all') return validationData.contractIssues
    return validationData.contractIssues.filter(issue => issue.issue === contractIssueFilter)
  }, [validationData, contractIssueFilter])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading validation data: {(error as any).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Validation</h1>
          <p className="text-sm text-gray-600 mt-1">
            Compare NEAS data with nLogic annual report
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Upload nLogic File
          </Button>
          <Button
            onClick={handleCompare}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Compare
          </Button>
        </div>
      </div>

      {/* File Upload Info */}
      {uploadedFileName && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-900">Uploaded File:</div>
                <div className="text-sm text-blue-700">{uploadedFileName}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setUploadedFile(null)
                setUploadedFileName('')
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-500">Comparing data...</p>
        </Card>
      ) : validationData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Matched</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {validationData.summary.matched}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Download className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Only in nLogic</div>
                  <div className="text-2xl font-bold text-green-600">
                    {validationData.summary.onlyInNLogic}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Only in NEAS</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {validationData.summary.onlyInNEAS}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Differences</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {validationData.summary.differences}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <XCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total nLogic</div>
                  <div className="text-2xl font-bold text-gray-600">
                    {validationData.summary.totalNLogic}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <FileWarning className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Missing Contracts</div>
                  <div className="text-2xl font-bold text-red-600">
                    {validationData.summary.missingContracts}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date Mismatches</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {validationData.summary.contractDateMismatches}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('onlyNLogic')}
                className={`${
                  activeTab === 'onlyNLogic'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                Only in nLogic
                <Badge variant="success">{validationData.summary.onlyInNLogic}</Badge>
              </button>
              <button
                onClick={() => setActiveTab('onlyNEAS')}
                className={`${
                  activeTab === 'onlyNEAS'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                Only in NEAS
                <Badge variant="warning">{validationData.summary.onlyInNEAS}</Badge>
              </button>
              <button
                onClick={() => setActiveTab('differences')}
                className={`${
                  activeTab === 'differences'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                Differences
                <Badge variant="error">{validationData.summary.differences}</Badge>
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`${
                  activeTab === 'contracts'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                Contract Issues
                <Badge variant="error">{validationData.summary.missingContracts + validationData.summary.contractDateMismatches}</Badge>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'onlyNLogic' && (
            <Card className="p-0">
              {selectedForImport.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    {selectedForImport.size} asset(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkImport}
                      disabled={bulkImport.isPending}
                    >
                      {bulkImport.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import Selected
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-neas-pine to-primary-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedForImport.size === validationData.onlyInNLogic.length}
                          onChange={(e) => {
                            if (e.target.checked) handleSelectAll()
                            else handleDeselectAll()
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Part Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Til Dato (End Date)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Renewal Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationData.onlyInNLogic.map((asset) => (
                      <tr key={asset.serialNumber} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedForImport.has(asset.serialNumber)}
                            onChange={() => handleToggleSelect(asset.serialNumber)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{asset.serialNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{asset.model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{asset.partNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{asset.location || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {asset.startDate
                              ? new Date(asset.startDate).toLocaleDateString('no-NO')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {asset.endDate
                              ? new Date(asset.endDate).toLocaleDateString('no-NO')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {asset.renewalPrice > 0
                              ? `${asset.renewalPrice.toLocaleString('no-NO', {
                                  style: 'currency',
                                  currency: 'NOK',
                                })}`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            size="sm"
                            onClick={() => importAsset.mutate(asset.serialNumber)}
                            disabled={importAsset.isPending}
                          >
                            {importAsset.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'onlyNEAS' && (
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-neas-pine to-primary-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Asset Tag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Hostname
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationData.onlyInNEAS.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{asset.serialNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{asset.model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{asset.assetTag || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{asset.hostname || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{asset.location || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              asset.status === 'ACTIVE'
                                ? 'success'
                                : asset.status === 'RETIRED'
                                ? 'default'
                                : 'warning'
                            }
                          >
                            {asset.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'differences' && (
            <Card className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-neas-pine to-primary-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Differences
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        nLogic Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        NEAS Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationData.differences.map((diff) => (
                      <tr key={diff.serialNumber} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap" rowSpan={diff.differences.length}>
                          <div className="font-medium text-gray-900">{diff.serialNumber}</div>
                          <div className="text-xs text-gray-500 mt-1">{diff.nlogic.model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="warning">{diff.differences[0].field}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{diff.differences[0].nlogicValue || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{diff.differences[0].neasValue || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right" rowSpan={diff.differences.length}>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateAsset.mutate({
                                assetId: diff.neas.id,
                                serialNumber: diff.serialNumber,
                                fieldsToUpdate: diff.differences.map((d) => d.field),
                              })
                            }
                            disabled={updateAsset.isPending}
                          >
                            {updateAsset.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Update from nLogic
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'contracts' && (
            <Card className="p-0">
              {/* Filter and Bulk Actions Bar */}
              <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-700">Filter by issue type:</div>
                    <Select
                      value={contractIssueFilter}
                      onChange={(e) => {
                        setContractIssueFilter(e.target.value as 'all' | 'missing' | 'date_mismatch')
                        setSelectedContracts(new Set()) // Clear selections when filter changes
                      }}
                      options={[
                        { value: 'all', label: 'All Issues' },
                        { value: 'missing', label: 'Missing Contract' },
                        { value: 'date_mismatch', label: 'Date/Cost Mismatch' },
                      ]}
                      className="w-48"
                    />
                    <div className="text-sm text-gray-600">
                      Showing {filteredContractIssues.length} of {validationData.contractIssues.length} issues
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Selection Bar */}
              {selectedContracts.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    {selectedContracts.size} contract(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDeselectAllContracts}
                    >
                      Deselect All
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleBulkSyncContracts}
                      disabled={bulkSyncContracts.isPending}
                    >
                      {bulkSyncContracts.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating {selectedContracts.size} contract(s)...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Update Selected Contracts
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-neas-pine to-primary-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedContracts.size === filteredContractIssues.length && filteredContractIssues.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) handleSelectAllContracts(filteredContractIssues)
                            else handleDeselectAllContracts()
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Issue Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        nLogic End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        nLogic Renewal Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        NEAS Contract
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContractIssues.map((issue) => (
                      <tr key={issue.assetId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedContracts.has(issue.assetId)}
                            onChange={() => handleToggleContractSelect(issue.assetId)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{issue.serialNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{issue.model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={issue.issue === 'missing' ? 'error' : 'warning'}>
                            {issue.issue === 'missing' ? 'Missing Contract' : 'Date/Cost Mismatch'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {issue.nlogicEndDate
                              ? new Date(issue.nlogicEndDate).toLocaleDateString('no-NO')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {issue.nlogicRenewalPrice > 0
                              ? `${issue.nlogicRenewalPrice.toLocaleString('no-NO', {
                                  style: 'currency',
                                  currency: 'NOK',
                                })}`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {issue.currentContract ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                End: {new Date(issue.currentContract.endDate).toLocaleDateString('no-NO')}
                                {issue.nlogicEndDate &&
                                 new Date(issue.currentContract.endDate).toISOString().split('T')[0] !==
                                 new Date(issue.nlogicEndDate).toISOString().split('T')[0] && (
                                  <span className="ml-2 text-xs text-red-600 font-semibold">≠</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                Cost: {issue.currentContract.annualCost
                                  ? issue.currentContract.annualCost.toLocaleString('no-NO', {
                                      style: 'currency',
                                      currency: 'NOK',
                                    })
                                  : '0 kr'}
                                {Math.abs((issue.currentContract.annualCost || 0) - issue.nlogicRenewalPrice) > 1 && (
                                  <span className="ml-2 text-xs text-red-600 font-semibold">≠</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No contract</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            size="sm"
                            onClick={() =>
                              syncContract.mutate({
                                assetId: issue.assetId,
                                serialNumber: issue.serialNumber,
                              })
                            }
                            disabled={syncContract.isPending || bulkSyncContracts.isPending}
                          >
                            {syncContract.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                {issue.issue === 'missing' ? 'Create' : 'Update'}
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
