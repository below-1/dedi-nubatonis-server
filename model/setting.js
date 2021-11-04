const mongoose = require('mongoose')

const modelName = 'Setting'
const criteriaSchema = mongoose.Schema({
  weight: Number,
  type: {
    type: String,
    enum: ['cost', 'benefit']
  }
})

const schema = mongoose.Schema({
  criteria: {
    distance: criteriaSchema,
    numberOfSpots: criteriaSchema,
    price: criteriaSchema,
    transportation: criteriaSchema,
    theme: criteriaSchema,
    time: criteriaSchema
  }
})

const Setting = mongoose.model(modelName, schema)

module.exports = {
  Setting,
  schema
}