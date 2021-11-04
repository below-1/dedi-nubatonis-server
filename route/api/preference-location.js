const mongoose = require('mongoose')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const authCheck = require('../../plug/auth')
const { Session } = require('../../model/session')

const SessionNotFound = createError('FST_SESSION_NOT_FOUND', 'Session(id=%s) not found', 404)
const PreferenceNotFound = createError('FST_PREFERENCE_NOT_FOUND', 'Preference(gender=%s) not found', 404)

module.exports = async (fastify, options) => {

  fastify.post('/', {
    schema: {
      body: S.object()
        .prop('gender', S.string().enum(['man', 'woman']))
        .prop('sessionId', S.string())
        .prop('distance', S.number())
        .prop('transportation', S.string().enum(['bike', 'car', 'rental-car']))
        .prop('location', S.object()
          .prop('nama', S.string())
          .prop('longitude', S.string())
          .prop('latitude', S.string())
          .prop('price', S.string())
          .prop('waktu', S.number()))
    },
    handler: async (request, reply) => {
      const payload = request.body
      const sessionId = new mongoose.Types.ObjectId(payload.sessionId)
      const { gender } = payload
      const session = await Session.findById(sessionId)
      if (!session) {
        throw new SessionNotFound(payload.sessionId)
      }
      const preferenceIndex = session.prefs.findIndex(pref => pref.gender == gender)
      if (!preferenceIndex) {
        throw new PreferenceNotFound(gender)
      }
      sessions.prefs[preferenceIndex].push({
        location: payload.location,
        transportation: payload.transportation,
        distance: payload.distance
      })
      await session.save()
      reply.send({
        message: 'OK'
      })
    }
  })

}