import React, { useEffect, useState, useContext } from 'react';
import { View, Image, Alert, StyleSheet, Dimensions, Platform } from 'react-native';
import CheckAppValid from './CheckAppValid';
import splashImage from '../../assets/images/splash/splash.png';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import restartApp from '../../components/Restart';
import { initializeDatabase } from '../../database';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const { themeColor, darkMode } = useContext(ThemeContext);
  const { getTranslation } = useContext(LanguageContext);

  useEffect(() => {
    const initialize = async () => {
      await validateApp();
    };

    const validateApp = async () => {
      const db = await initializeDatabase();  // Initialize the database
      const validationResult = await CheckAppValid();
      if (validationResult === true) {
        setTimeout(() => {
          navigation.replace('Login'); // 검증 통과 시 로그인 페이지로 이동
        }, 2000); // 스플래시 화면을 2초 동안 보여줍니다.
      } else {
        let message;
        switch (validationResult) {
          case 1:
            message = getTranslation('networkError');
            break;
          case 2:
            message = getTranslation('versionError');
            break;
          case 3:
            message = Platform.OS === 'ios' ? getTranslation('jailbrokenErrorIOS') : getTranslation('jailbrokenErrorAndroid');
            break;
          case 4:
            message = getTranslation('emulatorError');
            break;
          default:
            message = getTranslation('unknownError');
        }
        showAlert(message);
      }
    };

    initialize();
  }, [navigation]);

  const onImageLayout = (event) => {
    const { width: imageWidth, height: imageHeight } = event.nativeEvent.layout;
    setImageSize({ width: imageWidth, height: imageHeight });
  };

  const showAlert = (message) => {
    const alertTitle = getTranslation('warning');
    const alertButton = { text: getTranslation('restart'), onPress: restartApp };
    const alertOptions = { cancelable: false };
    const alertMessage = message;

    if (darkMode) {
      Alert.alert(
        alertTitle,
        alertMessage,
        [alertButton],
        alertOptions,
      );
    } else {
      Alert.alert(
        alertTitle,
        alertMessage,
        [alertButton],
        alertOptions,
      );
    }
  };

  if (imageSize.width === 0 || imageSize.height === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#9FF4FF' }]}>
        <Image source={splashImage} style={styles.image} onLayout={onImageLayout} />
      </View>
    );
  }

  const imageScale = Math.min(width / imageSize.width, height / imageSize.height);

  return (
    <View style={[styles.container, { backgroundColor: '#9FF4FF' }]}>
      <Image
        source={splashImage}
        style={[
          styles.image,
          {
            width: imageSize.width * imageScale,
            height: imageSize.height * imageScale,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
});
