const mongoose = require('mongoose')

const skaterStats = {
  id: {type: String, required: true},
  userid: {type: String, required: true},
  position: {type: String, required: true},
  points: {type: Number, default: 0},
  goals: {type: Number, default: 0},
  assists: {type: Number, default: 0},
  plusMinus: {type: Number, default: 0},
  timeOnIce: {type: String, required: true},
  shots: {type: Number, default: 0},
  hits: {type: Number, default: 0},
  penaltyMinutes: {type: String},
  takeaways: {type: Number, default: 0},
  takeawayGiveaway: {type: Number, default: 0},
  blockedShots: {type: Number, default: 0},
  faceoffPercentage: {type: Number, default: 0}
}

const goalieStats = {
  id: {type: String, required: true},
  userid: {type: String, required: true},
  position: {type: String, default: 'G'},
  shots: {type: Number, required: true},
  savePercentage: {type: Number, default: 0},
  goalsAgainst: {type: Number, default: 0},
  saves: {type: Number, default: 0},
  goalsAgainstAverage: {type: Number, default: 0},

}

const teamStats = {
  teamid: {type: String, require: true},
  goals: {type: Number, required: true},
  shots: {type: Number, required: true},
  hits: {type: Number, required: true},
  penaltyMinutes: {type: String, default : "0:00"},
  powerplays: {type: String, default : "0 / 0"},
  powerplayMinutes: {type: String, default : "0:00"},
  faceoffsWon: {type: Number, default: 0},
  shorthandedGoals: {type: Number, default: 0}
}

const schema = new mongoose.Schema({
  _id: String,
  id: {type: String, required: true},
  gameid: {type: String},
  homeTeam: {type: String, required: true},
  awayTeam: {type: String, required: true},
  winner: {type: String, required: true},
  skaterStats: [skaterStats],
  goalieStats: [goalieStats],
  teamStats: [teamStats]
})

schema.pre('save', function preSave(next) {
  if(this.isNew){
    this._id = this.id
    this.gameid = this.id
  }
  next()
})

module.exports = mongoose.model('Game', schema)