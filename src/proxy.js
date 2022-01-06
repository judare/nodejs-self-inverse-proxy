const Users = require("./users");
const routes = require("../routes.json");


module.exports = class Proxy {

  constructor() {
    this.users = new Users();
  }

  sendBadResponse(res, { status, data}) {
    return res.status(status).json({
      time: Date.now(),
      ...data
    })
  }

  after(req, proxyHeaders) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let headerAuthKey = [];
    if (headerAuthKey.headers && headerAuthKey.headers["auth-key"]) proxyHeaders.headers["auth-key"].split("|");
    let user = this.users.findOrCreate(ip);

    user.leave();
    user.setKey(headerAuthKey);
    this.users.appendDic(user);
  }

  before(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let user = this.users.findOrCreate(ip);
    if (user.isBlocked()) {
      this.sendBadResponse(res, { status: 401, data: { message: "El usuario se encuentra bloqueado" }});
      return false;
    }

    let route = routes[req.path];
    if (route && route.guard) {
      if (user.guardSimultaneous && this.users.isSimultaneous(user)) {
        this.sendBadResponse(res, { status: 403, data: { message: "La transacción ya se esta procesando" }});
        return false;
      }
    }

    user.visit(req.path);
    return true;
  }
}