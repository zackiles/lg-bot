const fetch = require('fetch-retry')
const cheerio = require('cheerio')

async function getStandingsPage(){
  const response = await fetch('https://www.leaguegaming.com/forums/index.php?leaguegaming/league&action=league&page=standing&leagueid=37&seasonid=34')
  const text = await response.text()
  const $ = await cheerio.load(text)

  const teamRows = $('.lgftablec').find('tbody')
  let teams = []
  teamRows.each((i, e) => {
    const columns = $(e).find('td').toArray().map((x) => {return $(x).text()})
    teams.push({
      name: columns[0].split(')')[1].trim(),
      gamesPlayed: parseInt(columns[1]) || 0,
      wins: parseInt(columns[2]) || 0,
      losses: parseInt(columns[3]) || 0,
      overtimeWins: parseInt(columns[4]) || 0,
      overtimeLosess: parseInt(columns[5]) || 0,
      points: parseInt(columns[6]) || 0,
      streak: parseInt(columns[7].replace('W', '').replace('L', '')),
      goalsFor: parseInt(columns[8]) || 0,
      goalsAgainst: parseInt(columns[9]) || 0,
      goalDifferential: parseInt(columns[10]) || 0,
      last10Games: columns[11],
      homeRecord: columns[12],
      awayRecord: columns[13],
      oneGoalGames: columns[14],
    })
  })

  const teamRankings = []
  const sidebarRows = $('.sidebar').find('.lgftable').toArray().forEach(sidebarRow => {
    $(sidebarRow).find('tr').toArray().forEach(row => {
      const sidebarTeam = $(row).find('td').first().text()
      if(sidebarTeam){
        const seed = parseInt(sidebarTeam.split(')')[0].trim())
        teamRankings.push({
          name: sidebarTeam.split(')')[1].replace("*", '').trim(),
          isWildcard: seed == 8 || seed == 7,
          seed: seed,
          isInPlayoffSpot: seed <= 8
        })
      }
    })
  })
  teams = teamRankings.map(team => {
    let result = {}
    teams.forEach(v => {
      if(v.name.includes(team.name)){
        result = {...team, ...v}
      }
    })
    return result
  })

  return teams
}

async function getStatsPage() {
  const response = await fetch('https://www.leaguegaming.com/forums/index.php?leaguegaming/league&action=league&page=team_teamstats&leagueid=37&seasonid=34')
  const text = await response.text()
  const $ = await cheerio.load(text)

  const teamRows = $('#lgtable_teamstats1 tbody').find('tr')
  let teams = []
  teamRows.each((i, e) => {
    const columns = $(e).find('td').toArray().map(function(x){ return $(x).text()})
    const teamId = $(e).find('td a').attr('href')
    console.log(teamId)
    teams.push({
      name: columns[1].trim(),
      winPercentage: parseInt(columns[2]) || 0,
      powerplayPercentage: parseInt(columns[3]) || 0,
      penaltykillPercentage: parseInt(columns[4]) || 0,
      powerplay: columns[5],
      penaltykill: columns[6],
      timeOnAttackDifferential: columns[7],
      averageTimeOnAttack: columns[8],
      shotDifferential: parseInt(columns[9]) || 0,
      shutoutsFor: parseInt(columns[10]) || 0,
      faceoffPercentage: parseInt(columns[11]) || 0,
      powerplayGoals: parseInt(columns[12]) || 0,
      powerplayGoalsAgainst: parseInt(columns[13]) || 0,
      shorthandedGoalsFor: parseInt(columns[14]) || 0,
      hits: parseInt(columns[15]) || 0,
      penaltyMinutes: columns[17],
      goalDifferential: parseInt(columns[18]) || 0
    })
  })

  return teams
}

module.exports = async () => {
  // Different team stats and meta information are shown on different pages on LG.
  // Get everything from all pages and consolidate into a single record.
  const statsTeams = await getStatsPage()
  const standingsTeams = await getStandingsPage()

  const teams = statsTeams.map(team => {
    let result = {}
    standingsTeams.forEach(v => {
      if(v.name.includes(team.name)){
        result = {...team, ...v}
      }
    })
    return result
  })

  return teams
}