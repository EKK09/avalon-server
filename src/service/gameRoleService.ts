import { getRandomSubArray, makeRandomArray } from '../common/randomHelper';

export enum GameRoleName {
  MERLIN = 'MERLIN',
  PERCIVAL = 'PERCIVAL',
  ASSASSIN = 'ASSASSIN',
  MORGANA = 'MORGANA',
  OBERON = 'OBERON',
  MORDRED = 'MORDRED',
  SERVANT = 'SERVANT',
  MINION = 'MINION',
  UNSET = ''
}
class GameRoleService {
  static GOOD_ROLE: GameRoleName[] = [
    GameRoleName.MERLIN,
    GameRoleName.PERCIVAL,
    GameRoleName.SERVANT,
  ];

  static EVIL_ROLE: GameRoleName[] = [
    GameRoleName.ASSASSIN,
    GameRoleName.MORGANA,
    GameRoleName.OBERON,
    GameRoleName.MORDRED,
    GameRoleName.MINION,
  ];

  static getGameRoleList(playerCount: number): GameRoleName[] {
    const goods = GameRoleService.getGoodList(playerCount);
    const evils = GameRoleService.getEvilList(playerCount);
    const roles = [...goods, ...evils];
    const randomArray = makeRandomArray(roles);
    return randomArray;
  }

  static isGood(role: GameRoleName): boolean {
    return GameRoleService.GOOD_ROLE.includes(role);
  }

  static getGoodList(playerCount: number): string[] {
    const selectableGoods: string[] = [
      GameRoleName.PERCIVAL,
      GameRoleName.SERVANT,
      GameRoleName.SERVANT,
      GameRoleName.SERVANT,
      GameRoleName.SERVANT,
      GameRoleName.SERVANT,
    ];
    const selectedGoods:string[] = [GameRoleName.MERLIN];
    let selectedLength: number = 2;
    if (playerCount === 5) {
      selectedLength = 2;
    } else if (playerCount === 6 || playerCount === 7) {
      selectedLength = 3;
    } else if (playerCount === 8) {
      selectedLength = 4;
    } else if (playerCount === 9 || playerCount === 10) {
      selectedLength = 5;
    }
    const randomGoods = getRandomSubArray(selectableGoods, selectedLength);
    return selectedGoods.concat(randomGoods);
  }

  static getEvilList(playerCount: number) {
    const selectableEvils: string[] = [
      GameRoleName.MORDRED,
      GameRoleName.OBERON,
      GameRoleName.MORGANA,
      GameRoleName.MINION,
      GameRoleName.MINION,
      GameRoleName.MINION];
    const selectedEvils:string[] = [GameRoleName.ASSASSIN];
    let selectedLength: number = 1;
    if (playerCount === 5 || playerCount === 6) {
      selectedLength = 1;
    } else if (playerCount === 7 || playerCount === 8 || playerCount === 9) {
      selectedLength = 2;
    } else if (playerCount === 10) {
      selectedLength = 3;
    }
    const randomEvils = getRandomSubArray(selectableEvils, selectedLength);
    return selectedEvils.concat(randomEvils);
  }

  static isRevealableEvil(role: GameRoleName) {
    const RevealableEvils = [
      GameRoleName.OBERON,
      GameRoleName.MORGANA,
      GameRoleName.ASSASSIN,
      GameRoleName.MINION,
    ];
    return RevealableEvils.includes(role);
  }

  static isKnowEachOtherEvil(role: GameRoleName) {
    const evils = [
      GameRoleName.MORDRED,
      GameRoleName.MORGANA,
      GameRoleName.MINION,
      GameRoleName.ASSASSIN,
    ];
    return evils.includes(role);
  }
}

export default GameRoleService;
