import React, { useState } from 'react';
import { Text, makeStyles, Button, Badge } from '@fluentui/react-components';
import {
  DataFunnel24Regular,
  People24Regular,
  Money24Regular,
  ArrowDownload24Regular,
  DocumentPdf24Regular,
  Calendar24Regular,
  Target24Regular,
} from '@fluentui/react-icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ServiceRequest } from '../../types/ServiceRequest';
import {
  ReportType,
  DateRangePreset,
  DATE_RANGE_LABELS,
  REPORT_TYPE_LABELS,
  PipelineReportData,
  AMPerformanceReportData,
  RevenueReportData,
} from '../../types/Report';
import { reportingService } from '../../services/ReportingService';
import { DW_COLORS } from '../../utils/buttonStyles';
import { generateReportPdf } from '../../utils/reportPdfGenerator';
import {
  downloadPipelineReportExcel,
  downloadAMPerformanceReportExcel,
  downloadRevenueReportExcel,
} from '../../utils/excelExport';
import { useAuth } from '../../contexts/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name?: any, props?: any) => any;

const STAGE_COLORS: Record<string, string> = {
  Lead: '#3b82f6',
  Qualified: '#8b5cf6',
  Discovery: '#f59e0b',
  Proposal: '#10b981',
  Negotiation: '#f97316',
  Won: '#16a34a',
  Lost: '#ef4444',
};

const INDUSTRY_COLORS = [
  '#1a5a8a',
  '#1e6b7b',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
];

const useStyles = makeStyles({
  // Report type selector cards
  selectorRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  selectorCard: {
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,.15)',
    },
  },
  selectorIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
    background: `linear-gradient(135deg, ${DW_COLORS.primary} 0%, ${DW_COLORS.teal} 100%)`,
  },
  selectorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  selectorTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
  },
  selectorDescription: {
    fontSize: '12px',
    color: '#616161',
    lineHeight: '1.4',
  },

  // Date range pills row
  dateRangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  customDateInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '8px',
  },

  // Action row
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },

  // KPI rows
  kpiRow5: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 500px)': {
      gridTemplateColumns: '1fr',
    },
  },
  kpiRow4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 1000px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  iconTeal: {
    background: 'linear-gradient(135deg, #1e6b7b 0%, #154f5c 100%)',
  },
  iconGreen: {
    background: 'linear-gradient(135deg, #107c10 0%, #0b5c0b 100%)',
  },
  iconOrange: {
    background: 'linear-gradient(135deg, #f7630c 0%, #ca5010 100%)',
  },
  iconPurple: {
    background: 'linear-gradient(135deg, #8764b8 0%, #5c4d7d 100%)',
  },
  iconBlue: {
    background: 'linear-gradient(135deg, #1a5a8a 0%, #0d3a5c 100%)',
  },
  iconRed: {
    background: 'linear-gradient(135deg, #d13438 0%, #a4262c 100%)',
  },
  metricContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
    lineHeight: '1',
  },
  metricSub: {
    fontSize: '12px',
    color: '#616161',
    marginTop: '2px',
  },

  // Charts row
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    borderTop: '1px solid #d0d0d0',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '16px',
  },

  // Table section
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    borderTop: '1px solid #d0d0d0',
    marginBottom: '24px',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  // Pipeline top deals: 7 columns
  topDealsRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 1fr 120px 100px 80px 80px',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  // AM leaderboard: 10 columns
  leaderboardRow: {
    display: 'grid',
    gridTemplateColumns: '50px 1fr 60px 60px 60px 80px 100px 100px 80px',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px',
    color: '#616161',
  },

  // Report date range label
  reportMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    padding: '12px 16px',
    backgroundColor: '#f5f8fa',
    borderRadius: '8px',
    borderLeft: `4px solid ${DW_COLORS.primary}`,
  },
});

const formatZAR = (value: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(value);
};

const getWinRateColor = (rate: number): string => {
  if (rate >= 50) return '#107c10';
  if (rate >= 30) return '#f7630c';
  return '#d13438';
};

