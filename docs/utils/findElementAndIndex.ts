function findElementAndIndex<T>(arr: T[], callback: (item: T, index: number, _arr: T[]) => boolean): [T, number] | undefined {
  for (let i = 0; i < arr.length; i++) {
    if (callback(arr[i], i, arr)) {
      return [arr[i], i]
    }
  }
  return undefined
}

export default findElementAndIndex
