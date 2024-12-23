const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const app = express();
const PORT = 8080;
const cors = require('cors');
const { sequelize } = require('./models');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

app.set('trust proxy', 1);  // 로드밸런서가 있을 경우 사용

// Redis
const redisClient = createClient({
    url: 'redis://localhost:6379' // Redis 서버 URL
    // url: `redis://${process.env.REDIS_HOST}:6379` // Redis 서버 URL
});
  
redisClient.connect().catch(console.error);

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
        maxAge: 60 * 60 * 1000, // 30분동안 세션 유지
      },
  })
);

app.use('/uploads', express.static(__dirname + '/uploads'));

// 메인
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// 공연 정보
const playRouter = require('./routes/play');
app.use("/play", playRouter);

// 예약 정보
const userRouter = require('./routes/user');
app.use("/user", userRouter);

// 좌석 정보
const seatRouter = require('./routes/seat');
app.use("/seat", seatRouter);

// 티켓 정보
const ticketRouter= require('./routes/ticket');
app.use("/ticket", ticketRouter);

// 서비스 평가
const surveyRouter = require('./routes/survey');
app.use("/survey", surveyRouter);

// 예매
const reservationRouter = require('./routes/reservation');
app.use("/reservation", reservationRouter);

// 관리자
const adminRouter = require('./routes/admin');
app.use("/admin", adminRouter);

app.get('*', (req, res) => {
  res.send('404');
});

sequelize.sync({force: false})
.then(()=>{
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    })
  }
);