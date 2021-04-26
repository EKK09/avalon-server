import express, { Response, Request } from 'express';
import cors from 'cors';
import GameRoomService from './service/gameRoomService';
import UserModel from './model/userMode';

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json()); // for parsing application/json

app.get('/user', async (request: Request, response: Response) => {
  const user = await UserModel.getUserName();
  response.send(`User is ${user}`);
});

app.post('/room', async (request: Request, response: Response) => {
  const { body } = request;
  const roomId = body['room-id'];
  console.log(`api roomId":${roomId}`);
  GameRoomService.createGameRoom(roomId);
  response.json(roomId);
});

const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  server.on('upgrade', (request, socket, head) => {
    console.log('upgrade');
    GameRoomService.handleUpgrade(request, socket, head);
  });
});
