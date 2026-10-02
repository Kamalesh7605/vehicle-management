import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';

export function NotFound() {
  return (
    <EmptyState title="Page not found" message="The page you are looking for does not exist.">
      <Button component={RouterLink} to="/" variant="contained">
        Back to dashboard
      </Button>
    </EmptyState>
  );
}
