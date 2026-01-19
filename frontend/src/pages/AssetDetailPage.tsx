import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Server, 
  User, 
  Key, 
  FileText, 
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import AssetForm from '@/components/AssetForm';
import { useAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/useAssets';
import type { HardwareAsset, UpdateAssetInput } from '@/types';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch asset data
  const { data: asset, isLoading, error } = useAsset(id!);
  
  // Mutations
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const handleEdit = async (data: Omit<UpdateAssetInput, 'id'>) => {
    if (!asset) return;
    
    try {
      await updateAsset.mutateAsync({ id: asset.id, ...data });
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    
    try {
      await deleteAsset.mutateAsync(asset.id);
      navigate('/assets');
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">{t(`status.${status}`)}</Badge>;
      case 'SPARE':
        return <Badge variant="info">{t(`status.${status}`)}</Badge>;
      case 'DEFECT':
        return <Badge variant="danger">{t(`status.${status}`)}</Badge>;
      case 'RETIRED':
        return <Badge variant="default">{t(`status.${status}`)}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          {error ? `Error loading asset: ${(error as any).message}` : 'Asset not found'}
        </p>
        <Link to="/assets" className="text-red-600 hover:text-red-800 mt-2 inline-block">
          {t('assets.backToAssets')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/assets"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('assets.backToAssets')}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {asset.hostname || asset.serialNumber}
            </h1>
            <p className="text-gray-600">
              {asset.model?.manufacturer} {asset.model?.modelName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('assets.editAsset')}
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('assets.deleteAsset')}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader title={t('assets.basicInfo')} />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.serialNumber')}
                </label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {asset.serialNumber}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.assetTag')}
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {asset.assetTag || '-'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.hostname')}
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {asset.hostname || '-'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.status')}
                </label>
                <div className="mt-1">
                  {getStatusBadge(asset.status)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.model')}
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {asset.model?.modelName} ({asset.model?.modelType})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.owner')}
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {asset.owner || '-'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.location')}
                </label>
                <div className="mt-1 flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">
                    {asset.location || '-'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.rackPosition')}
                </label>
                <div className="mt-1 flex items-center">
                  <Server className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-900">
                    {asset.rackPosition || '-'}
                  </span>
                </div>
              </div>
            </div>
            
            {asset.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('assets.notes')}
                </label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {asset.notes}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Purchase Information */}
          <Card>
            <CardHeader title="Purchase Information" />
            <div className="space-y-3">
              {asset.purchaseDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('assets.purchaseDate')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(asset.purchaseDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              
              {asset.purchasePrice && (
                <div className="flex items-center">
                  <div className="h-4 w-4 text-gray-400 mr-3 flex items-center justify-center text-xs font-semibold">
                    kr
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('assets.purchasePrice')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {asset.purchasePrice.toLocaleString()} kr
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader title="Sync Status" />
            <div className="space-y-3">
              {asset.lastSyncAt && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('assets.lastSync')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(asset.lastSyncAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Associated Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Associated Licenses */}
        <Card>
          <CardHeader 
            title={t('assets.associatedLicenses')} 
            subtitle={`${asset.licenses?.length || 0} licenses`}
          />
          <div className="space-y-3">
            {asset.licenses && asset.licenses.length > 0 ? (
              asset.licenses.map((mapping) => (
                <div 
                  key={mapping.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Key className="h-4 w-4 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {mapping.license?.softwareProduct}
                      </p>
                      <p className="text-xs text-gray-600">
                        {mapping.license?.licenseType}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {t('assets.noLicenses')}
              </p>
            )}
          </div>
        </Card>

        {/* Associated Contracts */}
        <Card>
          <CardHeader 
            title={t('assets.associatedContracts')} 
            subtitle={`${asset.contracts?.length || 0} contracts`}
          />
          <div className="space-y-3">
            {asset.contracts && asset.contracts.length > 0 ? (
              asset.contracts.map((mapping: any) => (
                <Link
                  key={mapping.id}
                  to={`/contracts?search=${encodeURIComponent(mapping.contract?.contractNumber || '')}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {mapping.contract?.contractNumber}
                        </p>
                        <p className="text-xs text-gray-600">
                          {mapping.contract?.contractType}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="mt-2 ml-7 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Periode:</span>
                      <span className="ml-1 text-gray-700">
                        {mapping.coverageStart ? format(new Date(mapping.coverageStart), 'dd.MM.yyyy') : '-'}
                        {' - '}
                        {mapping.coverageEnd ? format(new Date(mapping.coverageEnd), 'dd.MM.yyyy') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Årskostnad:</span>
                      <span className="ml-1 text-gray-700 font-medium">
                        {mapping.assetCost ? `${Number(mapping.assetCost).toLocaleString('nb-NO')} kr` : '-'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {t('assets.noContracts')}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  No support coverage
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('assets.editAsset')}
        size="lg"
      >
        <AssetForm
          asset={asset}
          onSubmit={handleEdit}
          onCancel={() => setShowEditModal(false)}
          isLoading={updateAsset.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('assets.deleteAsset')}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this asset? This action cannot be undone.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                <strong>{asset.hostname || asset.serialNumber}</strong> will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={deleteAsset.isPending}
            >
              {deleteAsset.isPending ? 'Deleting...' : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}