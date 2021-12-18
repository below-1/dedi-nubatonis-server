const mongoose = require('mongoose')

const modelName = 'User'
const schema = mongoose.Schema({
  nama: String,
  username: String,
  password: String,
  gender: {
    type: String,
    enum: ['man', 'woman']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'photographer']
  },
  survey: [Number],
  currentSession: {
  	type: String,
    ref: 'Session'
	}
}, { collection: 'users' })

const User = mongoose.model(modelName, schema)

module.exports = {
  User,
  schema
}
