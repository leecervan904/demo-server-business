## 原理




## 实现

相关依赖：
+ `express`：服务器
+ `cookie-parser`：提供服务器处理 cookie 的能力（`express-session` 已经内置）
+ `body-parser`：解析 post 请求的数据到 `req.body` 中
+ `express-session`：封装 cookie/session 的处理逻辑
+ `mongodb`/`connect-mongo`：作为 `express-session` 的 store
<!-- TODO -->
+ `redis`/`connect-redis`：作为 `express-session` 的 store


## express-session

初始化中间件：
```js
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')

const app = express()

app.use(session({
  // 加密串
  secret: 'keyboard cat',
  // 是否每次都保存 session（即使 session 没有变化），会影响服务器性能；若 store 实现了 touch() 方法建议设置为 false
  resave: false,
  // 仅在设置 req.session 时才会存储 session（建议），否则每次请求都会存储一个 session
  saveUninitialized: false,
  // 设置客户端的 cookie 名字，默认为 connect.id
  name: 'web_auth_session',
  // 对 cookie 的配置，类似 cookie-parser 的配置选项
  cookie: {
    // secure 为 true 时，仅能在 https 下工作？
    secure: false,
    // 该 cookie 只能由服务器设置，客户端无法修改
    httpOnly: true,
    // 最大有效期
    maxAge: 10 * 1000,
  },
  // 配置 store，默认会存储在内存中
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/test-session',
    autoRemove: 'interval',
    autoRemoveInterval: 0,
  }),
}))
```

初始化后，会解析请求的 cookie 中的 session 信息（读取 store）到 `req.session`

`req.session` 的常用属性/方法：
+ `req.session.id`/`req.sessionID`：只读，当前请求的 sessionID，每个请求都会有一个 sessionID，若 cookie 携带了 session 字段，则会解析为其存储的 id
+ `session.regenerate(cb(err))`: 通过 req.sessionID 销毁 store 中的 session，再重新生成 session 并保存
+ `session.save(cb(err))`: 通过 req.sessionID 保存为新的 session
+ `session.reload(cb(err))`: 通过 req.sessionID 加载 store 中的 session，不存在时抛出错误 err
+ `session.destroy(cb(err))`: 通过 req.sessionID 销毁 store 中的 session
+ `session.touch()`: 刷新 maxAge，一般不需要操作（由 store 实现）

备注：
+ `generate`：在用户登录时使用，用于销毁之前的 session，并初始化新的 session
+ `destroy`：在用户登出时使用，销毁用户 session
+ `reload`：在刷新 session 有效期时使用，前提是这个 session 还未过期
+ `save`：暂时没有发现使用场景？
