import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  Divider,
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
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
    minHeight: '72px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow4,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  logoText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase600,
  },
  nav: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  navButton: {
    color: 'white',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
    },
    ':hover:active': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
  },
  navButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  userName: {
    marginRight: tokens.spacingHorizontalS,
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
      <div className={styles.logo}>
        <ArrowTrendingRegular />
        <Text className={styles.logoText}>DWx Traffic Manager</Text>
      </div>

      <nav className={styles.nav}>
        {/* DWx Traffic Manager - Primary Navigation */}
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/services') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/services')}
          icon={<GridRegular />}
        >
          Services
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/products') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/products')}
          icon={<Apps24Regular />}
        >
          Products
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/request') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/request')}
          icon={<AddRegular />}
        >
          New Request
        </Button>
        <Button
          appearance="subtle"
          className={`${styles.navButton} ${isActive('/requests') ? styles.navButtonActive : ''}`}
          onClick={() => navigate('/requests')}
          icon={<DocumentBulletListRegular />}
        >
          My Requests
        </Button>
        {isManager && (
          <>
            <Button
              appearance="subtle"
              className={`${styles.navButton} ${isActive('/dashboard') ? styles.navButtonActive : ''}`}
              onClick={() => navigate('/dashboard')}
              icon={<DataUsage24Regular />}
            >
              Dashboard
            </Button>
            <Button
              appearance="subtle"
              className={`${styles.navButton} ${isActive('/admin') ? styles.navButtonActive : ''}`}
              onClick={() => navigate('/admin')}
              icon={<Settings24Regular />}
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
            <Text className={styles.userName} size={300}>
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
