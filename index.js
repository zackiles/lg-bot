const trainer = require('./trainer')
const nodeNLP = require('node-nlp')
const Discord = require('discord.js')
const teams = require('./entities/teams')
const config = require('./lib/config')

const client = new Discord.Client()

const nlp = new nodeNLP.NlpManager({ languages: ['en'] })

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
 
client.on('message', async (message) => {
  if(message.author.bot) return
  const content = message.content.toLocaleLowerCase()
  let command =  /coach(.*)/.exec(content)
ß
  if(command) {
    command = command[0].trim()
    command = await nlp.process(command)

    console.log(command)
    if(command.answer) message.reply(command.answer)
  }
});


(async () => {
  await trainer(nlp)
  client.login(config.discord.apiKey)
})();
