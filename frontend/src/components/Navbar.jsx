import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Container,
  Divider,
  ListItemIcon,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Logout,
  Dashboard as DashboardIcon,
  Person,
  Videocam,
  Close
} from '@mui/icons-material';

import { getAvatarProps } from '../utils/avatar';


const Navbar = () => {
  const { user, logout, themeMode, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:900px)');

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isMenuOpen = Boolean(anchorEl);
  const isLandingPage = location.pathname === '/';

  // Navigation Links definition
  const links = user 
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
        { label: 'Profile Settings', path: '/profile', icon: <Person fontSize="small" /> }
      ]
    : [
        { label: 'Features', path: '/#features' },
        { label: 'Why bLINK', path: '/#why' },
        { label: 'About', path: '/#about' }
      ];

  const handleNavClick = (path) => {
    if (path.startsWith('/#')) {
      if (!isLandingPage) {
        navigate('/');
        // Let it load and scroll
        setTimeout(() => {
          const id = path.substring(2);
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const id = path.substring(2);
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
    setMobileOpen(false);
  };



  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'var(--card-bg)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--card-border)',
          boxShadow: 'var(--glass-shadow)',
          top: 0,
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: '70px' }}>
            {/* Logo */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(user ? '/dashboard' : '/')}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  borderRadius: '10px',
                  p: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Videocam sx={{ color: '#ffffff', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                bLINK
              </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {links.map((link) => (
                  <Button
                    key={link.label}
                    onClick={() => handleNavClick(link.path)}
                    sx={{
                      color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: 500,
                      '&:hover': {
                        color: 'var(--text-primary)',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Actions / Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Theme Toggler */}
              <IconButton onClick={toggleTheme} color="inherit" sx={{ transition: 'transform 0.3s' }}>
                {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>

              {/* User Logged In State */}
              {user ? (
                <>
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{ p: 0, border: '2px solid var(--card-border)', borderRadius: '50%' }}
                  >
                    <Avatar {...getAvatarProps(user.name || user.username, { width: 36, height: 36 })} />
                  </IconButton>

                  {/* Profile Dropdown */}
                  <Menu
                    anchorEl={anchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        width: 220,
                        backgroundColor: 'var(--card-bg)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--glass-shadow)',
                        borderRadius: '14px',
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        @{user.username}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 0.5, borderColor: 'var(--card-border)' }} />
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        navigate('/dashboard');
                      }}
                    >
                      <ListItemIcon>
                        <DashboardIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
                      </ListItemIcon>
                      Dashboard
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        navigate('/profile');
                      }}
                    >
                      <ListItemIcon>
                        <Person fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
                      </ListItemIcon>
                      Profile Settings
                    </MenuItem>
                    <Divider sx={{ my: 0.5, borderColor: 'var(--card-border)' }} />
                    <MenuItem onClick={handleLogout} sx={{ color: 'var(--danger)' }}>
                      <ListItemIcon>
                        <Logout fontSize="small" sx={{ color: 'var(--danger)' }} />
                      </ListItemIcon>
                      Log out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                /* Guest State Buttons */
                !isMobile && (
                  <>
                    <Button
                      onClick={() => navigate('/login')}
                      sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/register')}
                      sx={{
                        borderRadius: '10px',
                        boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )
              )}

              {/* Mobile Drawer Trigger */}
              {isMobile && (
                <IconButton onClick={handleDrawerToggle} color="inherit">
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          sx: {
            width: '280px',
            backgroundColor: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid var(--card-border)',
            color: '#ffffff',
            p: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            bLINK
          </Typography>
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#ffffff' }}>
            <Close />
          </IconButton>
        </Box>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {links.map((link) => (
            <ListItem key={link.label} disablePadding>
              <ListItemButton
                onClick={() => handleNavClick(link.path)}
                sx={{
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                {link.icon && <ListItemIcon sx={{ color: '#ffffff', minWidth: '40px' }}>{link.icon}</ListItemIcon>}
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {!user && (
            <>
              <Divider sx={{ my: 2, borderColor: 'var(--card-border)' }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavClick('/login')}
                  sx={{
                    borderRadius: '10px',
                    justifyContent: 'center',
                    border: '1px solid var(--card-border)',
                    mb: 1.5,
                  }}
                >
                  <ListItemText primary="Sign In" sx={{ textAlign: 'center' }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavClick('/register')}
                  sx={{
                    borderRadius: '10px',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  }}
                >
                  <ListItemText primary="Get Started" sx={{ textAlign: 'center', fontWeight: 'bold' }} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;
