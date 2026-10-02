import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { brand } from '../../theme/theme';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const MAIN_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Vehicles', to: '/vehicles', icon: <DirectionsBusIcon /> },
  { label: 'Drivers', to: '/drivers', icon: <PersonOutlineIcon /> },
  { label: 'Fuel', to: '/fuel', icon: <LocalGasStationOutlinedIcon /> },
  { label: 'Maintenance', to: '/maintenance', icon: <BuildOutlinedIcon /> },
  { label: 'Expenses', to: '/expenses', icon: <ReceiptLongOutlinedIcon /> },
  { label: 'Documents', to: '/documents', icon: <DescriptionOutlinedIcon /> },
  { label: 'Reports', to: '/reports', icon: <AssessmentOutlinedIcon /> },
];

function isActive(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
}

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const active = isActive(pathname, item.to);
  return (
    <ListItemButton
      component={NavLink}
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        py: 1.1,
        color: active ? '#fff' : 'rgba(255,255,255,.78)',
        bgcolor: active ? brand.primary : 'transparent',
        '&:hover': { bgcolor: active ? brand.primary : 'rgba(255,255,255,.08)' },
      }}
    >
      <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 600 : 500, fontSize: 15 }} />
    </ListItemButton>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: brand.navy, color: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 3 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: '#fff',
            color: brand.navy,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <DirectionsBusIcon />
        </Box>
        <Box>
          <Typography fontWeight={700} fontSize={20} lineHeight={1.1}>
            FleetMate
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.65)' }}>
            Vehicle Management
          </Typography>
        </Box>
      </Box>

      <List component="nav" aria-label="Main navigation" sx={{ px: 1.5, flexGrow: 1 }}>
        {MAIN_ITEMS.map((item) => (
          <NavEntry key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </List>
    </Box>
  );
}
