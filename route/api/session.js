const mongoose = require('mongoose')
const authCheck = require('../../plug/auth')
const { Session, SessionStatus } = require('../../model/session')
const { User } = require('../../model/user')
const { Location } = require('../../model/location')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const randomstring = require('randomstring');

const SessionNotFound = createError('SESSION_NOT_FOUND', 'Session(id=%s) not found', 404);
const PhotographerExists = createError('PHOTOGRAPHER_EXISTS', 'Photographer exists for Session(id=%s)', 400);
const SessionNotComplete = createError('SESSION_NOT_COMPLETE', 'Session(id=%s) not complete');

function sessionIsComplete() {
  
}

module.exports = async(fastify, options) => {

  fastify.get('/stat', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }],
      querystring: S.object()
      .prop('take', S.number().default(10))
    },
    preHandler: [authCheck],
    handler: async(request, reply) => {
      const locations = await Location.find().exec();
      const baseResults = [];
      for (let loc of locations) {
        baseResults.push({
          _id: loc.nama,
          total: 0
        });
      }

      const aggs = await Session.aggregate([{ $group: { _id: "$location.nama", total: { $sum: 1 } } }]);
      reply.send(aggs);
    }
  })

  fastify.post('/', {
    schema: {
      description: 'create a session',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }]
    },
    preHandler: [authCheck],
    handler: async(request, reply) => {
      const { user } = request;
            // Generate token here
            const token = randomstring.generate(8);
            // Status is OPEN at creation
            const status = SessionStatus.OPEN;
            let session = new Session({
              user: new mongoose.Types.ObjectId(user._id),
              token,
              status
            });

            const targetUser = await User.findOne({ _id: user._id });

            if (targetUser.gender == 'man') {
              session.man = user._id;
            } else {
              session.woman = user._id;
            }

            // await session.validate();
            await session.save();

            targetUser.currentSession = session._id;

            await targetUser.save();

            reply.send(session);
          }
        })

  fastify.put('/:id', {
    schema: {
      description: 'create a session',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }]
    },
    preHandler: [authCheck],
    handler: async(request, reply) => {
      const sessionId = new mongoose.Types.ObjectId(request.params.id);
      const { user } = request;
      const session = await Session.findOne({ _id: sessionId });
      const weights = request.body;

      if (!session.weights) {
        session.weights = {};
      }

      if (user.role == 'user') {
        if (user.gender == 'man') {
          session.weights.man = weights;
          session.man = user._id;
        } else {
          session.weights.woman = weights;
          session.woman = user._id;
        }
      } else if (user.role == 'photographer') {
                // This must be photographer
                session.weights.photographer = weights;
                session.photographer = user._id;
              }

              await session.save();

              const sessWeights = session.weights;
              const allDone = (sessWeights.man && sessWeights.woman && sessWeights.photographer);
              const response = {
                complete: allDone,
                weights: sessWeights
              };

              reply.send(response);
            }
          })

  fastify.put('/:id/result', {
    schema: {
      description: 'update session result',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }],
      body: S.object()
      .prop('location', S.object())
      .prop('borda', S.number())
    },
    preHandler: [authCheck],
    handler: async(request, reply) => {
      const sessionId = new mongoose.Types.ObjectId(request.params.id);
      const { user } = request;

      const session = await Session.findOne({ _id: sessionId });
      if (!session) {
        throw new SessionNotFound(sessionId);
      }
      const sessWeights = session.weights;
      if (!sessWeights) {
        throw new SessionNotComplete(sessionId);
      }

      const complete = (sessWeights.man && sessWeights.woman && sessWeights.photographer);
      if (!complete) {
        throw new SessionNotComplete(sessionId);
      }

      const { location, borda } = request.body;
      session.location = location;
      session.borda = borda;
      session.complete = true;

      const owner = await User.findById(session.user);
      owner.currentSession = null;
      await owner.save();

      await session.save();
      reply.send(session);
    }
  })

  fastify.put('/:id/photographer', {
    schema: {
      description: 'update session photographer',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }],
      body: S.object()
        .prop('photographer', S.string().required())
    },
    preHandler: [authCheck],
    handler: async (request, reply) => {
      const sessionId = new mongoose.Types.ObjectId(request.params.id);
      const session = await Session.findOne({ _id: sessionId });
      if (!session) {
        throw new SessionNotFound(sessionId);
      }
      if (session.photographer) {
        throw new PhotographerExists(sessionId);
      }
      const photographerId = new mongoose.Types.ObjectId(request.body.photographer);
      session.photographer = photographerId;
      await session.save();
      reply.send(session);
    }
  })

  fastify.get('/', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }],
      querystring: S.object()
      .prop('take', S.number().default(10))
    },
    preHandler: [authCheck],
    handler: async(request, reply) => {
      const user = request.user
      const id = new mongoose.Types.ObjectId(user._id)
      const httpQuery = request.query
      let query = {}
      if (user.role != 'admin') {
        query = {
          userId: id
        }
      }
      const items = await Session.find(query)
      .populate('user')
      .populate('man')
      .populate('woman')
      .populate('photographer')
      .limit(httpQuery.take)
      .sort('-createdAt')
      .exec()
      reply.send(items)
    }
  })

  fastify.delete('/:id', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user']
      }],
      params: S.object()
      .prop('id', S.string()),
    },
    handler: async(request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const session = await Session.findById(id);
      const user = await User.findById(session.user);
      user.currentSession = null;
      await Session.findByIdAndDelete(id);
      await user.save();
      reply.send({
        status: 'OK'
      })
    }
  })

  fastify.get('/by-token/:token', {
    schema: {
      description: 'get session by token',
      tags: ['session'],
      params: S.object()
      .prop('token', S.string()),
    },
    handler: async(request, reply) => {
      const { token } = request.params
      const result = await Session.findOne({
        token
      })
      .populate('user')
      .populate('man')
      .populate('woman')
      .populate('photographer')
      reply.send(result)
    }
  })

  fastify.put('/by-token/:token', {
    schema: {
      description: 'get session by token',
      tags: ['session'],
      params: S.object()
      .prop('token', S.string())
    },
    handler: async(request, reply) => {
      const { token } = request.params
      const { nama, avatar, ...weights } = request.body

      const session = await Session
        .findOne({ token })
        .populate('user')
      if (!session) {
        throw new SessionNotFound(token);
      }
      const creatorGender = session.user.gender;
      const spouseGender = creatorGender == 'man' ? 'woman' : 'man';

      // Create new user
      const spouse = new User({
        nama,
        gender: spouseGender,
        avatar
      });
      await spouse.save()
      console.log(`spouseGender = ${spouseGender}`)

      session[spouseGender] = spouse._id;
      session.weights[spouseGender] = weights;

      await session.save();
      reply.send(session);
    }
  })

  fastify.get('/:id', {
    schema: {
      description: 'list session',
      tags: ['session'],
      security: [{
        apiKey: ['admin', 'user', 'photographer']
      }],
      params: S.object()
      .prop('id', S.string()),
    },
    handler: async(request, reply) => {
      const id = new mongoose.Types.ObjectId(request.params.id)
      const result = await Session.findOne({
        _id: id
      })
      .populate('user')
      .populate('man')
      .populate('woman')
      .populate('photographer')
      reply.send(result)
    }
  })

  fastify.post('/current', {
    preHandler: authCheck,
    handler: async(request, reply) => {
      const userId = new mongoose.Types.ObjectId(request.user._id);
      let user = await User.findOne({ _id: userId });
      console.log('request.body');
      console.log(request.body);
      user.currentSession = request.body;
      console.log(user.currentSession);
      await user.save();
      reply.send({
        message: 'OK'
      })
    }
  })

  fastify.get('/current', {
    preHandler: authCheck,
    handler: async(request, reply) => {
      const userId = new mongoose.Types.ObjectId(request.user._id);
      let user = await User.findOne({ _id: userId });
      reply.send(user.currentSession);
    }
  })

}