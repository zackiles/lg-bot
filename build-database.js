const fetch = require('fetch-retry')
const nodeUrl = require('url')
const cheerio = require('cheerio')
const cluster = require('cluster')
const Games = require('./lib/games')
const db = require('./lib/db')
const Player = require('./models/player')

const cpuCount = require('os').cpus().length

const config = require('./lib/config')

const leagueGamingBaseUrl = 'https://www.leaguegaming.com'

// The leagues and their leagueids that are available to be scraped by this script
const leagueMap = {
  'XBOX-NHL': '37',
  'XBOX-AHL': '38',
  'XBOX-CHL': '39',
  'PS-NHL': '67',
  'PS-AHL': '68',
  'PS-CHL': '69'
}

async function getPlayersForSeason(leagueid, seasonid){
  const response = await fetch(`${leagueGamingBaseUrl}/forums/index.php?leaguegaming/league&action=league&page=team_memberstats&leagueid=${leagueid}&seasonid=${seasonid}`)
  const text = await response.text()
  const $ = await cheerio.load(text)
  const skaterRows = $('.lgftable_stat tr')

  const players = {}
  skaterRows.each((i, e) => {
    const columns = $(e).find('td').toArray()
    const userId = nodeUrl.parse(`${leagueGamingBaseUrl}/${$(e).find('td a').attr('href')}`, true).query.userid
    const player = {
      userid: userId,
      id: userId
    }
    if(player.userid) players[userId] = player
  })
  console.log(`Found ${Object.keys(players).length} players from season ${seasonid} of league ${leagueid}`)
  return players
}

async function getPlayersForSeason(leagueid, seasonid){
  const response = await fetch(`${leagueGamingBaseUrl}/forums/index.php?leaguegaming/league&action=league&page=team_memberstats&leagueid=${leagueid}&seasonid=${seasonid}`, {retries: 10, retryDelay: 1000})
  const text = await response.text()
  const $ = await cheerio.load(text)
  const skaterRows = $('.lgftable_stat tr')

  const players = {}
  skaterRows.each((i, e) => {
    const columns = $(e).find('td').toArray()
    const userId = nodeUrl.parse(`${leagueGamingBaseUrl}/${$(e).find('td a').attr('href')}`, true).query.userid
    const player = {
      userid: userId,
      id: userId
    }
    if(player.userid) players[userId] = player
  })
  console.log(`Found ${Object.keys(players).length} players from season ${seasonid} of league ${leagueid}`)
  return players
}

async function getAllPlayersForSeasons(leagueid, seasons){
  let players = {}

  for (season of seasons) {
    let seasonPlayers = await getPlayersForSeason(leagueid, season)
    players = Object.assign(players, seasonPlayers)
  }
  
  return Object.values(players)
}

async function getPlayers() {
  let players = {}
  for (league of Object.keys(config.seasons)) {
    const seasons = config.seasons[league]
    const leagueid = leagueMap[league]
    if(seasons && seasons.length) {
      const leaguePlayers = await getAllPlayersForSeasons(leagueid, seasons)
      for (player of leaguePlayers) {
        if(players[player.id] === undefined) players[player.id] = player
      }
    }
  }
  return Object.values(players)
}

function chunkify(a, n, balanced) {
  if (n < 2) return [a]

  let len = a.length
  let out = []
  let i = 0
  let size

  if (len % n === 0) {
    size = Math.floor(len / n)
    while (i < len) {
      out.push(a.slice(i, i += size))
    }
  } else if (balanced) {
    while (i < len) {
      size = Math.ceil((len - i) / n--)
      out.push(a.slice(i, i += size))
    }
  } else {
    n--
    size = Math.floor(len / n)
    if (len % size === 0)
      size--
    while (i < size * n) {
      out.push(a.slice(i, i += size))
    }
    out.push(a.slice(size * n))
  }

  return out
}

(async () => {
  /**
    The scraping methodology here is a bit counterintuitive due to how LeagueGaming is layed out.
    In order to build a database of all players, and all games those players played in for
    the given leagues and seasons, we do the following:

    - Scrape all players from the "member stats" page for a season
    - Scrape all games that each of those players played in that season
    - Repeat the process for other leagues & seasons and aggregate the data
    - Avoid re-scraping players or games we've already scraped

    We create two database tables, "players" and "games". Game stats are high-fidelity
    and include everything you'd find on LeagueGaming, with better formatting and additional
    computed stats not found on LeagueGaming. The scraper runs in a cluster mode, spinning up
    individual workers per CPU on the host, and distributing an even workload accross workers.

  */

  if (cluster.isMaster) {
    let newPlayerCount = 0
    let newGameCount = 0
    const players = await getPlayers()
    // Split the players into chunks so the workload can be distributed over the cluster
    const playerChunks = chunkify(players, cpuCount)
    console.log(`Total players found from all seasons and leagues is ${players.length}`)
    console.log(`Distributing players for workers to process from ${cpuCount} equal parts of ${playerChunks[0].length} players each`)

    for (let i = 0; i < cpuCount; i++) {
      const worker = cluster.fork()
  
      worker.on('message', (msg) => {
        if(msg.newPlayers) newPlayerCount = newPlayerCount + msg.newPlayers.length
        if(msg.newGames) newGameCount = newGameCount + msg.newGames.length
      })
  
      worker.send({players : playerChunks[i]})
    }
  
    cluster.on('death', (worker) => {
      console.log('Worker', worker.pid, 'finished')
    })

    process.on('SIGINT', () => {
      console.log(`Ending early! There were ${newPlayerCount} new players and ${newGameCount} games added`)
      process.exit()
    })

  } else {
    console.log(`Started worker ${cluster.worker.id}`)

    process.on('message', async (msg) => {
      const players = msg.players
      for (player of players) {
        const doesExist = await Player.findById(player.id.toString())
        if(doesExist){
          continue
        }else{
          console.log(`Synced new player ${player.id}`)
          new Player(player).save()
          process.send({newPlayers: [player.id]})
        }
        
        let games = {}
        for (league of Object.keys(config.seasons)) {
          const seasons = config.seasons[league]
          const leagueid = leagueMap[league]
          if(seasons && seasons.length) {
            const leagueGames = await Games.getPlayerGames(player.id, leagueid, seasons)
            for (game of leagueGames) {
              if(!game) continue
              if(!game.cached) {
                process.send({newGames: [games.id]})
              }
              if(games[game.id] === undefined) games[game.id] = game
            }
          }
        }
        games = Object.values(games)
        console.log(`Synced ${games.length} games for player ${player.id}`)
      }
      console.log(`Worker ${cluster.worker.id} exiting after processing games for ${players.length} players`)
      process.exit()
    })
    await db.connect()
  }

  
})();