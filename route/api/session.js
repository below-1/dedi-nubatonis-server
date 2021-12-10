const mongoose = require('mongoose')
const authCheck = require('../../plug/auth')
const { Session } = require('../../model/session')
const { Location } = require('../../model/location')
const S = require('fluent-json-schema')
const createError = require('fastify-error')

const SessionNotFound = createError('FST_LOCATION_NOT_FOUND', 'Session(id=%s) not found', 404)

module.exports = async (fastify, options) => {

  fastify.get('/stat', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [
        {
          apiKey: ['admin', 'user']
        }
      ],
      querystring: S.object()
        .prop('take', S.number().default(10))
    },
    preHandler: [authCheck],
    handler: async (request, reply) => {
      const locations = await Location.find().exec();
      const baseResults = [];
      for (let loc of locations) {
        baseResults.push({
          _id: loc.nama,
          total: 0
        });
      }

      const aggs = await Session.aggregate([{ $group:  { _id: "$location.nama", total: { $sum: 1 }} }]);
      reply.send(aggs);
    }
  })

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
    preHandler: [authCheck],
    handler: async (request, reply) => {
      const payload = request.body
      const session = new Session({
        createdAt: new Date(),
        man: payload.man,
        woman: payload.woman,
        location: payload.location,
        userId: new mongoose.Types.ObjectId(request.user._id),
      })
      await session.validate()
      await session.save()
      reply.send(session)
    }
  })

  fastify.get('/', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [
        {
          apiKey: ['admin', 'user']
        }
      ],
      querystring: S.object()
        .prop('take', S.number().default(10))
    },
    preHandler: [authCheck],
    handler: async (request, reply) => {
      const user = request.user
      const id = new mongoose.Types.ObjectId(user._id)
      const httpQuery = request.query
      let query = {}
      if (user.role != 'admin') {
        query = {
          userId: id
        }
      }
      const items = await Session.find(query, {}, { limit: httpQuery.take }).exec()
      reply.send(items)
    }
  })

  fastify.delete('/:id', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [
        {
          apiKey: ['admin', 'user']
        }
      ],
      params: S.object()
        .prop('id', S.string()),
    },
    handler: async (request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const result = await Session.deleteOne({
        _id: id
      })
      if (result.deletedCount != 1) {
        throw new SessionNotFound(request.params.id)
      }
      reply.send({
        status: 'OK'
      })
    }
  })

}