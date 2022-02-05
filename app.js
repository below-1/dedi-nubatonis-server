const Fastify = require('fastify')
const prettifier = require('@mgcrea/pino-pretty-compact');
const blipp = require('fastify-blipp')
const cors = require('fastify-cors')
const swagger = require('fastify-swagger')
const mongo = require('./mongo')
const authRoute = require('./route/auth')
const appRoute = require('./route/api')

module.exports = (env) => {
  const fastify = Fastify({
    // logger: { prettyPrint: true, prettifier }
  })
  // console.log(fastify)
  fastify.register(blipp)
  fastify.register(swagger, {
    routePrefix: '/documentation',
    exposeRoute: true,
    swagger: {
      info: {
        title: 'Quick Photography API',
        version: '0.0.0'
      },
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'authorization',
          in: 'header'
        }
      }
    }
  })
  fastify.register(cors)
  fastify.register(mongo, {
    MONGODB_URI: env.MONGODB_URI
  })
  fastify.register(authRoute, { 
    prefix: '/auth',
    JWT_KEY: env.JWT_KEY
  })
  fastify.register(appRoute, { 
    prefix: '/v1/api'
  })
  if (env.NODE_ENV == 'development') {
    fastify.register(require('./route/dev'), {
      prefix: '/dev'
    })
  }

  return fastify
}

