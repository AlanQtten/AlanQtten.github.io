const sorter = (a, b) => a - b

const objectEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a).sort(sorter);
  const keysB = Object.keys(b).sort(sorter);

  if (keysA.length !== keysB.length) return false;

  const l = keysA.length;
  for(let i = 0; i < l; i++) {
    const key = keysA[i];
    if(typeof a[key] === 'object') {
      if(!objectEqual(a[key], b[key])) return false;
    }else if(a[key] !== b[key]) { 
      return false
    }
  }

  return true;
}

export default objectEqual;