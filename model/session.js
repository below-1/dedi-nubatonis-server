const mongoose = require('mongoose')
const { schema: locationSchema } = require('./location')

const modelName = 'Session'
const SessionStatus = {
    OPEN: 'OPEN',
    VALIDATING: 'VALIDATING',
    SECOND: 'SECOND',
    THIRD: 'THIRD',
    DONE: 'DONE'
}

const schema = mongoose.Schema({
    createdAt: Date,    // CREATION DATE OF THE SESSION

    user: { type: mongoose.ObjectId, ref: 'User' },
    man: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    woman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    photographer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    weights: {
        man: Object,
        woman: Object,
        photographer: Object
    },

    date: Date,     // WHEN THE PHOTO SESSION TAKING PLACE
    status: String, // OPEN, VALIDATING, SECOND, THIRD, DONE
    token: String,  // 8 CHARACTERS UNIQUE
    location: locationSchema,   // SELECTED LOCATION
    borda: Number,              // BORDA OUTPUT VALUE

}, { collection: 'sessions', timestamps: true })

const Session = mongoose.model(modelName, schema)

module.exports = {
    Session,
    schema,
    SessionStatus
}