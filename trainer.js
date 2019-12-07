const fs = require('fs')

function addIntent(manager, utterances, intent){
  if(Array.isArray(utterances)) {
    utterances.map((u) => {
      manager.addDocument('en', u, intent)
    })
  } else {
    manager.addDocument('en', utterances, intent)
  }
}

function addAnswer(manager, answers, intent){
  if(Array.isArray(answers)) {
    answers.map((a) => {
      manager.addAnswer('en', intent, a)
    })
  } else {
    manager.addDocument('en', intent, answers)
  }
}

module.exports = async function (manager) {
  if (fs.existsSync('./model.nlp')) {
    manager.load('./model.nlp')
    return
  }

  addIntent(manager, [
    'how are you',
    'hello',
    'hi',
    'nice to meet you',
    'how have you beenn?',
    'how are ya?',
    'bonjiour'
    ],
    'agent.greeting'
  )

  await manager.train()

  addAnswer(manager, [
    'Good to meet ya, rookie!',
    'How ya been, champ?',
    "Hey champ, you keeping your thumbs warm?"
    ],
    'agent.greeting'
  )
  manager.save()
}