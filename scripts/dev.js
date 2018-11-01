process.env.NODE_ENV = 'development'

const webpack = require('webpack')
const webpackDev = require('webpack-dev-middleware')
const webpackHot = require('webpack-hot-middleware')
const {PassThrough} = require('stream')

const devMiddleware = (compiler, opts) => {
  const middleware = webpackDev(compiler, opts)
  return async (ctx, next) => {
      await middleware(ctx.req, {
          end: (content) => {
              ctx.body = content
          },
          setHeader: (name, value) => {
              ctx.set(name, value)
          }
      }, next)
  }
}

const hotMiddleware = (compiler, opts) => {
  const middleware = webpackHot(compiler, opts);
  return async (ctx, next) => {
      let stream = new PassThrough()
      ctx.body = stream
      await middleware(ctx.req, {
        end: (content) => {
            ctx.body = content
        },
        write: stream.write.bind(stream),
        writeHead: (status, headers) => {
            ctx.status = status
            ctx.set(headers)
        }
      }, next)
  } 
}

let notCompileWeb = false
for (const arg of process.argv) {
  if (arg === '--no-web') {
    notCompileWeb = true
    break
  }
}

const app = require('../src/server/app')

if (!notCompileWeb) {
  const rendererConfig = require('../webpack.config')

  for (const k in rendererConfig.entry) {
    rendererConfig.entry[k] = ['webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true'].concat([rendererConfig.entry[k]])
  }

  const compiler = webpack(rendererConfig)
  app.use(devMiddleware(compiler))
  app.use(hotMiddleware(compiler))
}
