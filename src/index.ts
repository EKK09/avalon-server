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
  try {
    const playerName = request.body.player_name;
    if (!playerName || playerName.trim() === '') {
      response.status(400).json({ error_message: '參數錯誤' });
      return;
    }
    const roomId = await GameRoomService.createGameRoom(playerName);
    response.json({ room_id: roomId });
  } catch (error) {
    response.status(500).json({ error_message: '內部錯誤' });
  }
});

const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  server.on('upgrade', (request, socket, head) => {
    console.log('upgrade');
    GameRoomService.handleUpgrade(request, socket, head);
  });
});
