const request = require('request');

const ENV = "production";
const config = {
  BlackBozzProjectId: 1,
  BlackBozzTime: 60 * 1000,
  BlackBozzToken: '53RqvRhEFMAVXxc0FW8tuK9w03sdgySY',
}

module.exports = class BlackBozz {

  constructor(users) {
    this.users = users;
    if (ENV === 'production') {
      this.PROCESS_SERVER = 'https://app.blackbozz.com/api/v1/projects/sendStats';
    }else if (ENV === 'testing') {
      this.PROCESS_SERVER = 'https://app.blackbozz.com/api/v1/projects/sendStats';
    } else {
      this.PROCESS_SERVER = 'http://127.0.0.1:4000/api/v1/projects/sendStats';
    }
  }

  buildData() {
    return {
      visitors: Object.values(this.users.data).length,
      blockedSimultaneous: Object.values(this.users.data).filter(u => u.isBlocked()).length,
      time: Date.now(),
      lastTime: Date.now(),
      routesData: {},
    }
  }
  
  sendData() {

    let data = this.buildData();
    const opts = {
      method: 'POST',
      url: this.PROCESS_SERVER,
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + config.BlackBozzToken,
      },
      json: {
        projectId: config.BlackBozzProjectId,
        data: data,
      },
    };

    request(opts, (err, body, response) => {
      setTimeout(() => this.sendData(), config.BlackBozzTime);
      if (err) return console.log(err);
      console.log(response);
    });
  }
}