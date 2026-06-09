import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@aroundu/users';
const SESSION_KEY = '@aroundu/session';

const normalizeEmail = (email) => email.trim().toLowerCase();
const normalizeUsername = (username) => username.trim().toLowerCase();

const readUsers = async () => {
  const value = await AsyncStorage.getItem(USERS_KEY);
  return value ? JSON.parse(value) : [];
};

const publicUser = ({ password, ...user }) => user;

export const authService = {
  async getSession() {
    const value = await AsyncStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  },

  async register({ displayName, username, email, password }) {
    const users = await readUsers();
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error('Email is already registered.');
    }

    if (users.some((user) => user.username === normalizedUsername)) {
      throw new Error('Username is already taken.');
    }

    const user = {
      id: `local-${Date.now()}`,
      displayName: displayName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));

    const session = publicUser(user);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async login({ email, password }) {
    const users = await readUsers();
    const normalizedEmail = normalizeEmail(email);
    const user = users.find((item) => item.email === normalizedEmail);

    if (!user || user.password !== password) {
      throw new Error('Email or password is incorrect.');
    }

    const session = publicUser(user);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async logout() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },
};
