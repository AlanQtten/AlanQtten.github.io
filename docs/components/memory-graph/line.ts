import type { CSSProperties } from 'vue'

export enum LineType {
  // both side in vertical
  right2right = 'right2right',
  left2left = 'left2left',

  // different side in vertical
  right2left = 'right2left',
  right2bottom2left = 'right2bottom2left',

  // some simple curve
  right2bottom = 'right2bottom',

  // some complex curve
  bottom2right = 'bottom2right',
}

interface LineTypeWithOption {
  lineType: LineType
  options: {
    offsetX?: number
    offsetY?: number
  }
}

const verticalBothSide = [LineType.right2right, LineType.left2left]

enum PathType {
  M = 'M',
  Q = 'Q',
  T = 'T',
  C = 'C',
}

export type M = [PathType.M, number, number]
export type Q = [PathType.Q, number, number, number, number]
export type T = [PathType.T, number, number]
export type C = [PathType.C, number, number, number, number, number, number]

export type Rest<T> = T extends [any, ...infer U] ? U : never

type D = Array<M | Q | T | C>

interface Path {
  d: string
}

interface Polygon {
  transform: string
}

interface DataPackage {
  startWidth: number
  startHeight: number
  endWidth: number
  endHeight: number
  pointerStartLeft: number
  pointerStartTop: number
  pointerEndLeft: number
  pointerEndTop: number
}

interface Svg {
  key: number | string
  style: CSSProperties
  path: Path
  polygon: Polygon
}

type PointerModifier = (p: [number, number], pkg: DataPackage) => [number, number]

const defaultPointerModifier: PointerModifier = p => p

export interface Options {
  wrapper?: HTMLElement
  reverse?: boolean
  modifier?: {
    D?: (d: D, pkg: DataPackage) => D
    M?: (p: Rest<M>, pkg: DataPackage) => Rest<M>
    Q?: (p: Rest<Q>, pkg: DataPackage) => Rest<Q>
    T?: (p: Rest<T>, pkg: DataPackage) => Rest<T>
    C?: (p: Rest<C>, pkg: DataPackage) => Rest<C>
    pointStart?: PointerModifier
    pointEnd?: PointerModifier
  }
  startFrom?: 'center' | 'edge'
  pointTo?: 'center' | 'edge'
}

const _px = (n: number) => `${n}px`

function d2Str(d: D) {
  return d.map((_d) => {
    if (_d[0] === PathType.C) {
      return `C ${_d[1]} ${_d[2]}, ${_d[3]} ${_d[4]}, ${_d[5]} ${_d[6]}`
    }

    return _d.join(' ')
  }).join(' ')
}

function pipeModifier(d: D, modifier: Options['modifier'], pkg: DataPackage): D {
  if (!modifier)
    return d

  if (modifier.D) {
    return modifier.D(d, pkg)
  }

  return d.map((_d) => {
    switch (_d[0]) {
      case PathType.M: return modifier.M ? [PathType.M, ...modifier.M(_d.slice(1) as Rest<M>, pkg)] : _d
      case PathType.Q: return modifier.Q ? [PathType.Q, ...modifier.Q(_d.slice(1) as Rest<Q>, pkg)] : _d
      case PathType.T: return modifier.T ? [PathType.T, ...modifier.T(_d.slice(1) as Rest<T>, pkg)] : _d
      case PathType.C: return modifier.C ? [PathType.C, ...modifier.C(_d.slice(1) as Rest<C>, pkg)] : _d
    }

    return _d
  })
}

