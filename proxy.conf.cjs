module.exports = {
  "/api/procedure": {
    "target": "http://127.0.0.1:8070",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/api/employee": {
    "target": "http://127.0.0.1:3001",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/api/employee": "/api/v1/employee"
    }
  },
  "/providers": {
    "target": "http://127.0.0.1:8050",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "onProxyReq": (proxyReq, req, res) => {
         console.log('Proxying:', req.method, req.url);
    },
       "onError": (err, req, res) => {
         console.log('Proxy error:', err);
    }
  }
}