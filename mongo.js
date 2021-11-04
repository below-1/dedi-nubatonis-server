const fp = require('fastify-plugin')
const mongoose = require('mongoose')

module.exports = fp(async (fastify, options) => {
  await mongoose.connect(options.MONGODB_URI)
  fastify.log.info('mongo connection established')
  require('./model')
  fastify.log.info('models initiated')
})
