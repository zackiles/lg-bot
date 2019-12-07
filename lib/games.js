const fetch = require('fetch-retry')
const nodeUrl = require('url')
const cheerio = require('cheerio')
const db = require('./db')
const Game = require('../models/game')

const leagueGamingBaseUrl = 'https://www.leaguegaming.com'


//https://www.leaguegaming.com/forums/index.php?leaguegaming/league&action=league&page=team_user&userid=12664&leagueid=37&seasonid=24
async function getPlayerGames(userid, leagueid, seasons){
  let games = []
  for (season of seasons) {
    let seasonGames = await getPlayerSeasonGames(userid, leagueid, season)
    seasonGames = await Promise.all(seasonGames.map(async (game) => {
      return await getGame(game.id)
    }))
    games = games.concat(seasonGames)
  }

  return games
} 

//https://www.leaguegaming.com/forums/index.php?leaguegaming/league&action=league&page=game&gameid=557499
async function getGame(gameid){
  let cachedGame = await Game.findById(gameid.toString())
  if(cachedGame) {
    cachedGame = cachedGame.toJSON()
    cachedGame.cached = true
    return cachedGame
  }
  let response
  try {
    response = await fetch(`${leagueGamingBaseUrl}/forums/index.php?leaguegaming/league&action=league&page=game&gameid=${gameid}`, {retries: 10, retryDelay: 1000})
  } catch {
    return null
  }
  const text = await response.text()
  const $ = await cheerio.load(text)
  const teamStatRows = $('.mast tbody tr').toArray()
  const skaterStatRows = $('.mainProfileColumn .lgftable2').first().find('tr').toArray().slice(2)
  const goalieStatRows = $('.mainProfileColumn .lgftable2').last().find('tr').toArray().slice(2)

  let game = {
    id: gameid,
    gameId: gameid,
    homeTeam: nodeUrl.parse(`${leagueGamingBaseUrl}/${$($(teamStatRows[0]).find('a').toArray()[1]).attr('href')}`, true).query.teamid,
    awayTeam: nodeUrl.parse(`${leagueGamingBaseUrl}/${$($(teamStatRows[0]).find('a').toArray()[0]).attr('href')}`, true).query.teamid,
    skaterStats: [],
    goalieStats: [],
    teamStats: [],
    cached: false
  }

  const splitStats = (e) => {
    return {
      away: $(e).children().first().text(),
      home: $(e).children().last().text()
    }
  }

  const homeStats = {
    teamid: game.homeTeam,
    goals: parseInt(splitStats(teamStatRows[3]).home),
    shots: parseInt(splitStats(teamStatRows[4]).home),
    hits: parseInt(splitStats(teamStatRows[5]).home),
    timeOnAttack: splitStats(teamStatRows[6]).home,
    penaltyMintues: splitStats(teamStatRows[8]).home,
    powerplays: splitStats(teamStatRows[9]).home,
    powerplayMinutes: splitStats(teamStatRows[10]).home,
    faceoffsWon: parseInt(splitStats(teamStatRows[11]).home),
    shorthandedGoals: splitStats(teamStatRows[12]).home
  }

  const awayStats = {
    teamid: game.awayTeam,
    goals: parseInt(splitStats(teamStatRows[3]).away),
    shots: parseInt(splitStats(teamStatRows[4]).away),
    hits: parseInt(splitStats(teamStatRows[5]).away),
    timeOnAttack: splitStats(teamStatRows[6]).away,
    penaltyMintues: splitStats(teamStatRows[8]).away,
    powerplays: splitStats(teamStatRows[9]).away,
    powerplayMinutes: splitStats(teamStatRows[10]).away,
    faceoffsWon: parseInt(splitStats(teamStatRows[11]).away)
  }

  for (row of skaterStatRows) {
    const userid = nodeUrl.parse(`${leagueGamingBaseUrl}/${$(row).find('a').attr('href')}`, true).query.userid
    const columns = $(row).find('td').toArray().map((x) => {
      return $(x).text().replace(/\t/g, '').replace(/\n/g, '')
    })
    const position = columns[1].split('(').pop().split(')')[0]
    // DNS means Did Not Show which means the player didn't play in the game and was replaced by an ECU
    // We don't need to track these stats, so we skip over these DNS players
    if(position === 'DNS') continue

    game.skaterStats.push({
      id: userid,
      userid: userid,
      position: position,
      points: parseInt(columns[2]),
      goals: parseInt(columns[3]),
      assists: parseInt(columns[4]),
      plusMinus: parseInt(columns[5]),
      timeOnIce: columns[6],
      shots: parseInt(columns[7]),
      hits: parseInt(columns[8]),
      penaltyMinutes: columns[9],
      takeaways: parseInt(columns[10]),
      takeawayGiveaway: parseInt(columns[11]),
      blockedShots: parseInt(columns[12]),
      faceoffPercentage: parseInt(columns[13])
    })
  }

  for (row of goalieStatRows) {
    const userid = nodeUrl.parse(`${leagueGamingBaseUrl}/${$(row).find('a').attr('href')}`, true).query.userid
    const columns = $(row).find('td').toArray().map((x) => {
      return $(x).text().replace(/\t/g, '').replace(/\n/g, '')
    })
    game.goalieStats.push({
      id: userid,
      userid: userid,
      position: 'G',
      shots: parseInt(columns[2]),
      savePercentage: parseInt(columns[3]),
      goalsAgainst: parseInt(columns[4]),
      saves: parseInt(columns[5]),
      goalsAgainstAverage: parseInt(columns[6])
    })
  }

  game.teamStats.push(homeStats)
  game.teamStats.push(awayStats)
  game.winner = homeStats.goals > awayStats.goals ? game.homeTeam : game.awayTeam
  try {
    const newGame = await new Game(game).save()
    game = newGame
  } catch {
    return game
  }

  return game.toJSON()
}

//https://www.leaguegaming.com/forums/index.php?leaguegaming/league&page=player_season_card&userid=6372&leagueid=37&seasonid=15
async function getPlayerSeasonGames(userid, leagueid, seasonid){
  let response = await fetch(`${leagueGamingBaseUrl}/forums/index.php?leaguegaming/league&page=player_season_card&userid=${userid}&leagueid=${leagueid}&seasonid=${seasonid}`, {retries: 10, retryDelay: 1000})
  const text = await response.text()
  const $ = await cheerio.load(text)
  const gameRows = $('.lgftable tbody tr')
  const games = []
  gameRows.each((i, e) => {
    const gameid = nodeUrl.parse(`${leagueGamingBaseUrl}/${$(e).find('td a').attr('href')}`, true).query.gameid
    games.push({
      id: gameid,
      gameid: gameid
    })
  })

  return games
}

module.exports = {getGame, getPlayerGames}