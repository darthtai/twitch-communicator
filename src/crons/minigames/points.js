const CronJob = require('cron').CronJob;

const cronTime = '* 1 * * * 1-5';

const cron = new CronJob({
  cronTime,
  onTick: () => {
    Object.keys(global.channels).forEach((channel) => {
      Object.keys(global.channels[channel].users.online).forEach((key) => {
        global.channels[channel].users.list[key].points += 2;
      });
    });
  },
  start: true,
  timeZone: 'America/Sao_Paulo'
});
