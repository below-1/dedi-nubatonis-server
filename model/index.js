const mongoose = require('mongoose')

module.exports = function () {
  require('./user')
  require('./location')
  require('./session')
  require('./settings')
}