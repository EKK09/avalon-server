import Redis from 'ioredis';

export interface GameRoomReturn {
  success: boolean;
  message: string;
  data: string | null;
}

class GameRoomModel {
  static DB_PORT = process.env.REDIS_DB_PORT;

  static redis = new Redis(GameRoomModel.DB_PORT, { enableAutoPipelining: true });

  static async create(playerName: string): Promise<number> {
    const roomId = await GameRoomModel.redis.incr('next_room_id');
    await GameRoomModel.redis.sadd(`game_room:${roomId}`, [playerName]);
    return roomId;
  }
}

export default GameRoomModel;
