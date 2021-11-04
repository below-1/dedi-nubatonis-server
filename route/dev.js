const mongoose = require('mongoose')

module.exports = async (fastify, options) => {

  fastify.get('/drop-db', {
    handler: async (request, reply) => {
      const { db } = mongoose.connection
      const dropResult = await db.dropDatabase()
      reply.send({
        message: 'OK'
      })
    }
  })

}
