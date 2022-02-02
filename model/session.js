const mongoose = require('mongoose')
const { schema: locationSchema } = require('./location')

const modelName = 'Session'

const schema = mongoose.Schema({
    createdAt: Date,

    user: { type: mongoose.ObjectId, ref: 'User' },
    man: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    woman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    photographer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    weights: {
        man: Object,
        woman: Object,
        photographer: Object
    },

    summary: String,
    facebook: String,
    instagram: String,
    avatar: String,

    date: Date,
    token: String,
    location: locationSchema,
    borda: Number,
    status: String,

}, { collection: 'sessions', timestamps: true })

const Session = mongoose.model(modelName, schema)

module.exports = {
    Session,
    schema
}