import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import * as net from 'net';
import GameService from './GameService';

class WebSocketService {
  static gameServiceList: GameService[] = [];

  static async createGameService(name: string) {
    const service = new GameService(name);
    const roomId = await service.createRoom();
    WebSocketService.gameServiceList.push(service);
    return roomId;
  }

  static handleGameConnection(request: IncomingMessage, socket: net.Socket, head: Buffer) {
    console.log('handleGameConnection');
    try {
      if (!request.url) {
        throw new Error();
      }
      const pathRex = /^\/(\w+)\/(\w+)/;
      const matcher = request.url.match(pathRex);

      if (matcher === null) {
        throw new Error();
      }
      const [, roomId, player] = matcher;
      const gameServices = WebSocketService.gameServiceList;
      for (let index = 0; index < gameServices.length; index += 1) {
        const service = gameServices[index];
        if (service.roomId.toString() === roomId && service.playerExist(player) === false) {
          service.webSocketServer.handleUpgrade(request, socket, head, (client: WebSocket) => {
            service.webSocketServer.emit('connection', client, player);
          });
          return;
        }
      }
      socket.destroy();
    } catch (error) {
      console.log(error);
      socket.destroy();
    }
  }
}

export default WebSocketService;
