const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 로그 파일 저장 경로 설정
const logDir = path.join(__dirname, '../logs');

// 로그 형식 설정
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
});

// Winston Logger 생성
const logger = winston.createLogger({
  level: 'info', // 최소 로그 레벨 설정
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(), // 콘솔에 로그 출력
    new DailyRotateFile({
      filename: `${logDir}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});

module.exports = logger;
