const ENV = 'testing';
let express = require('express');
let Proxy = require('./proxy');
let Blackbozz = require('./blackbozz');
let httpProxy = require('http-proxy');
let apiProxy = httpProxy.createProxyServer();

class Main {
  constructor() {
    this.proxy = new Proxy();
    this.blackbozz = new Blackbozz(this.proxy.users);
    this.url = 'http://localhost:9093/';
    this.app = express();
  }

  mounted() {
    this.blackbozz.sendData();
  }

  locations() {
    this.app.all('/api/v1/*', (req, res) => {
      let pass = this.proxy.before(req, res);
      if (pass) apiProxy.web(req, res, { target: 'http://localhost:9093' });
    });
  }

  handleProxy() {

    apiProxy.on('proxyRes', (proxyRes, req, res) => {
      if (req.method != 'OPTIONS') {
        var body = new Buffer('');
        proxyRes.on('data', function (data) {
          body = Buffer.concat([body, data]);
        });
        proxyRes.on('end', () => {
          body = body.toString();
          this.proxy.after(req, proxyRes);
        });
      }
    });
  }

  headers() {
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      );
      next();
    });
  }

  run() {
    this.handleProxy();
    this.headers();
    this.locations();

    let port = ENV === 'production' ? 9091 : 8200;
    if (ENV === 'testing') {
      port = 9091;
    }

    this.app.disable('x-powered-by');
    this.app.listen(port, function () {
      console.log('PROXY RUNNING v2 on ' + port);
    });

    let timeout = 3 * 60 * 1000;
    this.app.timeout = timeout;
  }
}



// let express2 = require('express');
// let app2 = express2();
// app2.all("*", (req, res) => {
//   setTimeout(() => {
//     let userId = Math.floor(Math.random() * 3);
//     res.header("auth-key", userId + "|" + 1);

//     res.send("hola " + Math.random());
//   }, Math.floor(1000 * Math.random()))
// })
// app2.listen(9091);


const processProxy = new Main();
processProxy.mounted();
processProxy.run();
