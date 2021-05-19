import { getRandomSubArray, makeRandomArray } from '../common/randomHelper';

export enum GameRoleName {
  MERLIN = 'Merlin',
  PERCIVAL = 'Percival',
  ASSASSIN = 'Assassin',
  MORGANA = 'Morgana',
  OBERON = 'Oberon',
  MORDRED = 'Mordred',
  GOOD = 'good',
  EVIL = 'evil',
  UNSET = ''
}
class GameRoleService {
  static GOOD_ROLE: GameRoleName[] = [
    GameRoleName.MERLIN,
    GameRoleName.PERCIVAL,
    GameRoleName.GOOD,
  ];

  static EVIL_ROLE: GameRoleName[] = [
    GameRoleName.ASSASSIN,
    GameRoleName.MORGANA,
    GameRoleName.OBERON,
    GameRoleName.MORDRED,
    GameRoleName.EVIL,
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
      GameRoleName.GOOD,
      GameRoleName.GOOD,
      GameRoleName.GOOD,
      GameRoleName.GOOD,
      GameRoleName.GOOD,
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
      GameRoleName.EVIL,
      GameRoleName.EVIL,
      GameRoleName.EVIL];
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
      GameRoleName.EVIL,
    ];
    return RevealableEvils.includes(role);
  }

  static isKnowEachOtherEvil(role: GameRoleName) {
    const evils = [
      GameRoleName.MORDRED,
      GameRoleName.MORGANA,
      GameRoleName.EVIL,
      GameRoleName.ASSASSIN,
    ];
    return evils.includes(role);
  }
}

export default GameRoleService;
