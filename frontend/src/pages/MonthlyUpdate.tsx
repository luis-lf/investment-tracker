import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  InputNumber,
  DatePicker,
  message,
  Typography,
  Row,
  Col,
  Tag,
  Statistic,
  Alert,
  Tabs,
  Badge,
  Modal,
  Tooltip,
  Progress
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  GlobalOutlined,
  DollarOutlined,
  CheckOutlined,
  WarningOutlined,
  ExportOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import numeral from 'numeral';

import { investmentService, snapshotService, exchangeRateService } from '../services/investmentService';
import { Investment, InvestmentStatus, Country, PortfolioSnapshot } from '@shared/types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface EditableInvestment extends Investment {
  currentValue?: number;
  previousValue?: number;
  isEditing?: boolean;
  hasChanged?: boolean;
}

const MonthlyUpdate: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf('month'));
  const [editableData, setEditableData] = useState<EditableInvestment[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(5.10);
  const [activeTab, setActiveTab] = useState<'BR' | 'US'>('BR');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);

  const queryClient = useQueryClient();

  // Fetch active investments
  const { data: investmentsData, isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments-active'],
    queryFn: () => investmentService.getAll({ status: InvestmentStatus.ACTIVE }),
  });

  // Fetch current exchange rate
  const { data: exchangeRateData } = useQuery({
    queryKey: ['exchange-rate-current'],
    queryFn: () => exchangeRateService.getCurrent(),
  });

  // Fetch snapshots for the selected month
  const { data: snapshotsData, isLoading: snapshotsLoading, refetch: refetchSnapshots } = useQuery({
    queryKey: ['snapshots', selectedMonth.format('YYYY-MM')],
    queryFn: () => snapshotService.getMonthlySnapshot(selectedMonth.format('YYYY-MM-DD')),
    enabled: !!selectedMonth,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: { month: Date; updates: Array<{ investmentId: number; value: number; status?: InvestmentStatus }> }) =>
      snapshotService.bulkUpdate(data.month, data.updates),
    onSuccess: () => {
      message.success('Monthly update saved successfully');
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      refetchSnapshots();
    },
    onError: () => {
      message.error('Failed to save monthly update');
    }
  });

  // Update exchange rate mutation
  const updateExchangeRateMutation = useMutation({
    mutationFn: (data: { date: Date; rate: number }) =>
      exchangeRateService.update(data.date, data.rate),
    onSuccess: () => {
      message.success('Exchange rate updated');
      queryClient.invalidateQueries({ queryKey: ['exchange-rate'] });
    }
  });

  useEffect(() => {
    if (investmentsData?.data) {
      const investments = investmentsData.data.map(inv => ({
        ...inv,
        currentValue: 0,
        previousValue: 0,
        isEditing: false,
        hasChanged: false,
      }));
      
      // Load snapshot values if available
      if (snapshotsData?.data) {
        snapshotsData.data.forEach((snapshot: PortfolioSnapshot) => {
          const inv = investments.find(i => i.id === snapshot.investmentId);
          if (inv) {
            inv.currentValue = snapshot.valueOriginal;
            inv.previousValue = snapshot.valueOriginal;
          }
        });
      }
      
      setEditableData(investments);
    }
  }, [investmentsData, snapshotsData]);

  useEffect(() => {
    if (exchangeRateData?.data?.rate) {
      setExchangeRate(exchangeRateData.data.rate);
    }
  }, [exchangeRateData]);

  const formatCurrency = (value: number | undefined, currency: 'BRL' | 'USD' = 'BRL') => {
    if (!value) return '-';
    const prefix = currency === 'BRL' ? 'R$ ' : '$ ';
    return prefix + numeral(value).format('0,0.00');
  };

  const handleValueChange = (id: number, value: number | null) => {
    setEditableData(prev => prev.map(item => {
      if (item.id === id) {
        const hasChanged = value !== item.previousValue;
        return { ...item, currentValue: value || 0, hasChanged };
      }
      return item;
    }));
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (id: number, status: InvestmentStatus) => {
    setEditableData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status, hasChanged: true };
      }
      return item;
    }));
    setHasUnsavedChanges(true);
  };

  const handleCopyFromPrevious = () => {
    Modal.confirm({
      title: 'Copy from Previous Month',
      content: 'This will copy all values from the previous month. Any changes you\'ve made will be lost. Continue?',
      onOk: () => {
        // In a real implementation, fetch previous month's snapshots
        message.info('Feature coming soon: Copy from previous month');
      }
    });
  };

  const handleSave = async () => {
    const updates = editableData
      .filter(item => item.hasChanged && item.id !== undefined)
      .map(item => ({
        investmentId: item.id as number,
        value: item.currentValue || 0,
        status: item.status
      }));

    if (updates.length === 0) {
      message.warning('No changes to save');
      return;
    }

    setSavingProgress(0);
    const progressInterval = setInterval(() => {
      setSavingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    await saveMutation.mutateAsync({
      month: selectedMonth.toDate(),
      updates
    });

    setSavingProgress(100);
    setTimeout(() => setSavingProgress(0), 1000);
  };

  const handleUpdateExchangeRate = () => {
    Modal.confirm({
      title: 'Update Exchange Rate',
      content: (
        <div>
          <p>Current rate: R$ {exchangeRate.toFixed(2)}</p>
          <InputNumber
            defaultValue={exchangeRate}
            precision={2}
            min={0}
            onChange={(value) => setExchangeRate(value || 5.10)}
            style={{ width: '100%' }}
          />
        </div>
      ),
      onOk: () => {
        updateExchangeRateMutation.mutate({
          date: selectedMonth.toDate(),
          rate: exchangeRate
        });
      }
    });
  };

  const columns: ColumnsType<EditableInvestment> = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      fixed: 'left',
      width: 250,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.codigo && <Text type="secondary" style={{ fontSize: 12 }}>{record.codigo}</Text>}
        </Space>
      ),
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      width: 100,
      render: (account: string) => <Tag>{account}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Previous Value',
      key: 'previousValue',
      width: 150,
      align: 'right',
      render: (record: EditableInvestment) => (
        <Text type="secondary">
          {formatCurrency(record.previousValue, record.country === Country.BR ? 'BRL' : 'USD')}
        </Text>
      ),
    },
    {
      title: `Current Value (${selectedMonth.format('MMM/YY')})`,
      key: 'currentValue',
      width: 180,
      align: 'right',
      render: (record: EditableInvestment) => (
        <InputNumber
          value={record.currentValue}
          onChange={(value) => record.id && handleValueChange(record.id, value)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
          prefix={record.country === Country.BR ? 'R$' : '$'}
          style={{
            width: '100%',
            borderColor: record.hasChanged ? '#52c41a' : undefined,
          }}
        />
      ),
    },
    {
      title: 'Change',
      key: 'change',
      width: 120,
      align: 'right',
      render: (record: EditableInvestment) => {
        const change = (record.currentValue || 0) - (record.previousValue || 0);
        const changePercent = record.previousValue
          ? ((change / record.previousValue) * 100).toFixed(2)
          : 0;
        
        return (
          <Space direction="vertical" size={0}>
            <Text type={change >= 0 ? 'success' : 'danger'}>
              {change >= 0 ? '+' : ''}{formatCurrency(Math.abs(change), record.country === Country.BR ? 'BRL' : 'USD')}
            </Text>
            <Text type={change >= 0 ? 'success' : 'danger'} style={{ fontSize: 12 }}>
              {change >= 0 ? '+' : ''}{changePercent}%
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: InvestmentStatus, record: EditableInvestment) => {
        if (record.maturityDate && dayjs(record.maturityDate).isBefore(selectedMonth.endOf('month'))) {
          return (
            <Tag color="orange" icon={<WarningOutlined />}>
              Check Maturity
            </Tag>
          );
        }
        return (
          <Tag color={status === InvestmentStatus.ACTIVE ? 'green' : 'default'}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (record: EditableInvestment) => (
        <Space>
          {record.status === InvestmentStatus.ACTIVE && record.maturityDate && 
           dayjs(record.maturityDate).isBefore(selectedMonth.endOf('month')) && (
            <Tooltip title="Mark as Done">
              <Button
                size="small"
                type="link"
                icon={<CheckOutlined />}
                onClick={() => record.id && handleStatusChange(record.id, InvestmentStatus.DONE)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const brazilianInvestments = editableData.filter(inv => inv.country === Country.BR);
  const usInvestments = editableData.filter(inv => inv.country === Country.US);

  const calculateTotals = (investments: EditableInvestment[]) => {
    const currentTotal = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    const previousTotal = investments.reduce((sum, inv) => sum + (inv.previousValue || 0), 0);
    const change = currentTotal - previousTotal;
    const changePercent = previousTotal ? (change / previousTotal) * 100 : 0;
    
    return { currentTotal, previousTotal, change, changePercent };
  };

  const brTotals = calculateTotals(brazilianInvestments);
  const usTotals = calculateTotals(usInvestments);

  return (
    <div>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Title level={2}>Monthly Portfolio Update</Title>
        </Col>
        <Col>
          <Space>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(date) => date && setSelectedMonth(date)}
              format="MMMM YYYY"
            />
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyFromPrevious}
            >
              Copy Previous
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchSnapshots()}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={!hasUnsavedChanges}
            >
              Save Update
            </Button>
            <Button icon={<ExportOutlined />}>
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      {hasUnsavedChanges && (
        <Alert
          message="You have unsaved changes"
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {savingProgress > 0 && (
        <Progress
          percent={savingProgress}
          status={savingProgress === 100 ? 'success' : 'active'}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Brazil Total"
              value={brTotals.currentTotal}
              formatter={(value) => formatCurrency(Number(value), 'BRL')}
              prefix={<GlobalOutlined />}
            />
            <Text type={brTotals.change >= 0 ? 'success' : 'danger'}>
              {brTotals.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(brTotals.change), 'BRL')}
              ({brTotals.changePercent.toFixed(2)}%)
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="USA Total"
              value={usTotals.currentTotal}
              formatter={(value) => formatCurrency(Number(value), 'USD')}
              prefix={<DollarOutlined />}
            />
            <Text type={usTotals.change >= 0 ? 'success' : 'danger'}>
              {usTotals.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(usTotals.change), 'USD')}
              ({usTotals.changePercent.toFixed(2)}%)
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Combined (BRL)"
              value={brTotals.currentTotal + (usTotals.currentTotal * exchangeRate)}
              formatter={(value) => formatCurrency(Number(value), 'BRL')}
            />
            <Button type="link" size="small" onClick={handleUpdateExchangeRate}>
              Rate: R$ {exchangeRate.toFixed(2)}
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Combined (USD)"
              value={(brTotals.currentTotal / exchangeRate) + usTotals.currentTotal}
              formatter={(value) => formatCurrency(Number(value), 'USD')}
            />
            <Text type="secondary">
              Updated: {selectedMonth.format('MMMM YYYY')}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Data Tables */}
      <Card>
        <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'BR' | 'US')}>
          <TabPane
            tab={
              <span>
                <GlobalOutlined /> Brazil
                <Badge count={brazilianInvestments.filter(i => i.hasChanged).length} style={{ marginLeft: 8 }} />
              </span>
            }
            key="BR"
          >
            <Table
              columns={columns}
              dataSource={brazilianInvestments}
              loading={investmentsLoading || snapshotsLoading}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={false}
              footer={() => (
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Total: {formatCurrency(brTotals.currentTotal, 'BRL')}
                </div>
              )}
              rowClassName={(record) => record.hasChanged ? 'edited-row' : ''}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <DollarOutlined /> USA
                <Badge count={usInvestments.filter(i => i.hasChanged).length} style={{ marginLeft: 8 }} />
              </span>
            }
            key="US"
          >
            <Table
              columns={columns}
              dataSource={usInvestments}
              loading={investmentsLoading || snapshotsLoading}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={false}
              footer={() => (
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Total: {formatCurrency(usTotals.currentTotal, 'USD')}
                </div>
              )}
              rowClassName={(record) => record.hasChanged ? 'edited-row' : ''}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default MonthlyUpdate;
