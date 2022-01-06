process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const ENV = 'testing';
let express = require('express');
let Proxy = require('./proxy');
let Blackbozz = require('./blackbozz');
let app = express();
let httpProxy = require('http-proxy');
let apiProxy = httpProxy.createProxyServer();


class Main {
  constructor() {
    this.proxy = new Proxy();
    this.blackbozz = new Blackbozz(this.proxy.users);
    this.url = "http://localhost:9092"
  }

  mounted() {
    this.blackbozz.sendData();
  }

  locations() {
    app.all('/*', (req, res) => {
      let pass = this.proxy.before(req, res);
      try {
        if (pass) apiProxy.web(req, res, { target: this.url });
      } catch(err) {
        console.log(err)
      }
    });
  }

  handleProxy() {
    try {
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
    } catch(err) {
      console.log("handleProxy", err)
    }
  }

  headers() {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      );
      next();
    });
  }

  run() {
    this.headers();
    this.locations();
    this.handleProxy();

    let port = ENV === 'production' ? 9091 : 8200;
    if (ENV === 'testing') {
      port = 9091;
    }

    app.disable('x-powered-by');
    app.listen(port, function () {
      console.log('PROXY RUNNING v2 on ' + port);
    });

    let timeout = 3 * 60 * 1000;
    app.timeout = timeout;
  }
}



let express2 = require('express');
let app2 = express2();
app2.all("*", (req, res) => {
  setTimeout(() => {
    let userId = Math.floor(Math.random() * 3);
    res.header("auth-key", userId + "|" + 1);

    res.send("hola " + Math.random());
  }, Math.floor(1000 * Math.random()))
})
app2.listen(9092);


const processProxy = new Main();
processProxy.mounted();
processProxy.run();