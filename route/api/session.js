const mongoose = require('mongoose')
const authCheck = require('../../plug/auth')
const { Session } = require('../../model/session')
const S = require('fluent-json-schema')

module.exports = async (fastify, options) => {

  fastify.post('/', {
    preHandler: authCheck,
    schema: {
      description: 'create a session',
      tags: ['session'],
      security: [
        {
          apiKey: ['admin', 'user']
        }
      ]
    },
    handler: async (request, reply) => {
      const session = new Session({
        open: true,
        createdAt: new Date(),
        userId: new mongoose.Types.ObjectId(request.user._id),
        prefs: []
      })
      await session.validate()
      await session.save()
      reply.send(session)
    }
  })

  fastify.get('/', {
    schema: {
      querystring: S.object()
        .prop('after', S.string().format('date-time'))
        .prop('take', S.number().default(10))
    },
    handler: async (request, reply) => {
      const httpQuery = request.query
      let query = {}
      if (httpQuery.after) {
        query = {
          createdAt: {
            $gt: new Date(query.after)
          }
        }
      }
      Session.find(query, {}, { limit: httpQuery.take })
    }
  })

}