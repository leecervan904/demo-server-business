const express = require('express')
const jwt = require('jsonwebtoken')
var { expressjwt } = require('express-jwt')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(cookieParser())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

const secret = 'iteheima No1 φ(*￣0￣)'
// app.use(
//   expressjwt({
//     secret,
//     algorithms: ['HS256'],
//   })
//   .unless({
//     path: [/^\/login|token/, /^\/token/],
//   })
// )

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

function generateAccessToken(username) {
  return jwt.sign({ username }, secret, { expiresIn: '60s' })
}

function generateRefreshToken(username) {
  return jwt.sign({ username }, secret, { expiresIn: '1800s' })
}

const users = {
  'lee': '123',
  'anna': '456',
}

app.post('/login', function (req, res) {
  const { username, password } = req.body
  if (!users[username]) {
    res.json({ code: 200, msg: 'fail: user not found!' })
  }
  if (users[username] !== password) {
    res.json({ code: 200, msg: 'fail: password error!' })
  }

  const accessToken = generateAccessToken(req.body.username)
  const refreshToken = generateRefreshToken(req.body.username)
  // res.cookie('__token', accessToken)
  res.json({
    status: 200,
    msg: 'login success.',
    accessToken,
    refreshToken,
  })
})

// refresh token
app.post('/token', (req, res) => {
  const { token } = req.body
  if (!token) return res.sendStatus(401)

  jwt.verify(token, secret, (err, user) => {
    if (err) res.sendStatus(401)
    const newToken = generateAccessToken(user.username)
    res.json({
      status: 200,
      msg: 'refresh token success.',
      accessToken: newToken,
    })
  })
})

app.get('/data', expressjwt({
  secret,
  algorithms: ['HS256'],
  getToken: req => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      return req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.__token) {
      return req.query.__token;
    }
    return null
  }
}), (req, res) => {
  res.json({
    status: 200,
    message: '获取用户信息成功',
    auth: req.auth,
    user: req.user,
  })
})

app.listen('3100', () => {
  console.log('Server is listen in http://127.0.0.1:3100')
})
