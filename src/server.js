const http = require("http");

const app = require("./app");
const env = require("./config/env");

const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

server.on("error", (error) => {
  throw error;
});

module.exports = server;