interface ReportsTabProps {
  requests: ServiceRequest[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ requests }) => {
  const styles = useStyles();
  const { user } = useAuth();

  const [selectedReport, setSelectedReport] = useState<ReportType>('pipeline');
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('last-12-months');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<PipelineReportData | AMPerformanceReportData | RevenueReportData | null>(null);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  const reportTypeIcons: Record<ReportType, React.ReactElement> = {
    pipeline: <DataFunnel24Regular />,
    'am-performance': <People24Regular />,
    revenue: <Money24Regular />,
  };

  const handleSelectReport = (type: ReportType) => {
    setSelectedReport(type);
    setReportData(null);
    setIsGenerated(false);
  };

  const handleSelectPreset = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    setReportData(null);
    setIsGenerated(false);
  };

  const generateReport = () => {
    const range = reportingService.getDateRange(
      selectedPreset,
      selectedPreset === 'custom' ? new Date(customStartDate) : undefined,
      selectedPreset === 'custom' ? new Date(customEndDate) : undefined
    );

    let data;
    switch (selectedReport) {
      case 'pipeline':
        data = reportingService.generatePipelineReport(requests, range, user?.displayName || 'Manager');
        break;
      case 'am-performance':
        data = reportingService.generateAMReport(requests, range, user?.displayName || 'Manager');
        break;
      case 'revenue':
        data = reportingService.generateRevenueReport(requests, range, user?.displayName || 'Manager');
        break;
    }
    setReportData(data);
    setIsGenerated(true);
  };

  const handlePdfExport = () => {
    if (!reportData) return;
    generateReportPdf(reportData);
  };

  const handleExcelExport = () => {
    if (!reportData) return;
    switch (selectedReport) {
      case 'pipeline':
        downloadPipelineReportExcel(reportData as PipelineReportData);
        break;
      case 'am-performance':
        downloadAMPerformanceReportExcel(reportData as AMPerformanceReportData);
        break;
      case 'revenue':
        downloadRevenueReportExcel(reportData as RevenueReportData);
        break;
    }
  };

  // ─── Render: Report Type Selector Cards ────────────────────────
  const renderReportSelector = () => (
    <div className={styles.selectorRow}>
      {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((type) => {
        const isSelected = selectedReport === type;
        return (
          <div
            key={type}
            className={styles.selectorCard}
            style={{
              border: isSelected ? `2px solid ${DW_COLORS.primary}` : '1px solid #e0e0e0',
              backgroundColor: isSelected ? 'rgba(26, 90, 138, 0.05)' : 'white',
            }}
            onClick={() => handleSelectReport(type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectReport(type); }}
          >
            <div className={styles.selectorIcon}>
              {reportTypeIcons[type]}
            </div>
            <div className={styles.selectorContent}>
              <span className={styles.selectorTitle}>{REPORT_TYPE_LABELS[type].title}</span>
              <span className={styles.selectorDescription}>{REPORT_TYPE_LABELS[type].description}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── Render: Date Range Pills ──────────────────────────────────
  const renderDateRangePills = () => (
    <div className={styles.dateRangeRow}>
      {(Object.keys(DATE_RANGE_LABELS) as DateRangePreset[]).map((preset) => {
        const isActive = selectedPreset === preset;
        return (
          <div
            key={preset}
            role="button"
            tabIndex={0}
            onClick={() => handleSelectPreset(preset)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPreset(preset); }}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: isActive ? DW_COLORS.primary : '#f0f0f0',
              color: isActive ? 'white' : '#424242',
              transition: 'all 0.2s ease',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {DATE_RANGE_LABELS[preset]}
          </div>
        );
      })}
      {selectedPreset === 'custom' && (
        <div className={styles.customDateInputs}>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #d0d0d0',
              fontSize: '13px',
              color: '#242424',
            }}
          />
          <span style={{ color: '#616161', fontSize: '13px' }}>to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #d0d0d0',
              fontSize: '13px',
              color: '#242424',
            }}
          />
        </div>
      )}
    </div>
  );

  // ─── Render: Action Row ────────────────────────────────────────
  const renderActionRow = () => (
    <div className={styles.actionRow}>
      <Button
        appearance="primary"
        icon={<Target24Regular />}
        onClick={generateReport}
        style={{ backgroundColor: DW_COLORS.primary }}
      >
        Generate Report
      </Button>
      <Button
        appearance="subtle"
        icon={<DocumentPdf24Regular />}
        disabled={!isGenerated}
        onClick={handlePdfExport}
      >
        PDF
      </Button>
      <Button
        appearance="subtle"
        icon={<ArrowDownload24Regular />}
        disabled={!isGenerated}
        onClick={handleExcelExport}
      >
        Excel
      </Button>
    </div>
  );

  // ─── Render: Report Meta Banner ────────────────────────────────
  const renderReportMeta = () => {
    if (!reportData) return null;
    return (
      <div className={styles.reportMeta}>
        <Calendar24Regular style={{ color: DW_COLORS.primary }} />
        <Text style={{ fontSize: '13px', color: '#424242' }}>
          <strong>{REPORT_TYPE_LABELS[selectedReport].title}</strong> &middot; {reportData.config.dateRange.label} &middot; Generated by {reportData.config.generatedBy}
        </Text>
      </div>
    );
  };

  // ─── Render: Pipeline Report ───────────────────────────────────
  const renderPipelineReport = () => {
    const data = reportData as PipelineReportData;
    if (!data) return null;

    return (
      <div>
        {renderReportMeta()}

        {/* KPI Row (5 cards) */}
        <div className={styles.kpiRow5}>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconTeal}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Total Pipeline</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.totalPipeline)}</Text>
              <Text className={styles.metricSub}>All active deals</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconBlue}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Weighted Pipeline</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.weightedPipeline)}</Text>
              <Text className={styles.metricSub}>Probability-adjusted</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconGreen}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Avg Deal Size</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.avgDealSize)}</Text>
              <Text className={styles.metricSub}>Average value</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconOrange}`}>
              <DataFunnel24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Hot Leads</Text>
              <Text className={styles.metricValue}>{data.overview.hotLeads}</Text>
              <Text className={styles.metricSub}>High interest</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
              <Target24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Open Deals</Text>
              <Text className={styles.metricValue}>{data.overview.openDeals}</Text>
              <Text className={styles.metricSub}>In pipeline</Text>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Stage Breakdown + Conversion Rates */}
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Stage Breakdown</Text>
            {data.stageBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.stageBreakdown} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip
                    formatter={((value: number, name: string) => [
                      name === 'count' ? `${value} deal${value !== 1 ? 's' : ''}` : formatZAR(value),
                      name === 'count' ? 'Deals' : 'Value',
                    ]) as TooltipFormatter}
                  />
                  <Bar dataKey="count" name="Deals" radius={[4, 4, 0, 0]}>
                    {data.stageBreakdown.map((entry, index) => (
                      <Cell key={index} fill={STAGE_COLORS[entry.stage] || '#616161'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No stage data available</Text>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Conversion Rates</Text>
            {data.conversionRates.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.conversionRates.map(cr => ({
                    name: `${cr.from} \u2192 ${cr.to}`,
                    rate: cr.rate,
                  }))}
                  layout="vertical"
                  margin={{ left: 100, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    formatter={((value: number) => `${value.toFixed(1)}%`) as TooltipFormatter}
                  />
                  <Bar dataKey="rate" name="Conversion Rate" radius={[0, 4, 4, 0]}>
                    {data.conversionRates.map((_entry, index) => {
                      const rate = data.conversionRates[index].rate;
                      return <Cell key={index} fill={getWinRateColor(rate)} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No conversion data available</Text>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2: Deal Aging + Forecast */}
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Deal Aging (Avg Days in Stage)</Text>
            {data.dealAging.filter(d => d.dealCount > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dealAging.filter(d => d.dealCount > 0)} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip
                    formatter={((value: number) => [`${value} days`, 'Avg Days']) as TooltipFormatter}
                  />
                  <Bar dataKey="avgDays" name="Avg Days" fill={DW_COLORS.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No aging data available</Text>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>3-Month Forecast</Text>
            {data.forecast.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.forecast} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatZAR(v)} />
                  <Tooltip
                    formatter={((value: number, name: string) => [
                      formatZAR(value),
                      name,
                    ]) as TooltipFormatter}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="expected" name="Expected" stroke={DW_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="weighted" name="Weighted" stroke={DW_COLORS.teal} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No forecast data available</Text>
              </div>
            )}
          </div>
        </div>

        {/* Top Deals Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <Text className={styles.chartTitle} style={{ marginBottom: 0 }}>Top Deals</Text>
          </div>
          {data.topDeals.length > 0 ? (
            <>
              {/* Header Row */}
              <div className={styles.topDealsRow} style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e1e1e1' }}>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stage</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prob.</Text>
              </div>
              {/* Data Rows */}
              {data.topDeals.map((deal, index) => (
                <div key={deal.id} className={styles.topDealsRow}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: DW_COLORS.teal,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {index + 1}
                  </div>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>{deal.client}</Text>
                  <Text style={{ fontSize: '13px', color: '#424242' }}>{deal.service}</Text>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>{formatZAR(deal.value)}</Text>
                  <Badge
                    appearance="filled"
                    style={{ backgroundColor: STAGE_COLORS[deal.stage] || '#616161' }}
                  >
                    {deal.stage}
                  </Badge>
                  <Text style={{ fontSize: '13px', color: '#616161' }}>{deal.daysInPipeline}d</Text>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: getWinRateColor(deal.probability) }}>{deal.probability}%</Text>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.emptyState}>
              <Text>No deals to display.</Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render: AM Performance Report ─────────────────────────────
  const renderAMPerformanceReport = () => {
    const data = reportData as AMPerformanceReportData;
    if (!data) return null;

    return (
      <div>
        {renderReportMeta()}

        {/* KPI Row (4 cards) */}
        <div className={styles.kpiRow4}>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconBlue}`}>
              <People24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Active AMs</Text>
              <Text className={styles.metricValue}>{data.summary.totalAMs}</Text>
              <Text className={styles.metricSub}>Account managers</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconGreen}`}>
              <Target24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Avg Win Rate</Text>
              <Text className={styles.metricValue}>{data.summary.avgWinRate}%</Text>
              <Text className={styles.metricSub}>Across all AMs</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconTeal}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Total Revenue</Text>
              <Text className={styles.metricValue}>{formatZAR(data.summary.totalRevenue)}</Text>
              <Text className={styles.metricSub}>Won deals</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconOrange}`}>
              <Calendar24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Avg Cycle Time</Text>
              <Text className={styles.metricValue}>{data.summary.avgCycleTime} days</Text>
              <Text className={styles.metricSub}>Created to won</Text>
            </div>
          </div>
        </div>

        {/* Charts Row: Win Rate by AM + Revenue by AM */}
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Win Rate by Account Manager</Text>
            {data.winRateByAM.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.winRateByAM} margin={{ left: 10, right: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={((value: number) => `${value.toFixed(1)}%`) as TooltipFormatter}
                  />
                  <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                    {data.winRateByAM.map((entry, index) => (
                      <Cell key={index} fill={getWinRateColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No AM data available</Text>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Revenue by Account Manager</Text>
            {data.revenueByAM.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.revenueByAM} margin={{ left: 10, right: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickFormatter={(v) => formatZAR(v)} />
                  <Tooltip
                    formatter={((value: number) => formatZAR(value)) as TooltipFormatter}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill={DW_COLORS.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No revenue data available</Text>
              </div>
            )}
          </div>
        </div>

        {/* Activity Trend (full width) */}
        <div className={styles.chartCard} style={{ marginBottom: '24px' }}>
          <Text className={styles.chartTitle}>Activity Trend</Text>
          {data.activityTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.activityTrend} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  formatter={((value: number, name: string) => [
                    `${value} deal${value !== 1 ? 's' : ''}`,
                    name,
                  ]) as TooltipFormatter}
                />
                <Legend />
                <Line type="monotone" dataKey="created" name="Created" stroke={DW_COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="won" name="Won" stroke={DW_COLORS.success} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="lost" name="Lost" stroke={DW_COLORS.danger} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No trend data available</Text>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <Text className={styles.chartTitle} style={{ marginBottom: 0 }}>Leaderboard</Text>
          </div>
          {data.leaderboard.length > 0 ? (
            <>
              {/* Header Row */}
              <div className={styles.leaderboardRow} style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e1e1e1' }}>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deals</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Won</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lost</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Rate</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Deal</Text>
                <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Cycle</Text>
              </div>
              {/* Data Rows */}
              {data.leaderboard.map((am) => (
                <div key={am.email} className={styles.leaderboardRow}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: am.rank <= 3 ? DW_COLORS.teal : '#e0e0e0',
                    color: am.rank <= 3 ? 'white' : '#424242',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {am.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#242424' }}>{am.name}</div>
                    <div style={{ fontSize: '11px', color: '#616161' }}>{am.email}</div>
                  </div>
                  <Text style={{ fontSize: '13px', color: '#242424' }}>{am.totalDeals}</Text>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: DW_COLORS.success }}>{am.wonDeals}</Text>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: DW_COLORS.danger }}>{am.lostDeals}</Text>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: getWinRateColor(am.winRate) }}>{am.winRate}%</Text>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>{formatZAR(am.totalRevenue)}</Text>
                  <Text style={{ fontSize: '13px', color: '#424242' }}>{formatZAR(am.avgDealSize)}</Text>
                  <Text style={{ fontSize: '13px', color: '#616161' }}>{am.avgCycleDays}d</Text>
                </div>
              ))}
            </>
          ) : (
            <div className={styles.emptyState}>
              <Text>No account manager data available.</Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render: Revenue Report ────────────────────────────────────
  const renderRevenueReport = () => {
    const data = reportData as RevenueReportData;
    if (!data) return null;

    return (
      <div>
        {renderReportMeta()}

        {/* KPI Row (5 cards) */}
        <div className={styles.kpiRow5}>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconGreen}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Total Won Revenue</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.totalWonRevenue)}</Text>
              <Text className={styles.metricSub}>Closed-won deals</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconTeal}`}>
              <DataFunnel24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Active Pipeline</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.activePipeline)}</Text>
              <Text className={styles.metricSub}>Open deals</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconBlue}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Avg Deal Size</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.avgDealSize)}</Text>
              <Text className={styles.metricSub}>Won deals avg</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconOrange}`}>
              <Target24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Win Rate</Text>
              <Text className={styles.metricValue}>{data.overview.winRate.toFixed(1)}%</Text>
              <Text className={styles.metricSub}>Overall conversion</Text>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
              <Money24Regular />
            </div>
            <div className={styles.metricContent}>
              <Text className={styles.metricLabel}>Forecasted Revenue</Text>
              <Text className={styles.metricValue}>{formatZAR(data.overview.forecastedRevenue)}</Text>
              <Text className={styles.metricSub}>Projected</Text>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Revenue by Service + Revenue by Industry */}
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Revenue by Service</Text>
            {data.revenueByService.filter(s => s.revenue > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={data.revenueByService.filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue)}
                  margin={{ left: 10, right: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="service"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickFormatter={(v) => formatZAR(v)} />
                  <Tooltip
                    formatter={((value: number) => formatZAR(value)) as TooltipFormatter}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill={DW_COLORS.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No service revenue data</Text>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Revenue by Industry</Text>
            {data.revenueByIndustry.filter(i => i.revenue > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data={data.revenueByIndustry.filter(i => i.revenue > 0) as any[]}
                    dataKey="revenue"
                    nameKey="industry"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine
                  >
                    {data.revenueByIndustry.filter(i => i.revenue > 0).map((_entry, index) => (
                      <Cell key={index} fill={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={((value: number) => formatZAR(value)) as TooltipFormatter}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No industry revenue data</Text>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2: Monthly Revenue Trends + Deal Size Distribution */}
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Monthly Revenue Trends</Text>
            {data.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthlyTrends} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatZAR(v)} />
                  <Tooltip
                    formatter={((value: number) => formatZAR(value)) as TooltipFormatter}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={DW_COLORS.success} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No trend data available</Text>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <Text className={styles.chartTitle}>Deal Size Distribution</Text>
            {data.dealSizeDistribution.filter(d => d.wonCount + d.lostCount > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dealSizeDistribution} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip
                    formatter={((value: number, name: string) => [
                      `${value} deal${value !== 1 ? 's' : ''}`,
                      name,
                    ]) as TooltipFormatter}
                  />
                  <Legend />
                  <Bar dataKey="wonCount" name="Won" stackId="deals" fill={DW_COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lostCount" name="Lost" stackId="deals" fill={DW_COLORS.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
                <Text style={{ fontStyle: 'italic' }}>No deal size data available</Text>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Report Content (conditional) ──────────────────────
  const renderReportContent = () => {
    if (!isGenerated || !reportData) {
      return (
        <div className={styles.emptyState}>
          <DataFunnel24Regular style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#a0a0a0' }} />
          <Text style={{ fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
            Select a report type and date range, then click Generate Report
          </Text>
          <Text style={{ fontSize: '14px', color: '#616161' }}>
            Reports are generated from your pipeline data and can be exported to PDF or Excel.
          </Text>
        </div>
      );
    }

    switch (selectedReport) {
      case 'pipeline':
        return renderPipelineReport();
      case 'am-performance':
        return renderAMPerformanceReport();
      case 'revenue':
        return renderRevenueReport();
      default:
        return null;
    }
  };

  return (
    <div>
      {renderReportSelector()}
      {renderDateRangePills()}
      {renderActionRow()}
      {renderReportContent()}
    </div>
  );
};
