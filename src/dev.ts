import { createServer } from './server';

createServer({}).then((server) => {
  server.listen(3000, () =>
    console.log('> Dash started on http://localhost:3000')
  );
});
