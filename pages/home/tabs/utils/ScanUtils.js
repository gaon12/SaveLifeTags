// ./utils/ScanUtils.js
import { Alert } from 'react-native';

export const handleBarCodeScanned = (data) => {
  Alert.alert(`QR 코드 스캔 결과: ${data}`);
  return data;
};

export const calculateNfcColor = (color) => {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  const newRed = Math.max(0, red - red * 0.15);
  const newGreen = Math.max(0, green - green * 0.15);
  const newBlue = Math.max(0, blue - blue * 0.15);

  const newColor = `#${Math.round(newRed).toString(16).padStart(2, '0')}${Math.round(newGreen).toString(16).padStart(2, '0')}${Math.round(newBlue).toString(16).padStart(2, '0')}`;

  return newColor;
};
