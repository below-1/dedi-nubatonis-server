const mongoose = require('mongoose')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const authCheck = require('../../plug/auth')
const { Photographer } = require('../../model/photographer')

const PhotographerNotFound = createError('FST_PHOTOGRAPHER_NOT_FOUND', 'Photographer(id=%s) not found', 404)

module.exports = async (fastify, options) => {

  fastify.post('/', {
    preHandler: [authCheck],
    schema: {
      description: 'Create location',
      tags: ['location'],
      body: S.object()
        .prop('nama', S.string())
        .prop('summary', S.string())
        .prop('facebook', S.string())
        .prop('instagram', S.string())
        .prop('avatar', S.string()),
      security: [
        {
          apiKey: ['admin']
        }
      ]
    },
    handler: async (request, reply) => {
      const payload = request.body
      const doc = new Photographer({
        ...payload
      })
      await doc.validate()
      await doc.save()
      reply.send(doc)
    }
  })

  fastify.get('/', {
    schema: {
      description: 'List Photographer',
      tags: ['photographer']
    },
    handler: async (request, reply) => {
      const result = await Photographer.find().exec()
      reply.send(result)
    }
  })

  fastify.put('/:id', {
    preHandler: [authCheck],
    schema: {
      description: 'Update Photographer',
      tags: ['photographer'],
      params: S.object()
        .prop('id', S.string()),
      body: S.object()
        .prop('nama', S.string())
        .prop('summary', S.string())
        .prop('facebook', S.string())
        .prop('instagram', S.string())
        .prop('avatar', S.string()),
      security: [
        {
          apiKey: ['admin']
        }
      ]
    },
    handler: async (request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const doc = await Photographer.findById(id)
      if (!doc) {
        throw new PhotographerNotFound(request.params.id)
      }
      const payload = request.body
      doc.set(payload)
      await doc.save()
      reply.send(doc)
    }
  })

  fastify.delete('/:id', {
    schema: {
      description: 'Remove Photographer',
      tags: ['Photographer'],
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
      const result = await Photographer.deleteOne({
        _id: id
      })
      if (result.deletedCount != 1) {
        throw new PhotographerNotFound(request.params.id)
      }
      reply.send({
        status: 'OK'
      })
    }
  })

  fastify.get('/:id', {
    schema: {
      description: 'Find photographer',
      tags: ['photographer'],
      params: S.object()
        .prop('id', S.string())
    },
    handler: async (request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const result = await Photographer.findById(id)
      reply.send(result)
    }
  })

}