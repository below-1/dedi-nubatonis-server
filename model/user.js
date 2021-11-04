const mongoose = require('mongoose')

const modelName = 'User'
const schema = mongoose.Schema({
  nama: String,
  username: String,
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'photographer']
  }
}, { collection: 'users' })

const User = mongoose.model(modelName, schema)

module.exports = {
  User,
  schema
}
