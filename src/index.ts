import express, { Response, Request } from 'express';
import UserModel from './model/userMode';

const app = express();
const port = process.env.PORT || 3000;

app.get('/user', async (request: Request, response: Response) => {
  const user = await UserModel.getUserName();
  response.send(`User is ${user}`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
