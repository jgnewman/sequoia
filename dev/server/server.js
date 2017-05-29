import express from 'express';
import http from 'http';
import path from 'path';


const app = express();
const server = http.Server(app);


app.use('/app.js', express.static(
  path.resolve(__dirname, '../', 'client/app.js')
));

app.use('/sequoia-min.js', express.static(
  path.resolve(__dirname, '../', 'client/sequoia-min.js')
));

app.use('/todomvc.js', express.static(
  path.resolve(__dirname, '../', 'client/todomvc.js')
));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'client/index.html'));
});

app.get('/todomvc', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'client/todomvc.html'));
});

app.get('/node_modules/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', '../', req.url.replace(/^\//, '')));
});

app.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'client/index.html'));
});

export { server, app };
