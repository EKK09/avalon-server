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
      array.splice(selectedIndex, 1),
    );
  }

  return subArray;
};
