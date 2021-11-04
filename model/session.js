const mongoose = require('mongoose')
const { schema: locationSchema } = require('./location')

const modelName = 'Session'

const locationPrefSchema = mongoose.Schema({
  location: locationSchema,
  distance: Number,
  transportation: {
    type: String,
    enum: ['bike', 'car', 'rental-car']
  }
})

const preferenceSchema = mongoose.Schema({
  name: String,
  gender: {
    type: String,
    enum: ['man', 'woman']
  },
  locations: [locationPrefSchema]
})

const schema = mongoose.Schema({
  createdAt: Date,
  userId: mongoose.ObjectId,
  prefs: [preferenceSchema],
  open: Boolean
}, { collection: 'sessions' })

const Session = mongoose.model(modelName, schema)

module.exports = {
  Session,
  schema
}
