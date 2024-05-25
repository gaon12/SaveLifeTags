import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const SERVER_DOMAIN = process.env.EXPO_PUBLIC_SERVER_DOMAIN;
const cacheBuster = `cb=${new Date().getTime()}`;

export const verifyAppKey = async (key, deviceID, modelName, logAppEvent, getTranslation, navigation) => {
  try {
    const requestData = {
      app_key: key,
      device_id: deviceID,
      device_name: modelName,
    };

    const response = await axios.post(`${SERVER_DOMAIN}/appkey/use_key.php?${cacheBuster}`, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await handleResponse(response.data, key, logAppEvent, getTranslation, navigation); // Pass necessary parameters to handleResponse
  } catch (error) {
    console.error('Error:', error);
    Alert.alert("Error", getTranslation("unknownError"));
  }
};

const handleResponse = async (data, key, logAppEvent, getTranslation, navigation) => {
  if (data.StatusCode === 200 || data.StatusCode === 201) {
    await SecureStore.setItemAsync("AppKey", key); // Store the app key
    logAppEvent(0, 0, "Logged in using app key.");
    navigation.replace("Home");
  } else if (data.StatusCode === 400) {
    Alert.alert("Error", getTranslation("appKeyRequire"));
  } else if (data.StatusCode === 403 || data.StatusCode === 404) {
    Alert.alert("Error", getTranslation("appKeyAlreadyUse"));
  } else if (data.StatusCode === 405) {
    Alert.alert("Error", 'App Key and Device ID do not match.');
  } else {
    await SecureStore.deleteItemAsync("AppKey");
    const errorMessage =
      data.StatusCode === 403 || data.StatusCode === 500
        ? getTranslation("appKeyCantVerify")
        : getTranslation("unknownError");
    logAppEvent(2, 1, `Invalid app key entered. Detailed reason: ${errorMessage}`);
    Alert.alert("Error", errorMessage);
  }
};
