const mongoose = require('mongoose')

const modelName = 'Photographer'
const schema = mongoose.Schema({
  nama: String,
  summary: String,
  facebook: String,
  instagram: String,
  avatar: String,
  avatarUrl: String,
  avatarThumbnailUrl: String,
}, { collection: 'photographers' })

const Photographer = mongoose.model(modelName, schema)

module.exports = {
  Photographer,
  schema
}

