import { Dropdown, Avatar, Space, message } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { LoginButton } from './LoginButton';

export const UserMenu = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      message.success('已登出');
    } catch (error) {
      message.error('登出失敗');
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return <LoginButton />;
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user.displayName || user.email,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Space style={{ cursor: 'pointer' }}>
        <Avatar
          src={user.photoURL}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#1890ff' }}
        />
        <span style={{ color: '#fff' }}>{user.displayName || '使用者'}</span>
      </Space>
    </Dropdown>
  );
};
