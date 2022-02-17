const mongoose = require('mongoose')
const authCheck = require('../../plug/auth')
const { Session } = require('../../model/session')
const { Location } = require('../../model/location')
const { User } = require('../../model/user')
const S = require('fluent-json-schema')
const createError = require('fastify-error')

module.exports = async (fastify, options) => {

	fastify.post('/:user_id', {
		schema: {
      description: 'create new survey result',
      tags: ['survey'],
      security: [
        {
          apiKey: ['user']
        }
      ],
      body: S.object()
      	.prop('answers', S.array().items(S.integer()).required())
    },
    preHandler: [authCheck],
		handler: async (request, reply) => {
			const _id = new mongoose.Types.ObjectId(request.params.user_id)
			const user = await User.findOne({ _id });
			const { answers } = request.body;
			user.survey = answers;
			await user.save();
			reply.send(user);
		}
	})

	fastify.get('/:user_id', {
		preHandler: [authCheck],
		handler: async (request, reply) => {
			const _id = new mongoose.Types.ObjectId(request.params.user_id)
			const user = await User.findOne({ _id });
			reply.send({
				survey: user.survey
			})
		}
	})

	fastify.get('/result', {
		handler: async (request, reply) => {
			const surveys = await User.find({ 
				survey: {
					$exists: true,
					$ne: null,
					$not: {
						$size: 0
					}
				} 
			}, 'nama survey');
			reply.send(surveys);
		}
	})
}