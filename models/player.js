const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  _id:  String,
  id: {type: String, required: true},
  userid: String
})

schema.pre('save', function preSave(next) {
  if(this.isNew){
    this._id = this.id
    this.userid = this.id
  }
  next()
})

module.exports = mongoose.model('Player', schema)