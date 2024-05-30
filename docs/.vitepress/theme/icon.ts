const dark = '#333'
const light = '#fff'

function leftFillZero(text: string | number): string {
  return String(+text < 10 ? `0${text}` : text)
}

function refreshIcon(isDark?: boolean) {
  // var canvas = document.getElementById('myCanvas');
  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = 200
  canvas.height = 200

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  // 设置字体样式
  ctx.font = '100px bold Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 设置画布背景色
  ctx.fillStyle = isDark ? light : dark
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const contentColor = isDark ? dark : light
  ctx.fillStyle = contentColor
  const today = new Date()
  ctx.fillText(leftFillZero(today.getMonth() + 1), 55, 55)
  ctx.fillText(leftFillZero(today.getDate()), canvas.width - 55, canvas.height - 45)

  // 绘制斜线
  ctx.strokeStyle = contentColor
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.moveTo(canvas.width - 20, 20)
  ctx.lineTo(20, canvas.height - 20)
  ctx.stroke()

  let iconLink = document.querySelector('head link[rel=icon]') as HTMLLinkElement
  if (!iconLink) {
    iconLink = document.createElement('link')
    iconLink.rel = 'icon'
    document.head.appendChild(iconLink)
  }

  iconLink.href = canvas.toDataURL()
}

export default function iconSetup() {
  if (globalThis && globalThis.matchMedia) {
    const media = globalThis.matchMedia('(prefers-color-scheme: dark)')

    media.addEventListener('change', (e) => {
      refreshIcon(e.matches)
    })

    refreshIcon(media.matches)
  }
}
