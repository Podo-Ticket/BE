const express = require('express')
const session = require('express-session')
const app = express()
const PORT = 8080
const cors = require('cors');
const { sequelize } = require('./models');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

// 세션 설정
app.use(
  session({
      name: 'session ID',
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: true,
      store: new fileStore(),
      cookie: {
          httpOnly: true,
          maxAge: 30 * 60 * 1000, // 30분동안 세션 유지
          signed: true, // 암호화 쿠키 사용
      },
      sameSite: 'none',
      secure: true,
  })
);

// 메인 - 수정 예정
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

app.get('*', (req, res) => {
  res.send('404');
});

sequelize.sync({force: false}).then(()=>{
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    })
}
);