const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../model/user')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const checkUser = require('../plug/auth')
const { uploadBase64 } = require('../imageUpload')

const UserNotFound = createError('FST_USER_NOT_FOUND', "User with username=%s can't be found", 500)
const PasswordNotMatch = createError('FST_PASSWORD_NOT_MATCH', "Password not match", 500)

module.exports = async (fastify, options) => {

  const jwtKey = options.JWT_KEY

  fastify.post('/login', {
    schema: {
      body: S.object()
        .prop('username', S.string())
        .prop('password', S.string()),
      description: 'Login into system and get the auth token'
    },
    handler: async (request, reply) => {
      const { username, password } = request.body
      const user = await User.findOne({ username }).exec()
      if (!user) {
        throw new UserNotFound(username)
      }
      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        throw new PasswordNotMatch()
      }
      const payload = user.toObject()
      delete payload.password
      delete payload.avatar
      const token = await jwt.sign(payload, jwtKey)
      reply.send(token)
    }
  })

  fastify.post('/signup', {
    schema: {
      body: S.object()
        .prop('username', S.string())
        .prop('password', S.string())
        .prop('role', S.string())
        .prop('gender', S.string())
        .prop('nama', S.string()),
      description: 'Signup'
    },
    handler: async (request, reply) => {
      const { 
        username, 
        password,
        nama,
        role,
        gender
      } = request.body
      const hashedPassword = await bcrypt.hash(password, 2)
      const user = new User({
        username,
        password: hashedPassword,
        nama,
        role,
        gender
      })
      try {
        await user.validate()
        await user.save()
        reply.send(user)
      } catch (err) {
        console.log(err)
        reply.code(500).send({
          message: 'error when creating user'
        })
      }
    }
  })

  fastify.get('/me', {
    schema: {
      description: 'Get information about current user',
      tags: ['auth'],
      security: [
        { apiKey: ['admin', 'user', 'photographer'] }
      ],
    },
    preHandler: [checkUser],
    handler: async (request, reply) => {
      const user = await User
        .findOne({ _id: request.user._id })
        .populate('currentSession');
      reply.send(user);
    }
  })

  fastify.put('/me', {
    schema: {
      description: 'Update information about current user',
      tags: ['auth'],
      security: [
        { apiKey: ['admin', 'user', 'photographer'] }
      ],
    },
    preHandler: [checkUser],
    handler: async (request, reply) => {
      let { avatar, ...payload } = request.body
      const user = await User.findOne({ _id: request.user._id })

      if (avatar) {
        const imageUrlData = await uploadBase64(avatar)
        user.avatarUrl = imageUrlData.avatarUrl
        user.avatarThumbnailUrl = imageUrlData.avatarThumbnailUrl
      }

      user.nama = payload.nama
      await user.save()

      reply.send(user)
    }
  })
}
