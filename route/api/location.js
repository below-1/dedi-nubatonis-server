const { Location } = require('../../model/location')
const authCheck = require('../../plug/auth')
const S = require('fluent-json-schema')
const mongoose = require('mongoose')
const createError = require('fastify-error')
const { uploadBase64 } = require('../../imageUpload');

const LocationNotFound = createError('FST_LOCATION_NOT_FOUND', 'Location(id=%s) not found', 404)

module.exports = async (fastify, options) => {

  fastify.post('/', {
    preHandler: [authCheck],
    schema: {
      description: 'Create location',
      tags: ['location'],
      body: S.object()
        .prop('nama', S.string())
        .prop('distance', S.number())
        .prop('transportation', S.string())
        .prop('longitude', S.string())
        .prop('latitude', S.string())
        .prop('price', S.string())
        .prop('waktu', S.number()),
      security: [
        {
          apiKey: ['admin']
        }
      ]
    },
    handler: async (request, reply) => {
      let { avatar, ...payload } = request.body
      if (avatar) {
        const imageUrlData = await uploadBase64(avatar)
        payload = { ...payload, ...imageUrlData }
      }
      const doc = new Location({
        ...payload
      })
      await doc.validate()
      await doc.save()
      reply.send(doc)
    }
  })

  fastify.get('/', {
    schema: {
      description: 'List location',
      tags: ['location']
    },
    handler: async (request, reply) => {
      const result = await Location.find().exec()
      reply.send(result)
    }
  })

  fastify.put('/:id', {
    preHandler: [authCheck],
    schema: {
      description: 'Update location',
      tags: ['location'],
      params: S.object()
        .prop('id', S.string()),
      body: S.object()
        .prop('nama', S.string())
        .prop('distance', S.number())
        .prop('transportation', S.string())
        .prop('longitude', S.string())
        .prop('latitude', S.string())
        .prop('price', S.string())
        .prop('waktu', S.number())
        .prop('avatar', S.string()),
      security: [
        {
          apiKey: ['admin']
        }
      ]
    },
    handler: async (request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const doc = await Location.findById(id)
      if (!doc) {
        throw new LocationNotFound(request.params.id)
      }
      let { avatar, ...payload } = request.body
      if (avatar) {
        const imageUrlData = await uploadBase64(avatar)
        payload = {...payload, ...imageUrlData }
      }

      doc.overwrite(payload)
      await doc.save()
      reply.send(doc)
    }
  })

  fastify.delete('/:id', {
    schema: {
      description: 'Remove location',
      tags: ['location'],
      params: S.object()
        .prop('id', S.string()),
      security: [
        {
          apiKey: ['admin']
        }
      ]
    },
    handler: async (request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const result = await Location.deleteOne({
        _id: id
      })
      if (result.deletedCount != 1) {
        throw new LocationNotFound(request.params.id)
      }
      reply.send({
        status: 'OK'
      })
    }
  })

  fastify.get('/:id', {
    schema: {
      description: 'Find location',
      tags: ['location'],
      params: S.object()
        .prop('id', S.string())
    },
    handler: async (request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const result = await Location.findById(id)
      reply.send(result)
    }
  })

}