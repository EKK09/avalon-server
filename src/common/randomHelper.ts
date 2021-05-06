export const getRandomNumber = (max: number, min = 0): number => min + Math.floor(Math.random() * max);

export const getRandomSubArray = (array: any[], length:number): any[] => {
  if (length === 0) {
    return [];
  }
  if (array.length < 2) {
    return array;
  }
  const subArray: any[] = [];

  while (subArray.length < length) {
    const selectedIndex = getRandomNumber(array.length);
    subArray.push(
      array.splice(selectedIndex, 1)[0],
    );
  }

  return subArray;
};

export const makeRandomArray = (array: any[]): any[] => {
  const randomArray: string[] = [];

  while (array.length > 0) {
    const randomIndex = getRandomNumber(array.length);
    const item = array.splice(randomIndex, 1)[0];
    randomArray.push(item);
  }

  return randomArray;
};
