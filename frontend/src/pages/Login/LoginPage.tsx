import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Alert, Box, Card, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoadingButton } from '../../components/common/LoadingButton';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../services/api';
import { brand } from '../../theme/theme';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const usernameMissing = touched && username.trim() === '';
  const passwordMissing = touched && password === '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (username.trim() === '' || password === '') return;
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background: `linear-gradient(160deg, ${brand.navy} 0%, ${brand.navyLight} 55%, #274277 100%)`,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: brand.navy, color: '#fff', display: 'grid', placeItems: 'center' }}>
            <DirectionsBusIcon />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={22} lineHeight={1.1}>
              FleetMate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vehicle Management
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your username and password to continue.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={submit} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            error={usernameMissing}
            helperText={usernameMissing ? 'Username is required' : undefined}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            error={passwordMissing}
            helperText={passwordMissing ? 'Password is required' : undefined}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <LoadingButton type="submit" variant="contained" size="large" loading={submitting} sx={{ mt: 1 }}>
            Sign in
          </LoadingButton>
        </Box>
      </Card>
    </Box>
  );
}
