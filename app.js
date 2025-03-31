const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const app = express();
const PORT = 8080;
const cors = require('cors');
const { sequelize } = require('./models');
const { swaggerUi, specs } = require('./swagger/swagger');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// express 애플리케이션에 프록시 서버를 믿을 수 있다고 알려주는 것
// express는 요청 헤더의 X-Forwarded-Proto 값을 사용하여 원래 프로토콜을 복원
app.set('trust proxy', true); // 로드밸런서가 있을 경우 사용

// Redis
const redisClient = createClient({
  url: 'redis://localhost:6379', // Redis 서버 URL
});

redisClient.connect().catch(console.error);

const RedisStore = require('connect-redis').default;
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.url}`);
  logger.info(`Headers: ${JSON.stringify(req.headers)}`);
  logger.info(`Body: ${JSON.stringify(req.body)}`);
  next();
});

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: new RedisStore({ client: redisClient }),
    cookie: {
      name: 'session_ID',
      httpOnly: true,
      maxAge: 90 * 60 * 1000, // 90분 동안 세션 유지
    },
  })
);

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/uploads', express.static(__dirname + '/uploads'));

// 메인
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// 공연 정보
const playRouter = require('./routes/play');
app.use('/play', playRouter);

// 예약 정보
const userRouter = require('./routes/user');
app.use('/user', userRouter);

// 좌석 정보
const seatRouter = require('./routes/seat');
app.use('/seat', seatRouter);

// 티켓 정보
const ticketRouter = require('./routes/ticket');
app.use('/ticket', ticketRouter);

// 서비스 평가
const surveyRouter = require('./routes/survey');
app.use('/survey', surveyRouter);

// 예매
const reservationRouter = require('./routes/reservation');
app.use('/reservation', reservationRouter);

// 관리자
const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

app.get('*', (req, res) => {
  res.send('404');
});

let server;

/// 서버 실행
sequelize.sync({ force: false }).then(() => {
  // HTTP 서버 생성
  server = http.createServer(app);

  // WebSocket 설정
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // WebSocket 객체를 app에 저장하여 다른 모듈에서 접근할 수 있도록 함
  app.set('io', io);

  // WebSocket 이벤트 처리
  io.on('connection', (socket) => {
    console.log(`사용자 연결됨: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`사용자 연결 해제: ${socket.id}`);
    });
  });

  // 서버 실행
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});
