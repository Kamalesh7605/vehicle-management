import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Search box that reports changes after the user stops typing. */
export function SearchBar({ value, onChange, placeholder = 'Search...' }: Props) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <TextField
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={placeholder}
      inputProps={{ 'aria-label': placeholder }}
      fullWidth={false}
      sx={{ width: { xs: '100%', sm: 320 }, bgcolor: 'background.paper' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}
