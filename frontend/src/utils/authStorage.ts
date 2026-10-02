const TOKEN_KEY = 'fleetmate.token';
const USER_KEY = 'fleetmate.user';

// localStorage can throw (private windows, blocked storage), so every access is guarded.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const authStorage = {
  getToken: () => read(TOKEN_KEY),
  getUsername: () => read(USER_KEY),
  save(token: string, username: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, username);
    } catch {
      /* the session then lasts until the page is reloaded */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export const UNAUTHORIZED_EVENT = 'fleetmate:unauthorized';
