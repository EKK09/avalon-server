import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import * as net from 'net';
import GameService from './GameService';

export enum ServiceJoinCode {
  OK = 100,
  GAME_NOT_EXIST = 99,
  PLAYER_EXIST = 98
}
class WebSocketService {
  static gameServiceList: GameService[] = [];

  static async createGameService() {
    const service = new GameService();
    const roomId = await service.createRoom();
    WebSocketService.gameServiceList.push(service);
    console.log(`服務數量 ${WebSocketService.gameServiceList.length}`);
    return roomId;
  }

  static removeService(service: GameService) {
    const services = WebSocketService.gameServiceList;
    for (let index = 0; index < services.length; index += 1) {
      if (service === services[index]) {
        WebSocketService.gameServiceList.splice(index, 1);
        return;
      }
    }
  }

  static handleGameConnection(request: IncomingMessage, socket: net.Socket, head: Buffer) {
    console.log('handleGameConnection');
    try {
      if (!request.url) {
        throw new Error();
      }

      let [, roomId, player] = request.url.split('/');
      roomId = decodeURIComponent(roomId);
      player = decodeURIComponent(player);

      if (!roomId || !player) {
        throw new Error();
      }

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

  static getGameServiceByRoomId(roomId: number): GameService | null {
    const services = WebSocketService.gameServiceList;
    for (let index = 0; index < services.length; index += 1) {
      const service = services[index];
      if (service.roomId === roomId) {
        return service;
      }
    }
    return null;
  }

  static getGameServiceJoinableMessage(roomId: number, playerName: string): ServiceJoinCode {
    const service = WebSocketService.getGameServiceByRoomId(roomId);

    if (service === null) {
      return ServiceJoinCode.GAME_NOT_EXIST;
    }

    if (service.playerList.includes(playerName)) {
      return ServiceJoinCode.PLAYER_EXIST;
    }

    return ServiceJoinCode.OK;
  }

  static getGameServiceHost(roomId: number): string {
    const service = WebSocketService.getGameServiceByRoomId(roomId);

    if (service === null) {
      return '';
    }

    return service.playerList[0];
  }
}

export default WebSocketService;
