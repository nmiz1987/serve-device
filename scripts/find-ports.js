#!/usr/bin/env node

import { createServer } from 'net';

async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = createServer();

    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', () => {
      server.close();
      findAvailablePort(startPort + 1).then(resolve);
    });
  });
}

async function main() {
  const serverPort = await findAvailablePort(3000);
  const clientPort = await findAvailablePort(5173);

  console.log(`SERVER_PORT=${serverPort}`);
  console.log(`CLIENT_PORT=${clientPort}`);
}

main();
