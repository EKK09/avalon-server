import express, { Response, Request } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (request: Request, response: Response) => {
  response.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
