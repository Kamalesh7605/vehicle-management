import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';

interface SearchOption {
  group: 'Vehicles' | 'Drivers';
  label: string;
  hint: string;
  to: string;
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const { username, logout } = useAuth();
  const location = useLocation();
  // Alerts that were unread when the menu was opened stay highlighted until it is closed.
  const [highlight, setHighlight] = useState<Set<string>>(new Set());

  const alerts = useApi(dashboardService.alerts, []);
  const vehicles = useApi(() => (searchLoaded ? vehicleService.list() : Promise.resolve([])), [searchLoaded]);
  const drivers = useApi(() => (searchLoaded ? driverService.list() : Promise.resolve([])), [searchLoaded]);

  const options = useMemo<SearchOption[]>(
    () => [
      ...(vehicles.data ?? []).map((v) => ({
        group: 'Vehicles' as const,
        label: v.vehicleNumber,
        hint: [v.manufacturer, v.model].filter(Boolean).join(' '),
        to: `/vehicles/${v.id}`,
      })),
      ...(drivers.data ?? []).map((d) => ({
        group: 'Drivers' as const,
        label: d.name,
        hint: d.phone,
        to: `/drivers?q=${encodeURIComponent(d.name)}`,
      })),
    ],
    [vehicles.data, drivers.data],
  );

  // Refresh after every page change so changes made elsewhere (new document, service done) show up.
  const reloadAlerts = alerts.reload;
  useEffect(() => {
    reloadAlerts();
  }, [location.pathname, reloadAlerts]);

  const alertList = alerts.data ?? [];
  const unreadCount = alertList.filter((a) => !a.read).length;

  const openBell = (anchor: HTMLElement) => {
    const unread = alertList.filter((a) => !a.read);
    setHighlight(new Set(unread.map((a) => a.key)));
    setBellAnchor(anchor);
    if (unread.length > 0) {
      // Read state lives on the server, so it follows this login to any browser or device.
      dashboardService
        .markAlertsRead()
        .then(reloadAlerts)
        .catch(() => undefined); // the badge simply stays until the next successful attempt
    }
  };

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 3 },
        py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <IconButton onClick={onMenuClick} sx={{ display: { md: 'none' } }} aria-label="Open navigation">
        <MenuIcon />
      </IconButton>

      <Autocomplete<SearchOption>
        sx={{ flexGrow: 1, maxWidth: 600 }}
        options={options}
        groupBy={(o) => o.group}
        getOptionLabel={(o) => o.label}
        loading={searchLoaded && (vehicles.loading || drivers.loading)}
        onOpen={() => setSearchLoaded(true)}
        onFocus={() => setSearchLoaded(true)}
        value={null}
        blurOnSelect
        clearOnBlur
        onChange={(_, option) => option && navigate(option.to)}
        noOptionsText="No matching vehicles or drivers"
        renderOption={(props, option) => {
          const { key, ...rest } = props as typeof props & { key: string };
          return (
            <li key={key} {...rest}>
              <ListItemText primary={option.label} secondary={option.hint} />
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search vehicles, drivers..."
            inputProps={{ ...params.inputProps, 'aria-label': 'Global search' }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      <Box sx={{ flexGrow: 1 }} />

      <IconButton onClick={(e) => openBell(e.currentTarget)} aria-label={`${unreadCount} unread notifications`}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={bellAnchor}
        open={!!bellAnchor}
        onClose={() => setBellAnchor(null)}
        slotProps={{ paper: { sx: { width: 340, maxWidth: '92vw' } } }}
      >
        <Typography fontWeight={700} sx={{ px: 2, py: 1 }}>
          Notifications
        </Typography>
        <Divider />
        {alertList.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            You're all caught up.
          </Typography>
        )}
        {alertList.slice(0, 6).map((a) => (
          <MenuItem
            key={a.id}
            sx={highlight.has(a.key) ? { bgcolor: 'action.hover', borderLeft: 3, borderColor: 'primary.main' } : undefined}
            onClick={() => {
              setBellAnchor(null);
              navigate(a.link);
            }}
          >
            <ListItemText
              primary={a.title}
              secondary={a.subject}
              primaryTypographyProps={{ fontSize: 14, fontWeight: highlight.has(a.key) ? 700 : 500, whiteSpace: 'normal' }}
            />
          </MenuItem>
        ))}
        {alertList.length > 6 && (
          <MenuItem
            onClick={() => {
              setBellAnchor(null);
              navigate('/');
            }}
          >
            <Typography variant="body2" color="primary" fontWeight={600}>
              View all {alertList.length} alerts
            </Typography>
          </MenuItem>
        )}
      </Menu>

      <Box
        component="button"
        type="button"
        aria-label="Account menu"
        onClick={(e) => setUserAnchor(e.currentTarget)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, border: 0, bgcolor: 'transparent', cursor: 'pointer', color: 'inherit', font: 'inherit', p: 0 }}
      >
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}>
          {(username ?? 'A').charAt(0).toUpperCase()}
        </Avatar>
        <Typography fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' } }}>
          {username ?? 'Admin'}
        </Typography>
        <ExpandMoreIcon fontSize="small" sx={{ display: { xs: 'none', sm: 'block' } }} />
      </Box>
      <Menu anchorEl={userAnchor} open={!!userAnchor} onClose={() => setUserAnchor(null)}>
        <MenuItem
          onClick={() => {
            setUserAnchor(null);
            logout();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </Box>
  );
}
