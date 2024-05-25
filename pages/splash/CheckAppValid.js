import axios from 'axios';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Cellular from 'expo-cellular';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { initializeDatabase, insertAppLog } from '../../database';

async function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

async function checkAndSetDeviceId(db) {
  let deviceId = await SecureStore.getItemAsync('device_id');

  if (!deviceId || deviceId.length < 10) {
    const now = new Date();
    const timeString = now.getTime().toString(); // Get current time in milliseconds
    const randomString = await generateRandomString(15);
    deviceId = `${timeString}-${randomString}`;
    await SecureStore.setItemAsync('device_id', deviceId);

    await insertAppLog(db, {
      stats: 0,
      UsersFault: 0,
      message: 'The device_id key was not found in expo secure-store, generate a new one.',
      date: new Date().toISOString()
    });
  } else {
    await insertAppLog(db, {
      stats: 0,
      UsersFault: 0,
      message: 'The device_id key found in expo secure-store!',
      date: new Date().toISOString()
    });
  }

  return deviceId; // Return the deviceId
}

export default async function CheckAppValid() {
  const db = await initializeDatabase();

  const deviceId = await checkAndSetDeviceId(db);

  const SERVER_DOMAIN = process.env.EXPO_PUBLIC_SERVER_DOMAIN;
  const cacheBuster = `cb=${new Date().getTime()}`; // Unique value to bust cache

  // 조건 1: 네트워크 상태 확인
  try {
    const response = await axios.get(`${SERVER_DOMAIN}/ping/api.php?${cacheBuster}`);
    if (response.data.StatusCode !== 200) {
      await insertAppLog(db, {
        stats: 2,
        UsersFault: 1,
        message: 'Unable to connect to API server.',
        date: new Date().toISOString()
      });
      return 1; // 인터넷 연결 실패
    } else {
      await insertAppLog(db, {
        stats: 0,
        UsersFault: 0,
        message: 'API server connection successful!',
        date: new Date().toISOString()
      });
    }
  } catch (error) {
    await insertAppLog(db, {
      stats: 2,
      UsersFault: 1,
      message: 'Unable to connect to API server.',
      date: new Date().toISOString()
    });
    return 1; // 인터넷 연결 실패
  }

  // 조건 2: 버전 확인
  try {
    const versionResponse = await axios.get(`${SERVER_DOMAIN}/version/api.php?${cacheBuster}`);
    const serverVersion = versionResponse.data?.data?.version;

    if (!serverVersion) {
      return 2; // 서버에서 버전 정보를 가져오지 못함
    }

    const appVersion = '1.0.0'; // 예시 버전입니다.
    if (appVersion !== serverVersion) {
      await insertAppLog(db, {
        stats: 1,
        UsersFault: 1,
        message: `Found the latest version (${serverVersion}). Current version ${appVersion}`,
        date: new Date().toISOString()
      });
      return 2; // 버전 불일치
    } else {
      await insertAppLog(db, {
        stats: 0,
        UsersFault: 0,
        message: `Currently using the latest version (${serverVersion})`,
        date: new Date().toISOString()
      });
    }
  } catch (error) {
    return 2; // 버전 확인 중 오류 발생
  }

  // 조건 3: 루팅/탈옥 확인
  try {
    let isRooted = await Device.isRootedExperimentalAsync();

    if (isRooted == null) {
      isRooted = false;
    }

    const rootApps = [
      'com.topjohnwu.magisk',
      'eu.chainfire.supersu',
      'com.koushikdutta.superuser',
      'com.noshufou.android.su',
      'com.thirdparty.superuser',
      'com.yellowes.su'
    ];

    const installedRootApps = await Promise.all(rootApps.map(async (app) => {
      try {
        const isInstalled = await Application.getInstallReferrerAsync({ packageName: app });
        return isInstalled !== null;
      } catch (error) {
        return false;
      }
    }));

    if (isRooted || installedRootApps.includes(true)) {
      await insertAppLog(db, {
        stats: 2,
        UsersFault: 1,
        message: 'Root/jailbreak or developer mode (Android) is enabled.',
        date: new Date().toISOString()
      });
      return 3; // 루팅 또는 탈옥된 기기
    } else {
      await insertAppLog(db, {
        stats: 0,
        UsersFault: 0,
        message: 'Root/jailbreak or developer mode (Android) is not enabled!',
        date: new Date().toISOString()
      });
    }
  } catch (error) {
    // console.error('Failed to check root status:', error);
    await insertAppLog(db, {
      stats: 2,
      UsersFault: 1,
      message: 'Root/jailbreak or developer mode (Android) is enabled.',
      date: new Date().toISOString()
    });
    return 3; // 체크 중 오류 발생 시
  }

  // 조건 4: 에뮬레이터 여부 확인
  try {
    const architecture = Device.architecture || '';
    const serial = Device.serial || '';

    const ipAddress = await Network.getIpAddressAsync();
    const isAndroidEmulator = Device.deviceType === Device.DeviceType.DESKTOP || architecture.includes('x86') || architecture.includes('i686') || Device.modelName.startsWith('sdk') || serial.startsWith('EMULATOR') || ipAddress === '10.0.2.15';

    const emulatorApps = [
      'com.google.android.launcher.layouts.genymotion',
      'com.bluestacks',
      'com.bignox.app',
      'com.vphone.launcher',
      'com.microvirt.tools',
      'com.microvirt.download',
      'com.cyanogenmod.filemanager',
      'com.mumu.store'
    ];

    const installedEmulatorApps = await Promise.all(emulatorApps.map(async (app) => {
      try {
        const isInstalled = await Application.getInstallReferrerAsync({ packageName: app });
        return isInstalled !== null;
      } catch (error) {
        return false;
      }
    }));

    let isIOSEmulator = false;
    if (Device.osName === 'iOS') {
      const carrierName = await Cellular.getCarrierNameAsync();
      isIOSEmulator = carrierName && carrierName.includes('Appetize.io');
    }

    if (isAndroidEmulator || installedEmulatorApps.includes(true) || isIOSEmulator) {
      await insertAppLog(db, {
        stats: 2,
        UsersFault: 1,
        message: 'App is running in the emulator.',
        date: new Date().toISOString()
      });
      // return 4; // 에뮬레이터로 간주
      return true; // 임시로 설정
    } else {
      await insertAppLog(db, {
        stats: 0,
        UsersFault: 0,
        message: 'App is running on a real device, not an emulator!',
        date: new Date().toISOString()
      });
    }
  } catch (error) {
    // console.error('Failed to check emulator status:', error);
    await insertAppLog(db, {
      stats: 2,
      UsersFault: 1,
      message: 'App is running in the emulator.',
      date: new Date().toISOString()
    });
    return 4; // 체크 중 오류 발생 시
  }

  // 모든 검증 통과 시
  return true;
}
