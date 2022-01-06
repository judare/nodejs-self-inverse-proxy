const User = require("./user");

module.exports = class Users {

  constructor() {
    this.data = {};
    this.dic = {};

    this.config = {
      blockAttempts: 400, // 400 reqs per minute
      validateTime: 10 * 1000, // Range of time to validate attempts
      timeToBlock: 60 * 60 * 1000, // one hour block time,
      timePerIncidence: 60 * 60 * 1000, // If user is blocked many times block more time
      timeInactivityFlushVisitant: 12 * 60 * 60 * 1000,
      OK_STATUS: [200, 304]
    };

    this.mounted();
  }

  mounted() {
    this.blockUsers();
    this.flushVisitants();
  }

  blockUsers() {
    setInterval(() => {
      for(let user of Object.values(this.data)) {
        if (!user.isBlocked()) {
          if (user.tries > this.config.blockAttempts) {
            user.block(this.config.timeToBlock, this.config.timePerIncidence);
          }
        }
      }
    }, this.config.validateTime); 
  }

  flushVisitants() {
    setInterval(() => {
      this.data = {};
      this.dic = {};
    }, this.config.timeInactivityFlushVisitant); 
  }

  findOrCreate(ipAddress) {
    let user = this.find(ipAddress);
    if (!user) {
      user = this.create(ipAddress)
    }
    return user;
  }

  appendDic(user) {
    if (!this.dic[user.getKey()]) {
      this.dic[ user.getKey() ] = [user];
    }
  }

  create(ipAddress) {
    this.data[ipAddress] = new User(ipAddress);
    return this.data[ipAddress];
  }

  find(ipAddress) {
    return this.data[ipAddress];
  }

  isSimultaneous(user) {
    if (user.processing) {
      return true;
    }
    let key = user.getKey();
    if (key && this.dic[key]) {
      let another = this.dic[key].find(u => u != user && u.processing);
      if (another) {
        return true;
      }
    }
    return false;
  }
}