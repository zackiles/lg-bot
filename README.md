# League Gaming Bot
Also known as the Babcock Bot, this is the most advanced Discord Bot for LeagueGaming.com. Add this bot to your team channel and watch as it transforms your team into a top contender with it's advanced scouting reports, game summaries, tips, and bidding reports. Some of the highlights of this bot:

- Respond to questions and commands in your chat using artifical intellingence and natural language processing. You can speak to the bot in many different ways like Alexa or Google Assistant.
- Uses a complete (and customizable) database of all games and players who play in XBOX-NHL, XBOX-AHL, XBOX-CHL, PS-NHL, PS-AHL, PS-CHL hockey leagues.
- Coaches your team, providing after-game individual player feedback.
- Gives pre-game scouting reports.
- Can generate reports for owners and GMs, including bidding reports, player reports and other advanced stats.
- Easy to configure and setup.

## Setup
You have to options.

### Easy Way (Hosted by us)
The preferred way. Setup is easy, just authenticate your bot with your Discord channel using [this link](https://discordapp.com/api/oauth2/authorize?client_id=648214448502210593&permissions=739245168&redirect_uri=https%3A%2F%2Ftest.com%2Fcallback&scope=bot).

### Hard Way (Hosted by you)

If you'd like to run this bot on your own server, then you'll have to have a server with Nodejs and Mongodb. Next copy `config.yml.example` to `config.yml` and configure the settings within it. You'll also have to run `build-database.js` the first time you setup your server in order to seed your database with players and games, as well as `npm install` all the dependencies.

## Commands
Like Alexa, this bot will respond to many different types of phrasings for the same command. An example is that saying `@BabockBot What's the scouting report for the next game` and `@BabcockBot can you give me the scouting report for the next game` will both be responded to with the next game's scouting report. This makes it easy to use without having to remember exact commands.

All commands or questions must start by starting it with `@BabcockBot` to get the bots attention. A brief list of commands to get you started are:

- "What's the scouting report for the next game?"
- "Give me a bidding report"
- "Give me a team report"
- "How many games are left in the season?"
- "What's the last game summary"
- "How has our week been going?"
- "Who has been doing the best on our team?"
- "Who has been doing the worst on our team?"
- "Who is the most overpaid on our team?"
- "Who is the most underpaid on our team?"
- "What is our team doing well?"
- "What can our team improve?"

You can also experiement with all sorts of commands, trying asking the bot "How are you doing?".
