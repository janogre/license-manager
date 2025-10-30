import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Loader2,
  Users,
  PieChart,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Form';
import { 
  useInstallBaseReport, 
  useCoverageGapReport, 
  useCostAnalysisReport,
  useExportReport 
} from '@/hooks/useReports';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState<'install-base' | 'coverage-gap' | 'cost-analysis'>('install-base');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Report data hooks
  const installBaseQuery = useInstallBaseReport();
  const coverageGapQuery = useCoverageGapReport();
  const costAnalysisQuery = useCostAnalysisReport(selectedYear);
  const exportMutation = useExportReport();

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    let data: any[] = [];
    let reportType = '';

    switch (activeReport) {
      case 'install-base':
        data = installBaseQuery.data || [];
        reportType = 'install-base-report';
        break;
      case 'coverage-gap':
        data = coverageGapQuery.data?.report || [];
        reportType = 'coverage-gap-report';
        break;
      case 'cost-analysis':
        data = [
          ...(costAnalysisQuery.data?.contracts || []),
          ...(costAnalysisQuery.data?.licenses || [])
        ];
        reportType = 'cost-analysis-report';
        break;
    }

    try {
      await exportMutation.mutateAsync({ reportType, format, data });
    } catch (error) {
      console.error('Export failed:', error);
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

  const reportTabs = [
    {
      id: 'install-base' as const,
      title: t('reports.installBase.title'),
      icon: Users,
      description: t('reports.installBase.description'),
    },
    {
      id: 'coverage-gap' as const,
      title: t('reports.coverageGap.title'),
      icon: AlertTriangle,
      description: t('reports.coverageGap.description'),
    },
    {
      id: 'cost-analysis' as const,
      title: t('reports.costAnalysis.title'),
      icon: DollarSign,
      description: t('reports.costAnalysis.description'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600 mt-1">
            Generate and export comprehensive reports for your asset portfolio
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-32"
            options={Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return {
                value: year.toString(),
                label: year.toString()
              };
            })}
          />
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={exportMutation.isPending}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('reports.export.csv')}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={true} // Not implemented yet
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('reports.export.excel')}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeReport === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {activeReport === 'install-base' && (
          <InstallBaseReportContent 
            data={installBaseQuery.data} 
            isLoading={installBaseQuery.isLoading}
            error={installBaseQuery.error}
          />
        )}
        
        {activeReport === 'coverage-gap' && (
          <CoverageGapReportContent 
            data={coverageGapQuery.data}
            isLoading={coverageGapQuery.isLoading}
            error={coverageGapQuery.error}
          />
        )}
        
        {activeReport === 'cost-analysis' && (
          <CostAnalysisReportContent 
            data={costAnalysisQuery.data}
            isLoading={costAnalysisQuery.isLoading}
            error={costAnalysisQuery.error}
            year={selectedYear}
          />
        )}
      </div>
    </div>
  );
}

// Install Base Report Component
function InstallBaseReportContent({ data, isLoading, error }: { 
  data: any[] | undefined, 
  isLoading: boolean, 
  error: any 
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading report: {error.message}</p>
      </div>
    );
  }

  const summary = data ? {
    total: data.length,
    withContracts: data.filter(item => item.hasActiveContract).length,
    withoutContracts: data.filter(item => !item.hasActiveContract).length,
  } : { total: 0, withContracts: 0, withoutContracts: 0 };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.installBase.totalAssets')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.installBase.withContracts')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.withContracts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.installBase.withoutContracts')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.withoutContracts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader title="Install Base Details" />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Coverage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.hostname || item.serialNumber}
                      </div>
                      <div className="text-sm text-gray-500">SN: {item.serialNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.model}</div>
                    <div className="text-sm text-gray-500">{item.modelType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.hasActiveContract ? (
                      <Badge variant="success">
                        {item.contractCount} contract(s)
                      </Badge>
                    ) : (
                      <Badge variant="danger">No coverage</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Coverage Gap Report Component
function CoverageGapReportContent({ data, isLoading, error }: { 
  data: any | undefined, 
  isLoading: boolean, 
  error: any 
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading report: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Assets Without Coverage
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data?.summary?.totalAssets || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.coverageGap.riskExposure')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data?.summary?.totalValue?.toLocaleString() || 0} kr
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader title="Assets Without Coverage" />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.report?.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.hostname || item.serialNumber}
                      </div>
                      <div className="text-sm text-gray-500">SN: {item.serialNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.model}</div>
                    <div className="text-sm text-gray-500">{item.modelType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.purchasePrice ? `${item.purchasePrice.toLocaleString()} kr` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={item.status === 'ACTIVE' ? 'danger' : 'default'}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Cost Analysis Report Component
function CostAnalysisReportContent({ data, isLoading, error, year }: { 
  data: any | undefined, 
  isLoading: boolean, 
  error: any,
  year: string
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading report: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.costAnalysis.contractCosts')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data?.summary?.totalContractCost?.toLocaleString() || 0} kr
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.costAnalysis.licenseCosts')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data?.summary?.totalLicenseCost?.toLocaleString() || 0} kr
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('reports.costAnalysis.totalAnnualCost')}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data?.summary?.totalCost?.toLocaleString() || 0} kr
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader title="Contract Costs" />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assets
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.contracts?.map((contract: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.contractNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.contractType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.annualCost ? `${contract.annualCost.toLocaleString()} kr` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.assetCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Licenses Table */}
      <Card>
        <CardHeader title="License Costs" />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Software Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.licenses?.map((license: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {license.softwareProduct}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {license.licenseType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {license.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {license.cost ? `${license.cost.toLocaleString()} kr` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {license.expiryDate ? format(new Date(license.expiryDate), 'MMM d, yyyy') : 'No expiry'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}