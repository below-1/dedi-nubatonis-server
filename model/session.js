const mongoose = require('mongoose')
const { schema: locationSchema } = require('./location')

const modelName = 'Session'

const schema = mongoose.Schema({
  createdAt: Date,
  userId: mongoose.ObjectId,
  man: String,
  woman: String,
  location: locationSchema
}, { collection: 'sessions' })

const Session = mongoose.model(modelName, schema)

module.exports = {
  Session,
  schema
}
