import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '@/api/client'
import { RefreshCw } from 'lucide-react'

export default function SyncPage() {
  const [syncResult, setSyncResult] = useState<any>(null)

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/sync/observium')
      return response.data
    },
    onSuccess: (data) => {
      setSyncResult(data)
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Observium Sync</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Manual Sync</h2>
        <p className="text-sm text-gray-600 mb-4">
          Manually trigger a sync with Observium to import or update Juniper devices.
        </p>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-5 w-5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
        </button>

        {syncMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Sync failed: {(syncMutation.error as any)?.response?.data?.error || 'Unknown error'}
            </p>
          </div>
        )}

        {syncResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-900 mb-2">Sync completed successfully!</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div>Created: {syncResult.stats?.created || 0}</div>
              <div>Updated: {syncResult.stats?.updated || 0}</div>
              <div>Skipped: {syncResult.stats?.skipped || 0}</div>
              <div>Errors: {syncResult.stats?.errors || 0}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sync Configuration</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>Automatic sync is configured in the backend .env file:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>OBSERVIUM_ENABLED: Enable/disable Observium integration</li>
            <li>OBSERVIUM_URL: Your Observium server URL</li>
            <li>OBSERVIUM_SYNC_CRON: Schedule for automatic sync (default: daily at 2 AM)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
