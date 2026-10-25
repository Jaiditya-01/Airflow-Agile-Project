const http = require('http');

function runTests() {
  return new Promise((resolve, reject) => {
    // server.js auto-starts on port 5000
    const server = require('../server');

    // Give server a moment to start
    setTimeout(() => {
      http.get('http://localhost:5000/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const assert = require('assert');
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
    }, 1000);
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
