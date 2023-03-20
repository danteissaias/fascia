import { createServer } from './server';

createServer({ isProd: true }).then((server) => {
  server.listen(5555, () =>
    console.log('> Dash started on http://localhost:5555')
  );
});
