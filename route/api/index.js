module.exports = async (fastify, options) => {
  fastify.register(require('./location'), { prefix: '/locations' })
  fastify.register(require('./photographer'), { prefix: '/photographers' })
  fastify.register(require('./session'), { prefix: '/sessions' })
  fastify.register(require('./preference'), { prefix: '/preferences' })
  fastify.register(require('./preference-location'), { prefix: '/preference-locations' })
  fastify.register(require('./setting'), { prefix: '/settings' })
  fastify.register(require('./survey'), { prefix: '/survey' })
}