#!/usr/bin/env node
import { createServer } from '../dist/index.js';

createServer({ isProd: true }).then((server) => {
  server.listen(3000, () =>
    console.log('> Dash started on http://localhost:3000')
  );
});
