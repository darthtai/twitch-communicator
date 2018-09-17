const Knex = require('knex');
const { Client } = requre ('pg');

class dbHandler {
  constructor() {
    this.knex = Knex({
      client: 'pg',
      connection: {}
    });

    this.client = new Client();
  }

  getAllInfo() {
    const query = this.knex('channels').select('*');
    
    return this.client.query(query, (error, res) => {
      if (error) {
        return console.log(error);
      }
      // build object here

      return console.log(res);
    });
  }

  getChannelInfo(channelName) {
    const query = this.knex('channels').select('*').where('name', channelName);

    return this.client.query(query, (error, res) => {
      if (error) {
        return console.log(error);
      }
      // build object here

      return console.log(res);
    });
  }

  getAllChannelUserInfo(channelName) {
    const query = this.knex('channels').select('users').where('name', channelName);

    return this.client.query(query, (error, res) => {
      if (error) {
        return console.log(error);
      }

      if (!res.users.isEmpty()) {
        const secondQuery = this.knex('users').select('*').where('id', res.users[0]);
  
        res.users.shift(); // check
        res.users.forEach((user, i) => secondQuery.orWhere('id', res.users[i]));
  
        return this.client.query(secondQuery, (err, reply) => {
          if (err) {
            return console.log(err);
          }
          //build object here

          return console.log(res);
        });
      }

      return null;
    });
  }
}

module.exports = dbHandler;