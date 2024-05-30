function arrayEqual(a: any[], b: any[]): boolean {
  if (a === b)
    return true
  if (a == null || b == null)
    return true
  if (a.length !== b.length)
    return false

  const l = a.length

  for (let i = 0; i < l; i++) {
    if (!b.includes(a[i]))
      return false
  }

  return true
}

export default arrayEqual
