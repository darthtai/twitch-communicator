const TMI = require('tmi.js');
const defaultOptions = require('../options.json');
const customCommands = require('../customCommands.json');
const challengeOptions = require('./crons/minigames/challenges');
const enumHelper = require('./enumHelper');
const fs = require('fs');
const crons = require('./crons/index');
const db = require('./database');

fs.readFile('../channels.json', (err, data) => {
  if (err) {
    return console.log(err);
  }

  global.channels = JSON.parse(data.toString());
  global.channels['#soulsain'].users.duel = [];
});

function initialize(options = defaultOptions) {
  const twitch = new TMI.client(options);

  return twitch;
}

function replyChat(channel, user, message, twitch) {
  const { username } = user;
  const customCommandChannel = customCommands.channels[channel];
  if (message === enumHelper.commands.test) {
    return twitch.say(channel, 'Test confirmed.');
  }

  if (message === enumHelper.commands.bestPerson) {
    return twitch.say(channel, `You're the best, ${username}!`);
  }

  if (message === enumHelper.commands.lucid) {
    return twitch.say(channel, 'Check out this awesome streamer over at https://www.twitch.tv/lucid_live!');
  }

  if (message === enumHelper.commands.bestStream) {
    return twitch.say(channel, `Best channel is ${channel.replace('#', '')}, of course!`);
  }

  if (message === enumHelper.commands.points) {
    return twitch.say(channel, `@${username}, your current points are: ${global.channels[channel].users.list[username].points}.`);
  }

  if (!customCommandChannel || !customCommandChannel.subOnlyCommands || user.subscriber || channel.replace('#', '') === username.toLowerCase()) {
    if (message.startsWith(enumHelper.commands.quote) ) {
      const quote = message.slice(7, message.length).replace(/"/g, '');
      if (!global.channels[channel].quotes) {
        global.channels[channel].quotes = [];
      }
  
      if (Number(quote)) {
        return twitch.say(channel, `Quote #${quote}: ${channels[channel].quotes[Number(quote) - 1]}`)
      } else {
        let saveQuote = '';
        if (quote.includes('-')) {
          const splitQuote = quote.split('-');
          saveQuote = `\"${splitQuote[0].trim()}\" - ${splitQuote[1].trim()}`;
        } else {
          saveQuote = `\"${quote}\" - ${channel.replace('#', '')}`;
        }
        global.channels[channel].quotes.push(saveQuote);
  
        return twitch.say(channel, `Quote #${global.channels[channel].quotes.length} has been saved: ${saveQuote}`);
      }
    }
  }

  if (message.startsWith(enumHelper.commands.challenge)) {
    const challenged = message.split(' ')[1];
    const onlineChallenger = global.channels[channel].users.list[username];
    const onlineChallenged = global.channels[channel].users.list[challenged];
    const currentChallenge = global.channels[channel].users.challenges[username];
    const currentDuel = global.channels[channel].users.duel.find(duel => duel.duelistOne.name === username || duel.duelistTwo.name === username);

    if (!onlineChallenged && !onlineChallenger) {
      return twitch.whisper(username, `You and ${challenged} are not both in the current channel.`);
    }
    if (currentChallenge) {
      return twitch.say(channel, `${username}, you already have a challenge open against ${currentChallenge.username}.`);
    }
    if (currentDuel) {
      return twitch.say(channel, `${username}, you have an ongoing duel!`);
    }

    return twitch.say(channel, `${username} has issued a challenge to ${challenged}!`)
      .then(() => twitch.whisper(username, `Challenge to ${challenged} has been issued.`))
      .then(() => {
        global.channels[channel].users.challenges[username] = onlineChallenged;
        global.channels[channel].users.challenges[challenged] = onlineChallenger;
      });
  }

  if (message.startsWith(enumHelper.commands.challengeWager)) {
    const challengeAmount = Number(message.replace(/-/g, '').split(' ')[1]);

    if (!global.channels[channel].users.challenges[username]) {
      return twitch.say(channel, `${username}, you do not have a challenge currently open.`);
    }
    if (challengeAmount > 20) {
      return twitch.say(channel, '20 points is the maximum amount for a wager.');
    }
    if (Number(global.channels[channel].users.list[username].points) < challengeAmount) {
      return twitch.say(channel, `${username}, you do not have enough points for this wager.`);
    }

    return twitch.say(channel, `${username} has set a wager for his duel against ${global.channels[channel].users.challenges[username].name}!`)
      .then(() => {
        global.channels[channel].users.challenges[username].wager = challengeAmount;
        global.channels[channel].users.list[username].points -= challengeAmount;
      });
  }

  if (user.mod || channel.includes(username)) {
    if (message === enumHelper.commands.testMod) {
      return twitch.say(channel, 'Mod test confirmed.');
    }
  }

  if (customCommandChannel && customCommandChannel.commands[message]) {
    return twitch.say(channel, customCommandChannel.commands[message]);
  }

  return;
}

function replyWhisper(user, message, channel, twitch) {
  const { username } = user;
  if (message === enumHelper.commands.test) {
    return twitch.whisper(username, 'Hi!');
  }

  if (message.startsWith(enumHelper.commands.challenge)) {
    const challenged = message.split(' ')[1];
    const onlineChallenger = global.channels[channel].users.list[username];
    const onlineChallenged = global.channels[channel].users.list[challenged];
    const currentChallenge = global.channels[channel].users.challenges[username];
    const currentDuel = global.channels[channel].users.duel.find(duel => duel.duelistOne.name === username || duel.duelistTwo.name === username);

    if (!onlineChallenged && !onlineChallenger) {
      return twitch.whisper(username, `You and ${challenged} are not both in the current channel.`);
    }
    if (currentChallenge) {
      return twitch.whisper(username, `You already have a challenge open against ${currentChallenge.name}.`);
    }
    if (currentDuel) {
      return twitch.whisper(username, 'You are already in a duel!');
    }

    return twitch.say(channel, `${username} has issued a challenge to ${challenged}!`)
      .then(() => {
        global.channels[channel].users.challenges[username] = onlineChallenged;
        global.channels[channel].users.challenges[challenged] = onlineChallenger;
      });
  }

  if (message.startsWith(enumHelper.commands.challengeWager)) {
    const challengeAmount = Number(message.replace(/-/g, '').split(' ')[1]);

    if (!global.channels[channel].users.challenges[username]) {
      return twitch.whisper(username, 'You do not have a challenge currently open.');
    }
    if (challengeAmount > 20) {
      return twitch.whisper(username, '20 points is the maximum amount for a wager.');
    }
    if (Number(global.channels[channel].users.list[username].points) < challengeAmount) {
      return twitch.whisper(username, 'You do not have enough points for this wager.');
    }

    return twitch.whisper(username, `Your wager for ${challengeAmount} has been set!`)
      .then(twitch.say(channel, `${username} has set a wager for his duel against ${global.channels[channel].users.challenges[username].name}!`))
      .then(() => {
        global.channels[channel].users.challenges[username].wager = challengeAmount;
        global.channels[channel].users.list[username].points -= challengeAmount;
      });
  }

  if (message.startsWith('!give') && username === 'soulsain') {
    const messageSplit = message.trim().split(' ');
    const userChannel = messageSplit[1];
    const userToAdd = messageSplit[2];
    const pointsToAdd = messageSplit[3];

    global.channels[userChannel].users.list[userToAdd].points += Number(pointsToAdd);

    return twitch.whisper(username, `${pointsToAdd} added to ${userToAdd} in channel ${userChannel}.`);
  }

  return;
}

async function main() {
  const twitch = initialize();
  console.log('Initialized.');

  twitch.connect().then(() => {
    console.log('Connected.');
    challengeOptions.twitch = twitch;

    twitch.on('message', (channel, userstate, message, self) => {
      if (self) {
        return;
      }

      const stateActionsMap = {
        chat: replyChat,
        whisper: replyWhisper
      };

      const messageType = userstate['message-type'];

      const stateAction = stateActionsMap[messageType];
      
      if (stateAction) {
        stateAction(channel, userstate, message, twitch)
          .catch(err => console.log(err));
      }
    });

    twitch.on('join', (channel, username, self) => {
      if (self) {
        if (!global.channels[channel]) {
          const users = {
            list: {},
            online: {},
            challenges: {},
            duel: []
          };
          const newChannel = {
            name: channel,
            users,
            quotes: []
          };

          global.channels[channel] = newChannel;
        }

        return;
      }

      const existingUser = global.channels[channel].users.list[username];
      const onlineUser = global.channels[channel].users.online[username];

      if (existingUser) {
        existingUser.visits += 1;
      } else {
        const loggingUser = {
          name: username,
          points: 0,
          visits: 1
        };

        global.channels[channel].users.list[username] = loggingUser;
      }

      if (!onlineUser) {
        global.channels[channel].users.online[existingUser];
      }

    });

    twitch.on('part', (channel, username) => {
      delete global.channels[channel].users.online[username];
    });
  }).catch(err => console.log(err));
}

main();

crons();
