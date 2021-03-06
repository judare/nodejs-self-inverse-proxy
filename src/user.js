
module.exports = class User {
  constructor(ipAddress) {
    this.ipAddress = ipAddress;
    this.tries = 0;
    this.blockedUntil = null;
    this.blockedAt = null;
    this.locks = 0;
    this.lastRoute = null;
    this.lastVisit = null;
    this.key = null;

    this.processing = false;
    this.guardSimultaneous = true;
  }

  setKey(key) {
    console.log(key[0], !!key[1])
    this.key = key[0];
    this.guardSimultaneous = !!key[1];
  }

  getKey() {
    return this.key
  }

  isBlocked() {
    return this.blockedUntil && this.blockedUntil > Date.now();
  }

  block(time, incidenceTime) {
    incidenceTime *= this.locks;

    this.blockedAt = Date.now();
    this.blockedUntil = Date.now() + time + incidenceTime;
    this.locks++;
  }

  visit(route) {
    this.tries++;
    this.lastVisit = Date.now();
    this.lastRoute = route;
  }

  flushTries() {
    this.tries = 0;
  }

  setProcessing() {
    this.processing = true;
  }

  leave() {
    this.processing = false;
  }

}
