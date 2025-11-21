import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Button, Space, Avatar, Dropdown, type MenuProps } from 'antd';
import {
  DashboardOutlined,
  WalletOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  ImportOutlined,
  ExportOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  DollarOutlined,
} from '@ant-design/icons';

// Import pages
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import MonthlyUpdate from './pages/MonthlyUpdate';
import TaxReports from './pages/TaxReports';
import Analytics from './pages/Analytics';
import ImportExport from './pages/ImportExport';
import Settings from './pages/Settings';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/investments',
      icon: <WalletOutlined />,
      label: 'Investments',
      children: [
        {
          key: '/investments/brazil',
          icon: <GlobalOutlined />,
          label: 'Brazil',
        },
        {
          key: '/investments/usa',
          icon: <DollarOutlined />,
          label: 'USA',
        },
        {
          key: '/investments/all',
          label: 'All Investments',
        },
      ],
    },
    {
      key: '/monthly-update',
      icon: <FileTextOutlined />,
      label: 'Monthly Update',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/tax-reports',
      icon: <FileTextOutlined />,
      label: 'Tax Reports',
    },
    {
      key: '/import-export',
      icon: <ImportOutlined />,
      label: 'Import/Export',
      children: [
        {
          key: '/import-export/import',
          icon: <ImportOutlined />,
          label: 'Import Data',
        },
        {
          key: '/import-export/export',
          icon: <ExportOutlined />,
          label: 'Export Data',
        },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      disabled: true, // Will be enabled when auth is implemented
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      disabled: true, // Will be enabled when auth is implemented
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        width={250}
      >
        <div className="logo" style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'IT' : 'Investment Tracker'}
          </h2>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: 0, 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Button type="text" style={{ height: 'auto', padding: '4px' }}>
                <Avatar icon={<UserOutlined />} />
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/investments">
              <Route path="all" element={<Investments filter="all" />} />
              <Route path="brazil" element={<Investments filter="BR" />} />
              <Route path="usa" element={<Investments filter="US" />} />
              <Route index element={<Navigate to="all" replace />} />
            </Route>
            <Route path="/monthly-update" element={<MonthlyUpdate />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/tax-reports" element={<TaxReports />} />
            <Route path="/import-export">
              <Route path="import" element={<ImportExport mode="import" />} />
              <Route path="export" element={<ImportExport mode="export" />} />
              <Route index element={<Navigate to="import" replace />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
