/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http')
const chai = require('chai')
const mongoose = require('mongoose')
const assert = chai.assert
const server = require('../server')

const threadSchema = require('../models/thread')
const Reply = require('../models/reply')

chai.use(chaiHttp)

suite('Functional Tests', function () {

  suite('API ROUTING FOR /api/threads/:board', function () {

    suite('POST', function () {
      test('I can post a thread to a specific message board', done => {
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: 'I can post a thread to a specific message board',
            delete_password: 'delete'
          })
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.include(res.redirects[0], '/b/general')
            done()
          })
      })
    })

    suite('GET', function () {
      test(`I can GET an array of the most recent 10 bumped threads on the 
      board`, done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        const threads = Array.from(Array(11)).map((x, i) => i + 1)
          .map(x => ({
            text: `Text ${x}`,
            delete_password: `delete ${x}`,
            created_on: x,
            bumped_on: x
          }))
        Thread.create(threads)
          .then(() => {
            chai.request(server)
              .get('/api/threads/general')
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isArray(res.body)
                assert.isAtMost(res.body.length, 10)
                res.body.forEach(x => {
                  assert.exists(x.text)
                  assert.notExists(x.delete_password)
                  assert.notExists(x.reported)
                  assert.exists(x.created_on)
                  assert.exists(x.bumped_on)
                  assert.isArray(x.replies)
                  assert.isAtMost(x.replies.length, 3)
                })
                done()
              })
          })
      })
      test('Each thread will have the most recent 3 replies', done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        Thread.findOne({}).then(thread => {
          const replies = Array.from(Array(4)).map((x, i) => i + 1)
            .map(x => ({
              text: `Reply ${x}`,
              delete_password: `delete reply ${x}`,
              thread_id: thread._id,
              created_on: x
            }))
          Reply.create(replies).then(xs => {
            xs.forEach(x => thread.replies.push(x._id))
            thread.bumped_on = new Date()
            return thread.save()
          }).then(() => {
            chai.request(server)
              .get('/api/threads/general')
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isArray(res.body)
                assert.exists(res.body[0])
                assert.isArray(res.body[0].replies)
                assert.isAtMost(res.body[0].replies.length, 3)
                done()
              })
          })
        })
      })
    })

    suite('DELETE', function () {
      test('delete with incorrect password', done => {
        chai.request(server)
          .delete('/api/threads/general')
          .send({
            thread_id: new mongoose.Types.ObjectId(),
            delete_password: 'invalidPassword'
          })
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'incorrect password')
            done()
          })
      })
      test('delete with correct password', done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        const thread = new Thread({
          text: 'I will be deleted',
          delete_password: 'delete me'
        })
        thread.save().then(() => {
          chai.request(server)
            .delete('/api/threads/general')
            .send({ thread_id: thread.id, delete_password: 'delete me' })
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.equal(res.text, 'success')
              Thread.findById(thread.id).then(doc => {
                assert.isNull(doc)
                done()
              })
            })
        })
      })
    })

    suite('PUT', function () {
      test("report a thread and change it's reported value to true", done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        const thread = new Thread({
          text: 'This thread is offensive',
          delete_password: 'delete'
        })
        thread.save().then(() => {
          chai.request(server)
          .put('/api/threads/general')
          .send({thread_id: thread.id})
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'success')
            Thread.findById(thread.id).select('+reported').then(doc => {
              assert.isTrue(doc.reported)
              done()
            })
          })
        })
      })
    })
  })

  suite('API ROUTING FOR /api/replies/:board', function () {

    suite('POST', function () {
      test('I can post a reply to a thread on a specific board', done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        Thread.findOne({}).then(doc => {
          chai.request(server)
            .post('/api/replies/general')
            .send({
              text: 'Yes, you can post a reply to a thread on a specific board',
              delete_password: 'delete',
              thread_id: doc._id
            })
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.include(res.redirects[0], `/b/general/${doc._id}`)
              done()
            })
        })
      })
    })

    suite('GET', function () {
      test("I can GET an entire thread with all it's replies", done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        const thread = new Thread({
          text: 'This is the main thread',
          delete_password: 'delete'
        })
        const replies = Array.from(Array(4)).map((x, i) => i + 1)
          .map(x => ({
            text: `Reply ${x}`,
            delete_password: `delete reply ${x}`,
            thread_id: thread._id,
            created_on: x
          }))
        Reply.create(replies).then(xs => {
          xs.forEach(x => thread.replies.push(x._id))
        }).then(async () => {
          thread.bumped_on = new Date()
          await thread.save()
        }).then(() => {
          chai.request(server)
            .get('/api/replies/general')
            .query({ thread_id: thread.id })
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.equal(res.body.replies.length, 4)
              res.body.replies.forEach(reply => {
                assert.exists(reply.text)
                assert.exists(reply.created_on)
                assert.exists(reply.thread_id)
                assert.notExists(reply.reported)
                assert.notExists(reply.delete_password)
              })
              done()
            })
        })
      })
    })

    suite('PUT', function () {
      test("report a reply and change it's reported value to true", done => {
        Reply.findOne({}).then(reply => {
          chai.request(server)
          .put('/api/replies/general')
          .send({thread_id: reply.thread_id, reply_id: reply.id})
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'success')
            Reply.findById(reply.id).select('+reported').then(doc => {
              assert.isTrue(doc.reported)
              done()
            })
          })
        })
      })
    })

    suite('DELETE', function () {
      test('delete with incorrect password', done => {
        chai.request(server)
          .delete('/api/replies/general')
          .send({
            thread_id: new mongoose.Types.ObjectId(),
            reply_id: new mongoose.Types.ObjectId(),
            delete_password: 'invalidPassword'
          })
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'incorrect password')
            done()
          })
      })
      test('delete with correct password', done => {
        const Thread = mongoose.model('general', threadSchema, 'general')
        const thread = new Thread({
          text: 'This is the main thread',
          delete_password: 'delete'
        })
        const reply = new Reply({
          text: 'This reply will be deleted',
          delete_password: 'delete me',
          thread_id: thread.id
        })
        thread.replies.push(reply.id)
        thread.save().then(async () => await reply.save())
          .then(() => {
            chai.request(server)
              .delete('/api/replies/general')
              .send({
                thread_id: thread.id,
                reply_id: reply.id,
                delete_password: 'delete me'
              })
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.equal(res.text, 'success')
                Reply.findById(reply.id).then(doc => {
                  assert.equal(doc.text, '[deleted]')
                  done()
                })
              })
          })
      })
    })
  })
})
