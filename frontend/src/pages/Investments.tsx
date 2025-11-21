import React, { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tooltip,
  Drawer,
  Descriptions,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  GlobalOutlined,
  DollarOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import numeral from 'numeral';

import { investmentService } from '../services/investmentService';
import { Investment, InvestmentStatus, Country, InvestmentType, CreateInvestmentDto } from '@shared/types';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

interface InvestmentsProps {
  filter?: 'all' | 'BR' | 'US';
}

const Investments: React.FC<InvestmentsProps> = ({ filter = 'all' }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InvestmentStatus | 'all'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch investments
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['investments', filter, selectedStatus],
    queryFn: () => investmentService.getAll({
      country: filter === 'all' ? undefined : filter as Country,
      status: selectedStatus === 'all' ? undefined : selectedStatus
    }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInvestmentDto) => investmentService.create(data),
    onSuccess: () => {
      message.success('Investment created successfully');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
    onError: () => {
      message.error('Failed to create investment');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Investment> }) => 
      investmentService.update(id, data),
    onSuccess: () => {
      message.success('Investment updated successfully');
      setIsModalVisible(false);
      setEditingInvestment(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
    onError: () => {
      message.error('Failed to update investment');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => investmentService.delete(id),
    onSuccess: () => {
      message.success('Investment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
    onError: () => {
      message.error('Failed to delete investment');
    }
  });

  // Mark as done mutation
  const markAsDoneMutation = useMutation({
    mutationFn: ({ id, finalValue }: { id: number; finalValue: number }) => 
      investmentService.markAsDone(id, finalValue),
    onSuccess: () => {
      message.success('Investment marked as done');
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
    onError: () => {
      message.error('Failed to mark investment as done');
    }
  });

  const formatCurrency = (value: number | undefined, currency: 'BRL' | 'USD' = 'BRL') => {
    if (!value) return '-';
    const prefix = currency === 'BRL' ? 'R$ ' : '$ ';
    return prefix + numeral(value).format('0,0.00');
  };

  const getStatusColor = (status: InvestmentStatus) => {
    switch (status) {
      case InvestmentStatus.ACTIVE:
        return 'processing';
      case InvestmentStatus.DONE:
        return 'success';
      case InvestmentStatus.SOLD:
        return 'warning';
      case InvestmentStatus.TRANSFERRED:
        return 'default';
      default:
        return 'default';
    }
  };

  const handleAdd = () => {
    setEditingInvestment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Investment) => {
    setEditingInvestment(record);
    form.setFieldsValue({
      ...record,
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      maturityDate: record.maturityDate ? dayjs(record.maturityDate) : null,
      saleDate: record.saleDate ? dayjs(record.saleDate) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleMarkAsDone = (record: Investment) => {
    Modal.confirm({
      title: 'Mark Investment as Done',
      content: (
        <Form layout="vertical">
          <Form.Item label="Final Value" name="finalValue" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              prefix={record.country === Country.BR ? 'R$' : '$'}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const finalValue = form.getFieldValue('finalValue');
        if (finalValue && record.id) {
          markAsDoneMutation.mutate({ id: record.id, finalValue });
        }
      },
    });
  };

  const handleViewDetails = (record: Investment) => {
    setSelectedInvestment(record);
    setDetailDrawerVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        maturityDate: values.maturityDate?.format('YYYY-MM-DD'),
        saleDate: values.saleDate?.format('YYYY-MM-DD'),
      };

      if (editingInvestment && editingInvestment.id) {
        updateMutation.mutate({ id: editingInvestment.id, data });
      } else if (!editingInvestment) {
        createMutation.mutate(data);
      }
    });
  };

  const columns: ColumnsType<Investment> = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      fixed: 'left',
      width: 200,
      ellipsis: true,
      filteredValue: [searchText],
      onFilter: (value, record) =>
        record.description.toLowerCase().includes(value.toString().toLowerCase()) ||
        Boolean(record.codigo && record.codigo.toLowerCase().includes(value.toString().toLowerCase())),
    },
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      ellipsis: true,
      render: (codigo: string) => codigo ? <Tag>{codigo}</Tag> : '-',
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      width: 100,
      filters: [...new Set((data?.data || []).map(item => item.account))].map(account => ({
        text: account,
        value: account,
      })),
      onFilter: (value, record) => record.account === value,
      render: (account: string) => (
        <Tag icon={<BankOutlined />} color="blue">{account}</Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: Object.values(InvestmentType).map(type => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.type === value,
      render: (type: string) => <Tag color="cyan">{type}</Tag>,
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 80,
      align: 'center',
      render: (country: Country) => (
        <Tag icon={country === Country.BR ? <GlobalOutlined /> : <DollarOutlined />}>
          {country}
        </Tag>
      ),
    },
    {
      title: 'Purchase Value',
      key: 'purchaseValue',
      width: 120,
      align: 'right',
      render: (record: Investment) => formatCurrency(
        record.purchaseValueOriginal,
        record.country === Country.BR ? 'BRL' : 'USD'
      ),
    },
    {
      title: 'Current Value',
      key: 'currentValue',
      width: 120,
      align: 'right',
      render: (record: Investment) => {
        // This would come from the latest snapshot
        return formatCurrency(
          record.finalValueOriginal || record.purchaseValueOriginal,
          record.country === Country.BR ? 'BRL' : 'USD'
        );
      },
    },
    {
      title: 'Maturity',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
      width: 100,
      render: (date: Date) => date ? dayjs(date).format('DD/MM/YY') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: InvestmentStatus) => (
        <Tag color={getStatusColor(status)}>
          {status === InvestmentStatus.ACTIVE && <CheckCircleOutlined />}
          {status === InvestmentStatus.DONE && <CheckCircleOutlined />}
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === InvestmentStatus.ACTIVE && (
            <Tooltip title="Mark as Done">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkAsDone(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Are you sure you want to delete this investment?"
            onConfirm={() => record.id && handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const investments = data?.data || [];
  const filteredInvestments = investments.filter((inv) => {
    if (searchText && !inv.description.toLowerCase().includes(searchText.toLowerCase()) &&
        (!inv.codigo || !inv.codigo.toLowerCase().includes(searchText.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Title level={2}>
            {filter === 'BR' && 'Brazilian Investments'}
            {filter === 'US' && 'US Investments'}
            {filter === 'all' && 'All Investments'}
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Investment
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Refresh
            </Button>
            <Button icon={<ExportOutlined />}>
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Search by description or código"
            allowClear
            style={{ width: 300 }}
            onSearch={(value) => setSearchText(value)}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">All Status</Option>
            <Option value={InvestmentStatus.ACTIVE}>Active</Option>
            <Option value={InvestmentStatus.DONE}>Done</Option>
            <Option value={InvestmentStatus.SOLD}>Sold</Option>
            <Option value={InvestmentStatus.TRANSFERRED}>Transferred</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredInvestments}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} investments`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingInvestment ? 'Edit Investment' : 'Add New Investment'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingInvestment(null);
          form.resetFields();
        }}
        width={700}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            country: Country.BR,
            status: InvestmentStatus.ACTIVE,
            purchaseCurrency: 'BRL',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please select country' }]}
              >
                <Select>
                  <Option value={Country.BR}>Brazil</Option>
                  <Option value={Country.US}>USA</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="account"
                label="Account"
                rules={[{ required: true, message: 'Please enter account' }]}
              >
                <Input placeholder="e.g., XP, Schwab, Wells Fargo" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input placeholder="Investment description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select>
                  {Object.values(InvestmentType).map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="codigo"
                label="Código (Brazilian investments)"
              >
                <Input placeholder="e.g., CDB2246T24Q" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="purchaseDate"
                label="Purchase Date"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="purchaseValueOriginal"
                label="Purchase Value"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maturityDate"
                label="Maturity Date"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="Investment Details"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={600}
      >
        {selectedInvestment && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Description">
                {selectedInvestment.description}
              </Descriptions.Item>
              <Descriptions.Item label="Código">
                {selectedInvestment.codigo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {selectedInvestment.account}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="cyan">{selectedInvestment.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Country">
                <Tag icon={selectedInvestment.country === Country.BR ? <GlobalOutlined /> : <DollarOutlined />}>
                  {selectedInvestment.country}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedInvestment.status)}>
                  {selectedInvestment.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>Financial Information</Divider>

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Purchase Date">
                {selectedInvestment.purchaseDate 
                  ? dayjs(selectedInvestment.purchaseDate).format('DD/MM/YYYY') 
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Value">
                {formatCurrency(
                  selectedInvestment.purchaseValueOriginal,
                  selectedInvestment.country === Country.BR ? 'BRL' : 'USD'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Maturity Date">
                {selectedInvestment.maturityDate 
                  ? dayjs(selectedInvestment.maturityDate).format('DD/MM/YYYY') 
                  : '-'}
              </Descriptions.Item>
              {selectedInvestment.status === InvestmentStatus.DONE && (
                <>
                  <Descriptions.Item label="Sale Date">
                    {selectedInvestment.saleDate 
                      ? dayjs(selectedInvestment.saleDate).format('DD/MM/YYYY') 
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Final Value">
                    {formatCurrency(
                      selectedInvestment.finalValueOriginal,
                      selectedInvestment.country === Country.BR ? 'BRL' : 'USD'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Earnings">
                    {formatCurrency(
                      selectedInvestment.earningsOriginal,
                      selectedInvestment.country === Country.BR ? 'BRL' : 'USD'
                    )}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {selectedInvestment.country === Country.BR && selectedInvestment.taxPaidBrazil && (
              <>
                <Divider>Tax Information</Divider>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Tax Rate">
                    {selectedInvestment.taxRateBrazil}%
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax Paid">
                    {formatCurrency(selectedInvestment.taxPaidBrazil, 'BRL')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {selectedInvestment.notes && (
              <>
                <Divider>Notes</Divider>
                <p>{selectedInvestment.notes}</p>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default Investments;
