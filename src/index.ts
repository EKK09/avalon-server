import express, { Response, Request } from 'express';
import cors from 'cors';
import UserModel from './model/userMode';
import WebSocketService from './service/WebSocketService';
import GameInfoModel from './model/gameInfoModel';

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
    const roomId = await WebSocketService.createGameService();
    response.json({ room_id: roomId });
  } catch (error) {
    response.status(500).json({ error_message: '內部錯誤' });
  }
});
app.get('/game/:id', async (request: Request, response: Response) => {
  try {
    const roomId = request.params.id;
    if (!roomId) {
      response.status(400).json({ error_message: '參數錯誤' });
      return;
    }
    const gameInfo = await GameInfoModel.getGameInfo(roomId);
    if (gameInfo === null) {
      response.status(404).json({ error_message: '找不到資料' });
      return;
    }
    if (gameInfo === false) {
      throw new Error();
    }
    response.json({
      player_info: gameInfo.playerInfo,
      tasks: gameInfo.tasks,
      killed: gameInfo.killed,
      un_approve_count: gameInfo.unApproveCount,
    });
  } catch (error) {
    response.status(500).json({ error_message: '內部錯誤' });
  }
});

const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  server.on('upgrade', (request, socket, head) => {
    console.log('upgrade');
    WebSocketService.handleGameConnection(request, socket, head);
  });
});
