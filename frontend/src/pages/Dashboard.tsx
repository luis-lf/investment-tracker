import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Select,
  Spin,
  Empty,
  Tag,
  Table,
  Button
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  GlobalOutlined,
  RiseOutlined,
  WalletOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Line, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import numeral from 'numeral';

import { dashboardService, investmentService, exchangeRateService } from '../services/investmentService';
import { Investment, InvestmentType } from '@shared/types';

const { Title, Text } = Typography;

// Type definitions for chart data
interface EvolutionDataPoint {
  date: string;
  totalBrl: number;
  totalUsd: number;
}

interface AllocationDataPoint {
  type: InvestmentType;
  valueBrl: number;
  valueUsd: number;
  count: number;
  percentage: number;
}

interface ChartDataPoint {
  date?: string;
  value: number;
  type: string | InvestmentType;
  percentage?: number;
}

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL'>('YTD');

  // Fetch dashboard summary
  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  // Fetch upcoming maturities
  const { data: maturitiesData, isLoading: _maturitiesLoading } = useQuery({
    queryKey: ['upcoming-maturities'],
    queryFn: () => investmentService.getUpcomingMaturities(60),
  });

  // Fetch portfolio evolution
  const { data: evolutionData, isLoading: evolutionLoading } = useQuery({
    queryKey: ['portfolio-evolution', selectedPeriod],
    queryFn: () => {
      const endDate = dayjs().format('YYYY-MM-DD');
      let startDate;
      
      switch (selectedPeriod) {
        case '1M':
          startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
          break;
        case '3M':
          startDate = dayjs().subtract(3, 'months').format('YYYY-MM-DD');
          break;
        case '6M':
          startDate = dayjs().subtract(6, 'months').format('YYYY-MM-DD');
          break;
        case 'YTD':
          startDate = dayjs().startOf('year').format('YYYY-MM-DD');
          break;
        case '1Y':
          startDate = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
          break;
        case 'ALL':
          startDate = '2015-01-01';
          break;
        default:
          startDate = dayjs().startOf('year').format('YYYY-MM-DD');
      }
      
      return dashboardService.getEvolution(startDate, endDate);
    },
  });

  // Fetch current exchange rate
  const { data: exchangeRateData, isLoading: _rateLoading } = useQuery({
    queryKey: ['exchange-rate-current'],
    queryFn: () => exchangeRateService.getCurrent(),
  });

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
    const prefix = currency === 'BRL' ? 'R$ ' : '$ ';
    return prefix + numeral(value).format('0,0.00');
  };

  const formatPercent = (value: number) => {
    const formatted = numeral(value).format('0.00');
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  if (summaryLoading || evolutionLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  const summary = summaryData?.data || {
    totalValueBrl: 0,
    totalValueUsd: 0,
    monthOverMonthChange: 0,
    monthOverMonthChangePercent: 0,
    ytdReturn: 0,
    ytdReturnPercent: 0,
    byCountry: {
      BR: { valueBrl: 0, valueUsd: 0, count: 0 },
      US: { valueBrl: 0, valueUsd: 0, count: 0 },
    },
    byType: [],
  };

  const upcomingMaturities = maturitiesData?.data || [];
  const currentRate = exchangeRateData?.data?.rate || 5.10;

  // Prepare chart data
  const evolutionChartData = evolutionData?.data?.map((item: EvolutionDataPoint) => ({
    date: dayjs(item.date).format('MMM/YY'),
    value: item.totalBrl,
    type: 'Total Portfolio'
  })) || [];

  const allocationChartData = summary.byType.map((item: AllocationDataPoint) => ({
    type: item.type,
    value: item.valueBrl,
    percentage: item.percentage
  }));

  const lineConfig = {
    data: evolutionChartData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    yAxis: {
      label: {
        formatter: (v: string) => formatCurrency(Number(v)),
      },
    },
    tooltip: {
      formatter: (datum: ChartDataPoint) => ({
        name: datum.type,
        value: formatCurrency(datum.value),
      }),
    },
  };

  const pieConfig = {
    data: allocationChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      formatter: (v: ChartDataPoint) => `${v.type}: ${v.percentage}%`,
    },
    interactions: [{ type: 'element-active' }],
    tooltip: {
      formatter: (datum: ChartDataPoint) => ({
        name: datum.type,
        value: formatCurrency(datum.value),
      }),
    },
  };

  const maturityColumns = [
    {
      title: 'Investment',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
    },
    {
      title: 'Maturity',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
      width: 100,
      render: (date: Date) => dayjs(date).format('DD/MM/YY'),
    },
    {
      title: 'Days',
      key: 'daysToMaturity',
      width: 80,
      render: (record: Investment) => {
        const days = dayjs(record.maturityDate).diff(dayjs(), 'day');
        return (
          <Tag color={days <= 30 ? 'red' : days <= 60 ? 'orange' : 'green'}>
            {days} days
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Title level={2}>Portfolio Dashboard</Title>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Space>
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 100 }}
              options={[
                { label: '1 Month', value: '1M' },
                { label: '3 Months', value: '3M' },
                { label: '6 Months', value: '6M' },
                { label: 'YTD', value: 'YTD' },
                { label: '1 Year', value: '1Y' },
                { label: 'All Time', value: 'ALL' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => refetchSummary()}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Portfolio (BRL)"
              value={summary.totalValueBrl}
              formatter={(value) => formatCurrency(Number(value), 'BRL')}
              prefix={<WalletOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type={summary.monthOverMonthChange >= 0 ? 'success' : 'danger'}>
                {summary.monthOverMonthChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {formatPercent(summary.monthOverMonthChangePercent)} vs last month
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Portfolio (USD)"
              value={summary.totalValueUsd}
              formatter={(value) => formatCurrency(Number(value), 'USD')}
              prefix={<DollarOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                Exchange Rate: R$ {currentRate.toFixed(2)}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="YTD Return"
              value={summary.ytdReturn}
              formatter={(value) => formatCurrency(Number(value), 'BRL')}
              prefix={<RiseOutlined />}
              valueStyle={{ color: summary.ytdReturn >= 0 ? '#3f8600' : '#cf1322' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type={summary.ytdReturnPercent >= 0 ? 'success' : 'danger'}>
                {formatPercent(summary.ytdReturnPercent)}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Investments"
              value={summary.byCountry.BR.count + summary.byCountry.US.count}
              prefix={<GlobalOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Space>
                <Text>BR: {summary.byCountry.BR.count}</Text>
                <Text>US: {summary.byCountry.US.count}</Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Country Breakdown */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Portfolio by Country">
            <Row gutter={16}>
              <Col span={12}>
                <Card type="inner" title={<><GlobalOutlined /> Brazil</>}>
                  <Statistic
                    value={summary.byCountry.BR.valueBrl}
                    formatter={(value) => formatCurrency(Number(value), 'BRL')}
                  />
                  <Text type="secondary">
                    {summary.byCountry.BR.count} investments
                  </Text>
                </Card>
              </Col>
              <Col span={12}>
                <Card type="inner" title={<><DollarOutlined /> USA</>}>
                  <Statistic
                    value={summary.byCountry.US.valueUsd}
                    formatter={(value) => formatCurrency(Number(value), 'USD')}
                  />
                  <Text type="secondary">
                    {summary.byCountry.US.count} investments
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Upcoming Maturities"
            extra={<CalendarOutlined />}
          >
            {upcomingMaturities.length > 0 ? (
              <Table
                dataSource={upcomingMaturities.slice(0, 5)}
                columns={maturityColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            ) : (
              <Empty description="No upcoming maturities in the next 60 days" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Portfolio Evolution">
            {evolutionChartData.length > 0 ? (
              <Line {...lineConfig} height={300} />
            ) : (
              <Empty description="No historical data available" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Asset Allocation">
            {allocationChartData.length > 0 ? (
              <Pie {...pieConfig} height={300} />
            ) : (
              <Empty description="No allocation data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Exchange Rate Scenarios */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Exchange Rate Scenarios">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Card type="inner" title="Optimistic (R$ 5.50)">
                  <Statistic
                    value={summary.totalValueBrl / 5.50}
                    formatter={(value) => formatCurrency(Number(value), 'USD')}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card type="inner" title={`Current (R$ ${currentRate.toFixed(2)})`}>
                  <Statistic
                    value={summary.totalValueUsd}
                    formatter={(value) => formatCurrency(Number(value), 'USD')}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card type="inner" title="Pessimistic (R$ 4.50)">
                  <Statistic
                    value={summary.totalValueBrl / 4.50}
                    formatter={(value) => formatCurrency(Number(value), 'USD')}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
