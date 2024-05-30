// @unocss-include
import { ShikiTransformer } from 'shiki'
import cx from 'classnames'

const regexWithStyle = [
  {
    regex: /\/\*\[!flag ([a-zA-Z0-9]+)\]\*\/$/,
    className: '!text-aq border border-solid border-aq p-1 text-xs rounded mr-2'
  },
  {
    regex: /\/\*\[!flag_error ([a-zA-Z0-9]+)\]\*\/$/,
    className: '!text-aq border border-solid border-aq p-1 text-xs rounded mr-2 bg-aq.error-800'
  }
]

const matchPipe = (str: string) => {
  let l = regexWithStyle.length
  for(let i = 0; i < l; i++) {
    let { regex, className } = regexWithStyle[i]
    let match = str.match(regex)
    if(match) {
      return {
        value: match[1],
        className,
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

      let pushInfo: { value: string, className: string } | undefined 

      allEle.push({
        ...ele,
        children: ele.children.reduce<any>((subChildren, subEle) => {
          let { match, value, replaceValue, className } = matchPipe((subEle as any).value)

          if(match) {
            subChildren.push(
              {
                ...subEle,
                value: replaceValue
              },
            )
            pushInfo = {
              value: value as string,
              className: className as string,
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
          class: cx(line.properties.class, 'leading-8')
        }
        allEle.push({
          type: 'element',
          tagName: 'span',
          properties: {
            className: pushInfo.className
          },
          children: [{ type: 'text', value: pushInfo.value }]
        })
      }

      return allEle
    }, [])
  }
}

export default transformer