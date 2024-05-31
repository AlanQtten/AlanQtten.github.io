export function Vec(param: { cap: number, point2: string }) {
  const { cap, point2 } = param

  return {
    title: 'Vec',
    body: [
      { name: 'buf', value: {
        title: 'RawVec',
        body: [
          { name: 'ptr', value: {
            title: 'Unique',
            body: [
              { name: 'pointer', value: {
                title: 'NonNull',
                body: [
                  { name: 'pointer', point2 },
                ],
              } },
            ],
          } },
          { name: 'cap', value: cap },
        ],
      } },
      { name: 'len', value: cap },
    ],
  }
}
