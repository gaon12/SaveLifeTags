import * as SQLite from 'expo-sqlite';

// 데이터베이스 이름 설정
const databaseName = 'appDatabase.db';

// 데이터베이스 초기화 함수
const initializeDatabase = async () => {
  // 데이터베이스 열기
  const db = await SQLite.openDatabaseAsync(databaseName);
  // ServiceLogs 테이블 생성 (존재하지 않을 경우에만)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ServiceLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stats INTEGER,
      UsersFault BOOLEAN,
      message TEXT,
      date DATETIME,
      isOnline BOOLEAN
    );
  `);
  // AppLogs 테이블 생성 (존재하지 않을 경우에만)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS AppLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stats INTEGER,
      UsersFault BOOLEAN,
      message TEXT,
      date DATETIME
    );
  `);
  return db;
};

// 테이블 존재 여부 확인 함수
const checkTableExists = async (db, tableName) => {
  // sqlite_master 테이블에서 테이블 이름 확인
  const result = await db.getFirstAsync(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
    [tableName]
  );
  // 결과가 존재하면 true, 그렇지 않으면 false 반환
  return !!result;
};

// ServiceLogs 테이블에 로그 삽입 함수
const insertServiceLog = async (db, { stats, UsersFault, message, date, isOnline }) => {
  // ServiceLogs 테이블에 새로운 행 삽입
  await db.runAsync(
    'INSERT INTO ServiceLogs (stats, UsersFault, message, date, isOnline) VALUES (?, ?, ?, ?, ?);',
    [stats, UsersFault, message, date, isOnline]
  );
};

// AppLogs 테이블에 로그 삽입 함수
const insertAppLog = async (db, { stats, UsersFault, message, date }) => {
  // AppLogs 테이블에 새로운 행 삽입
  await db.runAsync(
    'INSERT INTO AppLogs (stats, UsersFault, message, date) VALUES (?, ?, ?, ?);',
    [stats, UsersFault, message, date]
  );
};

// ServiceLogs 테이블에서 모든 로그 가져오기 함수
// const getServiceLogs = async (db) => {
//   return await db.getAllAsync('SELECT * FROM ServiceLogs;');
// };

const getServiceLogs = async (db, limit = 50, offset = 0) => {
  return await db.getAllAsync('SELECT * FROM ServiceLogs ORDER BY date DESC LIMIT ? OFFSET ?;', [limit, offset]);
};

// AppLogs 테이블에서 모든 로그 가져오기 함수
// const getAppLogs = async (db) => {
//   return await db.getAllAsync('SELECT * FROM AppLogs;');
// };

const getAppLogs = async (db, limit = 50, offset = 0) => {
  return await db.getAllAsync('SELECT * FROM AppLogs ORDER BY date DESC LIMIT ? OFFSET ?;', [limit, offset]);
};

// 데이터베이스 초기화(리셋) 함수
const resetDatabase = async (db) => {
  // ServiceLogs 테이블 삭제
  await db.execAsync('DROP TABLE IF EXISTS ServiceLogs;');
  // AppLogs 테이블 삭제
  await db.execAsync('DROP TABLE IF EXISTS AppLogs;');

  // ServiceLogs 테이블 다시 생성
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ServiceLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stats INTEGER,
      UsersFault BOOLEAN,
      message TEXT,
      date DATETIME,
      isOnline BOOLEAN
    );
  `);
  // AppLogs 테이블 다시 생성
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS AppLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stats INTEGER,
      UsersFault BOOLEAN,
      message TEXT,
      date DATETIME
    );
  `);
};

export {
  initializeDatabase, // 데이터베이스 초기화 함수 내보내기
  checkTableExists, // 테이블 존재 여부 확인 함수 내보내기
  insertServiceLog, // ServiceLogs에 로그 삽입 함수 내보내기
  insertAppLog, // AppLogs에 로그 삽입 함수 내보내기
  getServiceLogs, // ServiceLogs에서 모든 로그 가져오기 함수 내보내기
  getAppLogs, // AppLogs에서 모든 로그 가져오기 함수 내보내기
  resetDatabase // 데이터베이스 초기화(리셋) 함수 내보내기
};
