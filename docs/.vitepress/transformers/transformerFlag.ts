import { ShikiTransformer } from 'shiki'

const regex = /\/\*\[!flag ([a-zA-Z0-9]+)\]\*\/$/;

const transformer: ShikiTransformer = {
  line(line) {
    line.children = line.children.reduce<typeof line.children>((allEle, ele) => {
      let pushInfo: { value: string } | undefined 

      allEle.push({
        ...ele,
        children: ele.children.reduce<any>((subChildren, subEle) => {
          let match = subEle.value.match(regex)
          if(match) {
            subChildren.push(
              {
                ...subEle,
                value: subEle.value.replace(regex, '')
              },
            )
            pushInfo = {
              value: match[1]
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
            style: 'color: var(--vp-c-text-1);border: 1px solid var(--vp-c-text-1);padding: 4px;font-size: 12px;border-radius: 2px;margin-right: 4px'
          },
          children: [{ type: 'text', value: pushInfo.value }]
        })
      }

      return allEle
    }, [])
  }
}

export default transformer