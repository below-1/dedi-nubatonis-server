const mongoose = require('mongoose')

const modelName = 'User'
const schema = mongoose.Schema({
  nama: String,
  username: String,
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'photographer']
  },
  survey: [Number],
  currentSession: {
  	step: Number,
  	items: [{
		  name: String,
		  gender: String,
		  weights: Object
	  }]
	}
}, { collection: 'users' })

const User = mongoose.model(modelName, schema)

module.exports = {
  User,
  schema
}
