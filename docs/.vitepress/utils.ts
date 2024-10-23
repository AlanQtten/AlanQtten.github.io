import type { Route } from './types'

export function findFirstAvailableLink(routes: Route[]) {
  return routes[0]?.items?.[0]?.link ?? routes[0]?.link
}
