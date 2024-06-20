import type { Point2 } from '../components/memory-graph/MemoryGraph.vue'

interface Value {
  title: string
  body: Array<{ name: string, value?: Value | number | string, point2?: Point2 }>
}

export function Vec(param: { cap: number, point2: Point2 }): Value {
  const { cap, point2 } = param

  return {
    title: 'Vec',
    body: [
      {
        name: 'buf',
        value: {
          title: 'RawVec',
          body: [
            {
              name: 'ptr',
              value: {
                title: 'Unique',
                body: [
                  {
                    name: 'pointer',
                    value: {
                      title: 'NonNull',
                      body: [{ name: 'pointer', point2 }],
                    },
                  },
                ],
              },
            },
            { name: 'cap', value: cap },
          ],
        },
      },
      { name: 'len', value: cap },
    ],
  }
}
