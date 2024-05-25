import * as Updates from 'expo-updates';

export default async function restartApp() {
  try {
    await Updates.reloadAsync();
  } catch (e) {
    // console.error(e); // 실 서비스에서는 오류 내역 출력하면 안됨
  }
}
