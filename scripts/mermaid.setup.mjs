import fs from 'node:fs'
import { run } from '@mermaid-js/mermaid-cli'

function traverseDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = `${dir}/${f}`
    const isDirectory = fs.statSync(dirPath).isDirectory()
    isDirectory ? traverseDir(dirPath, callback) : callback(dirPath)
  })
}

function matchAllMermaidGraph(content) {
  let index = content.indexOf('```mermaid')
  const result = []
  while (index !== -1) {
    const end = content.indexOf('```', index + 1) + 3
    result.push({
      start: index,
      end,
    })

    index = content.indexOf('```mermaid', end + 1)
  }

  return result
}

function replaceStrByRange(content, start, end, replace) {
  return content.slice(0, start) + replace + content.slice(end)
}

traverseDir('./docs', (path) => {
  // console.log(path)
  if (!path.endsWith('.mermaid.md')) {
    return
  }

  const pathDir = path.split('/').slice(0, -1).join('/')
  const fileName = path.split('/').pop().replaceAll('.mermaid.md', '')

  run(
    path,
    `${pathDir}/${fileName}.dark.svg`,
    {
      parseMMDOptions: {
        backgroundColor: 'transparent',
        mermaidConfig: {
          theme: 'dark',
        },
      },
    },
  )
  run(path, `${pathDir}/${fileName}.svg`)

  const originalContent = fs.readFileSync(path).toString()
  let copiedContent = originalContent
  matchAllMermaidGraph(originalContent).reverse().forEach((content, index, arr) => {
    const fileIndex = arr.length - index

    // copiedContent
    copiedContent = replaceStrByRange(
      copiedContent,
      content.start,
      content.end,
      `<img src="./${fileName}.dark-${fileIndex}.svg" className="show-while-dark-mode">
<img src="./${fileName}-${fileIndex}.svg" className="hide-while-dark-mode">`,
    )
  })

  fs.writeFileSync(`${pathDir}/${fileName}.md`, copiedContent)
})
