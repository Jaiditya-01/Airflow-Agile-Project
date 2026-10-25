const http = require('http');
const assert = require('assert');

// Wait for server to be ready (instead of fragile setTimeout)
function waitForServer(server) {
  return new Promise((resolve) => {
    if (server.listening) {
      resolve();
    } else {
      server.on('listening', resolve);
    }
  });
}

async function runTests() {
  // server.js auto-starts on port 5000
  const server = require('../server');
  await waitForServer(server);

  // Use the actual address the server is listening on
  const { port } = server.address();

  return new Promise((resolve, reject) => {
    // Use 127.0.0.1 (IPv4) — the server binds to 0.0.0.0 (IPv4)
    // "localhost" can resolve to ::1 (IPv6) on some systems and fail
    http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          assert.strictEqual(res.statusCode, 200);
          const body = JSON.parse(data);
          assert.strictEqual(body.status, 'ok');
          console.log('✅ Health check test passed');
          server.close(() => {
            console.log('✅ Server closed cleanly');
            resolve();
          });
        } catch (err) {
          server.close();
          reject(err);
        }
      });
    }).on('error', (err) => {
      server.close();
      reject(err);
    });
  });
}

runTests()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  });
