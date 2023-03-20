import { createServer } from './src/server';

createServer({}).then((server) => {
  server.listen(5555, () =>
    console.log('> Dash started on http://localhost:5555')
  );
});
