import { ShikiTransformer } from 'shiki'

const regexWithStyle = [
  {
    regex: /\/\*\[!flag ([a-zA-Z0-9]+)\]\*\/$/,
    style: 'color: var(--vp-c-text-1);border: 1px solid var(--vp-c-text-1);padding: 4px;font-size: 12px;border-radius: 2px;margin-right: 4px'
  },
  {
    regex: /\/\*\[!flag_error ([a-zA-Z0-9]+)\]\*\/$/,
    style: 'color: var(--vp-c-text-1);border: 1px solid var(--vp-c-text-1);padding: 4px;font-size: 12px;border-radius: 2px;margin-right: 4px;background: var(--aq-error);'
  }
]

const matchPipe = (str: string) => {
  let l = regexWithStyle.length
  for(let i = 0; i < l; i++) {
    let { regex, style } = regexWithStyle[i]
    let match = str.match(regex)
    if(match) {
      return {
        value: match[1],
        style,
        replaceValue: str.replace(regex, ''),
        match: true
      }
    }
  }

  return {
    match: false
  }
} 

const transformer: ShikiTransformer = {
  line(line) {
    line.children = line.children.reduce<typeof line.children>((allEle, ele) => {
      if(ele.type === 'comment' || ele.type === 'text') {
        return allEle
      }

      let pushInfo: { value: string, style: any } | undefined 

      allEle.push({
        ...ele,
        children: ele.children.reduce<any>((subChildren, subEle) => {
          let { match, value, replaceValue, style } = matchPipe((subEle as any).value)

          if(match) {
            subChildren.push(
              {
                ...subEle,
                value: replaceValue
              },
            )
            pushInfo = {
              value: value as string,
              style,
            }
          
          }else {
            subChildren.push(subEle)
          }
          return subChildren
        }, [])
      })

      if(pushInfo) {
        line.properties = {
          ...line.properties,
          style: `${line.properties.style};line-height: 30px;`
        }
        allEle.push({
          type: 'element',
          tagName: 'span',
          properties: {
            style: pushInfo.style
          },
          children: [{ type: 'text', value: pushInfo.value }]
        })
      }

      return allEle
    }, [])
  }
}

export default transformer