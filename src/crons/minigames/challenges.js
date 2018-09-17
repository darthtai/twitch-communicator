const CronJob = require('cron').CronJob;
const fs = require('fs');

const cronTime = '* 2 * * * 1-5';

const options = {};

const cron = new CronJob({
  cronTime,
  onTick: () => {
    if (options.twitch) {
      Object.keys(global.channels).forEach((channel) => {
        global.channels[channel].users.duel.forEach((duel, index) => {
          if (Math.floor((Math.random() * 200) + 1) < 100) {
            global.channels[channel].users.list[duel.duelistOne.name].points += duel.duelistTwo.wager;
            options.twitch.say(global.channels[channel].name, `The winner of the duel is ${duel.duelistOne.name} and has been awarded ${duel.duelistTwo.wager} points!`);
          } else {
            global.channels[channel].users.list[duel.duelistTwo.name].points += duel.duelistOne.wager;
            options.twitch.say(global.channels[channel].name, `The winner of the duel is ${duel.duelistTwo.name} and has been awarded ${duel.duelistOne.wager} points!`);
          }
  
          global.channels[channel].users.duel.splice(index, 1);
        });

        Object.keys(global.channels[channel].users.challenges).forEach((key) => {
          const duelistOne = global.channels[channel].users.challenges[key];
          const duelistTwo = global.channels[channel].users.challenges[duelistOne.name];
    
          if (duelistOne.wager && duelistTwo.wager) {
            const newDuel = {
              duelistOne,
              duelistTwo
            };

            options.twitch.say(global.channels[channel].name, `A duel between ${duelistOne.name} and ${duelistTwo.name} has been set to occur in about two minutes! Prepare yourselves!`)
              .then(() => {
                delete global.channels[channel].users.challenges[key];
                delete global.channels[channel].users.challenges[user.challenges[key].name];
                global.channels[channel].users.duel.push(newDuel);
              }).catch(console.log(err));
          }
        });
      });
    }

    fs.writeFile('../channels.json', JSON.stringify(global.channels));
  },
  start: true,
  timeZone: 'America/Sao_Paulo'
});

module.exports = options;