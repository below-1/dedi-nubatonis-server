const mongoose = require('mongoose')

const modelName = 'Location'
const schema = mongoose.Schema({
  nama: String,
  latitude: String,
  longitude: String,
  avatar: String,
  photos: {
    type: {
      description: String,
      url: String,
    }
  },
  price: mongoose.Decimal128,
  theme: {
    type: String,
    enum: ['outdoor', 'indoor']
  },
  waktu: Number,
  numberOfSpots: Number
}, { collection: 'locations' })

const Location = mongoose.model(modelName, schema)

module.exports = {
  Location,
  schema
}
