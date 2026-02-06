import React from 'react';
import {
  makeStyles,
  Text,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  Divider,
  shorthands,
} from '@fluentui/react-components';
import {
  SignOut24Regular,
  Person24Regular,
  DataUsage24Regular,
  Settings24Regular,
  GridRegular,
  AddRegular,
  DocumentBulletListRegular,
  ArrowTrendingRegular,
  Apps24Regular,
  BookOpen24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('0', '64px'),
    height: '56px',
    backgroundImage: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 100%)',
    color: 'white',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '20px',
    color: '#5bb8f5',
  },
  logoText: {
    fontSize: '17px',
    fontWeight: '700',
    color: 'white',
  },
  logoAccent: {
    color: '#5bb8f5',
  },
  nav: {
    display: 'flex',
    ...shorthands.gap('2px'),
  },
  navButton: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '13px',
    fontWeight: '500',
    minWidth: 'auto',
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('6px'),
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
    },
    ':hover:active': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      color: 'white',
    },
  },
  navButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    fontWeight: '600',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  userName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
  },
});

export const Header: React.FC = () => {
  const styles = useStyles();
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => navigate('/')}>
        <ArrowTrendingRegular className={styles.logoIcon} />
        <Text className={styles.logoText}>
          DWx Traffic <span className={styles.logoAccent}>Manager</span>
        </Text>
      </div>

      <nav className={styles.nav}>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/services') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/services')}
          icon={<GridRegular />}
          size="small"
        >
          Services
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/products') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/products')}
          icon={<Apps24Regular />}
          size="small"
        >
          Products
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/request') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/request')}
          icon={<AddRegular />}
          size="small"
        >
          New Request
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/requests') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/requests')}
          icon={<DocumentBulletListRegular />}
          size="small"
        >
          My Requests
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/knowledge-base') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/knowledge-base')}
          icon={<BookOpen24Regular />}
          size="small"
        >
          Knowledge Base
        </Button>
        {isManager && (
          <>
            <Button
              appearance="subtle"
              className={`${styles.navButton} ${isActive('/dashboard') ? styles.navButtonActive : ''}`}
              onClick={() => navigate('/dashboard')}
              icon={<DataUsage24Regular />}
              size="small"
            >
              Dashboard
            </Button>
            <Button
              appearance="subtle"
              className={`${styles.navButton} ${isActive('/admin') ? styles.navButtonActive : ''}`}
              onClick={() => navigate('/admin')}
              icon={<Settings24Regular />}
              size="small"
            >
              Admin
            </Button>
          </>
        )}
      </nav>

      <div className={styles.userSection}>
        {user && (
          <>
            <NotificationCenter />
            <Text className={styles.userName}>
              {user.displayName}
            </Text>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Avatar
                  name={user.displayName}
                  size={32}
                  style={{ cursor: 'pointer' }}
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem icon={<Person24Regular />} disabled>
                    {user.email}
                  </MenuItem>
                  <Divider />
                  <MenuItem icon={<SignOut24Regular />} onClick={handleLogout}>
                    Sign out
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </>
        )}
      </div>
    </header>
  );
};
