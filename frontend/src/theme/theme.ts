import { createTheme } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 224;

export const brand = {
  navy: '#0F1E3D',
  navyLight: '#1B2D52',
  primary: '#2563EB',
  fuel: '#2563EB',
  maintenance: '#F59E0B',
  other: '#F43F5E',
  border: '#E5E9F2',
  background: '#F5F7FB',
};

export const theme = createTheme({
  palette: {
    primary: { main: brand.primary, dark: '#1D4ED8', light: '#DBEAFE' },
    secondary: { main: '#64748B' },
    success: { main: '#16A34A', light: '#DCFCE7', dark: '#15803D' },
    warning: { main: '#F59E0B', light: '#FEF3C7', dark: '#B45309' },
    error: { main: '#DC2626', light: '#FEE2E2', dark: '#B91C1C' },
    info: { main: '#0EA5E9', light: '#E0F2FE', dark: '#0369A1' },
    background: { default: brand.background, paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    divider: brand.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700, fontSize: '1.65rem' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { WebkitFontSmoothing: 'antialiased' } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: brand.border, paddingTop: 12, paddingBottom: 12 },
        head: { fontWeight: 600, color: '#475569', backgroundColor: '#F8FAFC', whiteSpace: 'nowrap' },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});
