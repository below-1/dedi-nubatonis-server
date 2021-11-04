const fp = require('fastify-plugin')
const createError = require('fastify-error')
const jwt = require('jsonwebtoken')

const NoAuthHeader = createError('FST_UNAUTHORIZED', 'No auth header provided', 401)
const UserNotFound = createError('FST_USER_NOT_FOUND', "User not found", 500)

async function checkUser(request, reply) {
  const authHeader = request.headers.authorization
  if (!authHeader) {
    throw NoAuthHeader()
  }
  const [ _, token ] = authHeader.split(' ')
  const user = jwt.decode(token)
  if (!user) {
    throw UserNotFound()
  }
  request.user = user
}

module.exports = checkUser