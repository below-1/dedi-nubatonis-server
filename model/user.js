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
        enum: ['user', 'admin', 'photographer', 'spouse']
    },

    // Photographer data
    summary: String,
    facebook: String,
    instagram: String,

    survey: [Number],
    avatar: String,
    avatarUrl: String,
    avatarThumbnailUrl: String,
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