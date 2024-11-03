const express = require('express')
const app = express()
const PORT = 8080
const cors = require('cors');
const { sequelize } = require('./models');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// 메인 - 수정 예정
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

app.get('*', (req, res) => {
  res.send('404');
});

sequelize.sync({force: false}).then(()=>{
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    })
}
);