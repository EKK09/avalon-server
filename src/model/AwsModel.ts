import AWS from 'aws-sdk';
import { GameInfo } from './gameInfoModel';

AWS.config.update({
  region: 'us-east-2',
});

const docClient = new AWS.DynamoDB.DocumentClient();

export const getGameInfo = (roomId: number): Promise<GameInfo | null | false> => {
  const params = {
    TableName: 'Game',
    Key: {
      room_id: roomId,
    },
  };
  return new Promise((resolve) => {
    docClient.get(params, (err, data) => {
      if (err || !data.Item) {
        console.log(err);
        resolve(null);
      } else {
        console.log(data);
        const gameInfo = {
          tasks: data.Item.task_list,
          playerInfo: data.Item.player_info,
          unApproveCount: data.Item.un_approve_count,
          killed: data.Item.is_merlin_killed,
        };
        resolve(gameInfo);
      }
    });
  });
};

export const setGameInfo = (roomId: number, gameInfo: GameInfo): Promise<void> => {
  const params = {
    TableName: 'Game',
    Item: {
      room_id: roomId,
      task_list: gameInfo.tasks,
      un_approve_count: gameInfo.unApproveCount,
      is_merlin_killed: gameInfo.killed,
      player_info: gameInfo.playerInfo,
    },
  };
  return new Promise((resolve) => {
    docClient.put(params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
      resolve();
    });
  });
};
