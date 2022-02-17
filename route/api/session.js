const mongoose = require('mongoose')
const authCheck = require('../../plug/auth')
const { Session, SessionStatus } = require('../../model/session')
const { User } = require('../../model/user')
const { Location } = require('../../model/location')
const S = require('fluent-json-schema')
const createError = require('fastify-error')
const randomstring = require('randomstring');

const SessionNotFound = createError('SESSION_NOT_FOUND', 'Sesi tidak ditemukan', 404);
const TokenNotFound = createError('TOKEN_NOT_FOUND', 'Token tidak ditemukan', 404);
const PhotographerExists = createError('PHOTOGRAPHER_EXISTS', 'Photographer exists for Session(id=%s)', 400);
const SessionNotComplete = createError('SESSION_NOT_COMPLETE', 'Session(id=%s) not complete');

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
      }],
      body: S.object()
        .prop('date', S.string().format('date'))
    },
    preHandler: [authCheck],
    handler: async(request, reply) => {
      const { user } = request;
      const { body } = request;
      // Generate token here
      const token = randomstring.generate(8);
      // Status is OPEN at creation
      const status = SessionStatus.OPEN;

      const date = new Date(body.date);

      let session = new Session({
        user: new mongoose.Types.ObjectId(user._id),
        token,
        status,
        date
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

  fastify.put('/:id/weights', {
    schema: {
      description: 'update session weights',
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

      const sessWeights = session.weights;
      const allWeightsDone = (sessWeights.man && sessWeights.woman && sessWeights.photographer);
      if (allWeightsDone) {
        session.status = SessionStatus.READY;
      }
      await session.save();
      reply.send(session);
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
      session.status = SessionStatus.DONE;

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

      if (user.role == 'user') {
        query = {
          user: id
        }
      } else if (user.role == 'photographer') {
        query = {
          photographer: id
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
      if (!result) {
        throw new TokenNotFound()
      } else {
        reply.send(result)
      }
    }
  })

  fastify.put('/by-token/:token', {
    schema: {
      description: 'update session by token. Create ghost user',
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
        .populate();

      if (!session) {
        throw new SessionNotFound(token);
      }

      const creatorGender = session.user.gender;
      const spouseGender = creatorGender == 'man' ? 'woman' : 'man';

      console.log('session')
      console.log(session)

      let spouse = null;
      // Check if the spouse is already exists
      if (!session[spouseGender]) {
        // Create new user
        spouse = new User({
          nama,
          gender: spouseGender,
          avatar,
          role: 'spouse'
        });
        await spouse.save();
        session[spouseGender] = spouse._id;
      } else {
        // Update the user if necessary
        const spouseId = session[spouseGender]._id
        spouse = await User.findOne({ _id: spouseId })
        spouse.nama = nama
        spouse.avatar = avatar
        await spouse.save()
        session[spouseGender] = spouse
      }

      await session.populate('man');
      await session.populate('woman');

      session.weights[spouseGender] = weights;

      const sessWeights = session.weights;
      const allWeightsDone = (sessWeights.man && sessWeights.woman && sessWeights.photographer);
      if (allWeightsDone) {
        session.status = SessionStatus.READY;
      }

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