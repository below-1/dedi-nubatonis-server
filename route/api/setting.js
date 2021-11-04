const mongoose = require('mongoose')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const authCheck = require('../../plug/auth')
const { Setting } = require('../../model/setting')

const criteriaJsSchema = S.object()
  .prop('weight', S.integer().minimum(0).maximum(4))
  .prop('type', S.string().enum(['cost', 'benefit']))

const SettingNotFound = createError('FST_SETTING_NOT_FOUND', "Setting can't be found", 500)

module.exports = async (fastify, options) => {

  fastify.put('/weights', {
    schema: {
      body: S.object()
        .prop('distance', criteriaJsSchema)
        .prop('numberOfSpots', criteriaJsSchema)
        .prop('price', criteriaJsSchema)
        .prop('transportation', criteriaJsSchema)
        .prop('theme', criteriaJsSchema)
        .prop('time', criteriaJsSchema)
    },
    handler: async (request, reply) => {
      await Setting.deleteMany({})
      let setting = await Setting.findOne({}).exec()
      if (!setting) {
        throw new SettingNotFound()
      }
      setting.criteria = request.body
      await setting.validate()
      await setting.save()
      reply.send(setting.criteria)
    }
  })

  fastify.get('/weights', {
    handler: async (request, reply) => {
      const setting = await Setting.findOne({}).exec()
      let result = {
        distance: 1,
        numberOfSpots: 4,
        price: 4,
        transportation: 3,
        theme: 4,
        time: 2
      }
      if (setting) {
        result = setting.criteria
      }
      reply.send(result)
    }
  })

}
