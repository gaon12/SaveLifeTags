import React, { useEffect, useState, useContext } from "react";
import { View, StyleSheet, Image, Text, StatusBar, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Input, Button } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { initializeDatabase, insertAppLog } from "../../database";
import { useWindowDimensions } from "react-native";
import { verifyAppKey } from "./CheckAppKey"; // Import the verifyAppKey function

export default function Login() {
  const { width, height } = useWindowDimensions(); // Hook to get window dimensions
  const isLandscape = width > height; // Determine if the device is in landscape mode

  const { themeColor, darkMode } = useContext(ThemeContext);
  const { getTranslation } = useContext(LanguageContext);
  
  const [appKey, setAppKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const initConfig = async () => {
      const deviceID = await SecureStore.getItemAsync("device_id");
      const modelName = Device.modelName;

      if (deviceID) {
        setDeviceId(deviceID);
      }
      setDeviceName(modelName);

      const database = await initializeDatabase();
      setDb(database);

      if (deviceID && modelName) {
        await checkAppKey(deviceID, modelName, database);
      }
      setLoading(false);
    };
    initConfig();
  }, []);

  const logAppEvent = async (stats, UsersFault, message) => {
    if (db) {
      const date = new Date().toISOString();
      await insertAppLog(db, { stats, UsersFault, message, date });
    }
  };

  const checkAppKey = async (deviceID, modelName, database) => {
    const storedAppKey = await SecureStore.getItemAsync("AppKey");
    if (storedAppKey && storedAppKey.length >= 10) {
      logAppEvent(0, 0, "Auto login using app key in expo secure-store.");
      await verifyAppKey(storedAppKey, deviceID, modelName, logAppEvent, getTranslation, navigation); // Pass necessary parameters
    } else {
      Alert.alert("Error", getTranslation("autoLoginFailed")); // 자동 로그인 실패 메시지 출력
    }
  };

  const handleLogin = async () => {
    if (appKey.length < 10) {
      Alert.alert("Error", getTranslation("appKeyLengthError"));
      return;
    }

    if (!deviceId || !deviceName) {
      Alert.alert("Error", "Device ID or Device Name is not available.");
      return;
    }

    try {
      await verifyAppKey(appKey, deviceId, deviceName, logAppEvent, getTranslation, navigation); // Pass necessary parameters
    } catch (error) {
      Alert.alert("Error", getTranslation("unknownError"));
    }
  };

  const handleFindKey = () => {
    Alert.alert(getTranslation("findAppKeyMessage"), getTranslation("contactSupport"));
  };

  const containerStyle = {
    ...styles.container,
    backgroundColor: darkMode ? "#000000" : "#ffffff",
    flexDirection: isLandscape ? 'row' : 'column', // Adjust flexDirection based on orientation
  };

  const headerBackgroundStyle = {
    ...styles.headerBackground,
    backgroundColor: themeColor,
    width: isLandscape ? '40%' : width,
    height: isLandscape ? '100%' : width * 0.55,
    borderBottomLeftRadius: isLandscape ? 0 : width * 0.3,
    borderBottomRightRadius: isLandscape ? 0 : width * 0.3,
    borderTopRightRadius: isLandscape ? height * 0.3 : 0,
  };

  const formStyle = {
    ...styles.form,
    marginTop: isLandscape ? 0 : width * 0.3,
    width: isLandscape ? '60%' : '100%',
  };

  const welcomeTextStyle = {
    ...styles.welcomeText,
    color: darkMode ? "#ffffff" : "#000000",
  };

  const inputContainerStyle = {
    ...styles.inputContainer,
    backgroundColor: darkMode ? "#444444" : "#f2f2f2",
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={themeColor} />
      <View style={headerBackgroundStyle}>
        <Image source={require("../../assets/images/characters/login.png")} style={styles.logo} />
        <Text style={welcomeTextStyle}>{getTranslation("welcome")}</Text>
      </View>
      <View style={formStyle}>
        <Input
          placeholder={getTranslation("appKey")}
          leftIcon={{ type: "font-awesome", name: "key", color: darkMode ? "#ffffff" : "#000000" }}
          inputContainerStyle={inputContainerStyle}
          inputStyle={{ ...styles.input, color: darkMode ? "#ffffff" : "#000000" }}
          value={appKey}
          onChangeText={setAppKey}
        />
        <Button title={getTranslation("login")} buttonStyle={{ ...styles.loginButton, backgroundColor: themeColor }} onPress={handleLogin} />
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleFindKey}>
            <Text style={{ ...styles.footerLink, color: themeColor }}>{getTranslation("findAppKey")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackground: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    borderBottomWidth: 0,
    borderRadius: 25,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  input: {
    paddingLeft: 10,
  },
  loginButton: {
    borderRadius: 25,
    height: 50,
    marginVertical: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerLink: {
    fontSize: 16,
  },
});
