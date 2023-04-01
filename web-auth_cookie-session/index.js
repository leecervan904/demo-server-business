const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const bodyParser = require('body-parser')
const MongoStore = require('connect-mongo')
// const { createClient } = require('redis')
// const RedisStore = require('connect-redis')(session)

const app = express()

// const redisClient = createClient({ legacyMode: true })
// redisClient.connect().catch(console.error)

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use(cookieParser())
app.use(session({
  name: 'web_auth_session',
  secret: 'keyboard cat',
  resave: false,
  // 仅在设置 req.session 时才会存储 session
  saveUninitialized: false,
  cookie: {
    // secure: true,
    secure: false,
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
  },
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/test-session',
    // autoRemove: true,
    autoRemove: 'interval',
    autoRemoveInterval: 0,
  }),
  // store: new RedisStore({ client: redisClient }),
}))

app.get('/', (req, res) => {
  res.json({
    code: 200,
    msg: 'hello world!',
    sid: req.sessionID,
    req_cookies: req.cookies,
    session: req.session,
  })
})

app.get('/logout', (req, res) => {
  req.session.destroy()
  res.json({
    code: 200,
    msg: '已退出登录',
  })
})

const users = {
  'lee': '123',
  'anna': '456',
}

app.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!users[username]) {
    res.json({ code: 200, msg: 'fail: user not found!' })
  }
  if (users[username] !== password) {
    res.json({ code: 200, msg: 'fail: password error!' })
  }

  console.log('regenerate before: ', req.sessionID)
  req.session.regenerate(err => {
    if (err) {
      res.json({ code: 200, msg: err.message })
    } else {
      req.session.user = {
        username,
        password,
        sid: req.sessionID,
      }
      res.json({ code: 200, msg: '登录成功', user: req.session })
      console.log('regenerate after:', req.sessionID)
    }
  })
})

app.get('/login', (req, res) => {
  const html = `
  <form method="POST">
    <p>username: <input type="text" name="username" /></p>
    <p>password: <input type="text" name="password" /></p>
    <button type="submit">Submit</button>
  </form>
  `
  res.type('html')
  res.end(html)
})

function authMiddleware(req, res, next) {
  /**
   * reload: 加载 store 中的 session
   * - 若无：登录失败，需要重新登录
   * - 若有：刷新 session，并更新 cookie 的 maxAge
   */
  console.log('auth sessionID', req.sessionID)
  req.session.reload(err => {
    if (err) {
      res.json({ code: 200, msg: `登录失败啦: ${err.message}` })
    } else {
      req.session._reset = Date.now()
      next()
    }
  })
}

app.get('/data', authMiddleware, (req, res) => {
  const { name } = req.query
  res.json({
    code: 200,
    msg: `Hi, ${name}!`,
    path: req.path,
    user: req.session.user,
    device: req.headers['user-agent'],
    cookie: req.cookies,
    session: req.session,
  })
})

app.listen(3100, () => {
  console.log('Server is listen in http://127.0.0.1:3100')
})
