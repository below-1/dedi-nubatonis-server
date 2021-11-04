const mongoose = require('mongoose')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const authCheck = require('../../plug/auth')
const { Session } = require('../../model/session')

const SessionNotFound = createError('FST_SESSION_NOT_FOUND', 'Session(id=%s) not found', 404)

module.exports = async (fastify, options) => {

  fastify.post('/', {
    preHandler: authCheck,
    schema: {
      description: 'Create preference for a session',
      tags: ['session', 'preference'],
      body: S.object()
        .prop('sessionId', S.string())
        .prop('name', S.string())
        .prop('gender', S.string({ enum: ['man', 'woman', 'other'] })),
      security: [
        {
          apiKey: ['admin', 'user']
        }
      ]
    },
    handler: async (request, reply) => {
      const payload = request.body
      const sessionId = new mongoose.Types.ObjectId(payload.sessionId)
      const session = await Session.findById(sessionId)
      if (!session) {
        throw new SessionNotFound(payload.sessionId)
      }
      session.prefs.push({
        name: payload.name,
        gender: payload.gender,
        locations: []
      })
      await session.validate()
      await session.save()
      reply.send(session)
    }
  })

}