export function line(start: HTMLElement, end: HTMLElement, _lineType: LineType | LineTypeWithOption, options: Options = {}): Svg[] {
  let { reverse, modifier: customModifier, startFrom = 'center', pointTo = 'center', wrapper } = options

  const lineType = typeof _lineType === 'string' ? _lineType : _lineType.lineType
  const lineTypeOptions = typeof _lineType === 'object' ? _lineType.options : {}

  let offsetX = lineTypeOptions.offsetX
  let offsetY = lineTypeOptions.offsetY

  const {
    // width: pw, height: ph,
    top: pt,
    left: pl,
  } = (wrapper ?? start.parentElement)!.getBoundingClientRect()
  let { width: sw, height: sh, top: st, left: sl } = start.getBoundingClientRect()
  let { width: ew, height: eh, top: et, left: el } = end.getBoundingClientRect()

  const psMd = customModifier?.pointStart ?? defaultPointerModifier
  const peMd = customModifier?.pointEnd ?? defaultPointerModifier

  const isVerticalBothSide = verticalBothSide.includes(lineType)
  const reverseStartAndEnd = st > et && isVerticalBothSide

  if (reverseStartAndEnd) {
    [sw, ew] = [ew, sw];
    [sh, eh] = [eh, sh];
    [st, et] = [et, st];
    [sl, el] = [el, sl]
    reverse = !reverse
  }

  const sl2p = sl - pl
  const st2p = st - pt
  const el2p = el - pl
  const et2p = et - pt

  const gapY = Math.abs(st - et) - (st > et ? eh : sh)
  const gapX = Math.abs(sl - el) - (sl > el ? ew : sw)

  let h = gapY + sh + eh
  let l = Math.min(sl, el) - pl
  const t = Math.min(st, et) - pt
  let w = isVerticalBothSide ? Math.max(sw, ew) : Math.abs(sl - el) + ew

  const d: D = []
  let transform = ''

  let psl = sl2p - l + sw / 2 // pointer start left
  let pst = st2p - t + sh / 2 // pointer start top
  let pel = el2p - l + ew / 2 // pointer end left
  let pet = et2p - t + eh / 2 // pointer end top

  const pkg: DataPackage = {
    startWidth: sw,
    startHeight: sh,
    endWidth: ew,
    endHeight: eh,
    pointerStartLeft: psl,
    pointerStartTop: pst,
    pointerEndLeft: pel,
    pointerEndTop: pet,
  }

  switch (lineType) {
    case LineType.right2right:
      if (startFrom === 'edge') {
        reverseStartAndEnd ? (pel += ew / 2) : (psl += sw / 2)
      }
      if (pointTo === 'edge') {
        reverseStartAndEnd ? (psl += sw / 2) : (pel += ew / 2)
      }
      w += 100;
      [psl, pst] = psMd([psl, pst], pkg);
      [pel, pet] = peMd([pel, pet], pkg)

      d.push(
        [PathType.M, psl, pst],
        [PathType.C, w, h * 0.1, w, h * 0.9, pel, pet],
      )

      transform = `translate(${reverse ? `${psl + 5} ${pst}` : `${pel + 5} ${pet}`}) rotate(180)`
      break
    case LineType.left2left:
      if (startFrom === 'edge') {
        reverseStartAndEnd ? (pel -= ew / 2) : (psl -= sw / 2)
      }
      if (pointTo === 'edge') {
        reverseStartAndEnd ? (psl -= sw / 2) : (pel -= ew / 2)
      }
      w += 100
      l -= 100;
      [psl, pst] = psMd([psl, pst], pkg);
      [pel, pet] = peMd([pel, pet], pkg)

      d.push(
        [PathType.M, psl + 100, pst],
        [PathType.C, 0, h * 0.1, 0, h * 0.9, pel + 100, pet],
      )

      transform = `translate(${reverse ? `${psl + 100 - 5} ${pst}` : `${pel + 100 - 5} ${pet}`})`
      break
    case LineType.right2left:
      if (startFrom === 'edge') {
        psl += sw / 2
      }
      if (pointTo === 'edge') {
        pel -= ew / 2
      }
      [psl, pst] = psMd([psl, pst], pkg);
      [pel, pet] = peMd([pel, pet], pkg)

      d.push(
        [PathType.M, psl, pst],
        st < et
          ? [PathType.Q, pel * 0.5, h * 0.75, pel * 0.5, h * 0.5]
          : [PathType.Q, pel * 0.5, h * 0.75, pel * 0.5, h * 0.5],
        [PathType.T, pel, pet],
      )

      transform = `translate(${reverse ? `${psl + 5} ${pst}` : `${pel - 5} ${pet}`}) rotate(${reverse ? 180 : 0})`
      break
    case LineType.right2bottom2left:
      if (startFrom === 'edge') {
        psl += sw / 2
      }
      if (pointTo === 'edge') {
        pel -= ew / 2
      }
      h += 64;
      [psl, pst] = psMd([psl, pst], pkg);
      [pel, pet] = peMd([pel, pet], pkg)

      d.push(
        [PathType.M, psl, pst],
        [PathType.C, sw + gapX * 0.7, pst - sh / 4, gapX * 0.1, h, sw + gapX / 2, h - 1],
        [PathType.C, sw + gapX * 1.3, h, sw + gapX * 0.5, pet - eh / 3, pel, pet],
      )

      transform = `translate(${reverse ? `${psl + 5} ${pst}` : `${pel - 5} ${pet}`}) rotate(${reverse ? 180 : 0})`
      break
    case LineType.right2bottom:
      if (startFrom === 'edge') {
        psl += sw / 2
      }
      if (pointTo === 'edge') {
        pet += eh / 2
      }
      [psl, pst] = psMd([psl, pst], pkg);
      [pel, pet] = peMd([pel, pet], pkg)

      offsetX = lineTypeOptions.offsetX ?? 0
      w += offsetX

      d.push(
        [PathType.M, psl, pst],
        [PathType.Q, sw + gapX * 0.4, h * 0.9, sw + gapX * 0.75, h * 0.8],
        [PathType.T, pel, pet],
      )
      transform = `translate(${pel} ${pet + 5}) rotate(-90)`
      break

    case LineType.bottom2right:
      if (startFrom === 'edge') {
        pst += sh / 2
      }
      if (pointTo === 'edge') {
        pel += ew / 2
      }

      offsetX = lineTypeOptions.offsetX ?? 120
      offsetY = lineTypeOptions.offsetY ?? 120
      h += offsetY
      w += offsetX

      d.push(
        [PathType.M, psl, pst],
        [PathType.C, psl, pst + offsetY, pel + offsetX, pst + offsetY, pel + offsetX, pet + Math.max((pst + offsetY) / 3, gapY)],
        [PathType.Q, pel + offsetX, pet, pel, pet],
      )
      transform = `translate(${pel + 5} ${pet}) rotate(180)`
      break
    default:
      break
  }

  pkg.pointerStartLeft = psl
  pkg.pointerStartTop = pst
  pkg.pointerEndLeft = pel
  pkg.pointerEndTop = pet

  return [{
    key: 0,
    style: {
      // background: 'rgba(255, 0, 0, .1)',
      position: 'absolute',
      width: _px(w),
      height: _px(h),
      left: _px(l),
      top: _px(t),
    },
    path: { d: d2Str(pipeModifier(d, customModifier, pkg)) },
    polygon: {
      transform,
    },
  }]
}
