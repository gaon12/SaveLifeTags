// context/theme.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  default: '#00bcd4',
  dark: '#333333',
  red: '#f44336',
  orange: '#ff9800',
  yellow: '#ffeb3b',
  green: '#4caf50',
  blue: '#2196f3',
  indigo: '#3f51b5',
  purple: '#9c27b0',
  pink: '#e91e63',
  skyblue: '#87ceeb',
};

const getThemeColor = async () => {
  const storedTheme = await AsyncStorage.getItem('ThemeColor');
  return colors[storedTheme] || colors.default;
};

const isDarkMode = async () => {
  const storedTheme = await AsyncStorage.getItem('ThemeColor');
  return storedTheme === 'dark';
};

export { getThemeColor, isDarkMode };
