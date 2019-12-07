const mongoose = require('mongoose')
const config = require('./config.js')

function connect() {
  return new Promise((resolve, reject) => {
    mongoose.connection.on('error', err => {
      console.log('Mongoose Connection Failure')
      reject(err)
    })

    mongoose.connection.on('connected', () => {
      console.debug('MongoDB Connected @', config.mongo.uri)
      return resolve()
    })
    config.mongo.options = config.mongo.options || {}
    mongoose.connect(config.mongo.uri, config.mongo.options)
  })
}

function close() {
  mongoose.connection.close(() => {
    console.debug('Mongoose connection closed')
  })
}

module.exports = { connect, close }