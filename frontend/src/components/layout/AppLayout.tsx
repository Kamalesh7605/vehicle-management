import { Box, Drawer } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SIDEBAR_WIDTH } from '../../theme/theme';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, width: SIDEBAR_WIDTH, flexShrink: 0 }}>
        <Box sx={{ position: 'fixed', top: 0, bottom: 0, width: SIDEBAR_WIDTH }}>
          <Sidebar />
        </Box>
      </Box>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 0 } }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
