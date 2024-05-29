import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import markDownItTaskLists from 'markdown-it-task-lists'
import transformerFlag from './transformers/transformerFlag'

const blogList = [
  { text: '关于x-mixed-replace', link: 'x-mixed-replace' },
  { text: '--ff和--no-ff', link: 'ff-and-no-ff' },
  { text: '一个计算器', link: 'a-calculator' },
  { text: 'import和require', link: 'import-and-require' },
  { text: '岛', link: 'island' }
]

const projects = [
  { text: "list", link: 'list' }
]

const rustList = [
  { text: '什么是所有权？', link: 'what-is-ownership' },
]

type NavItem = NonNullable<NonNullable<Parameters<typeof defineConfig>[0]['themeConfig']>['nav']>[number]

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "blog",
  description: "blog",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'blog', link: `/blog/${blogList[0].link}`, activeMatch: '/blog/' },
      { text: "project", link: `/project/${projects[0].link}`, activeMatch: '/project/' },
      { text: "rust", link: `/rust/${rustList[0].link}`, activeMatch: '/rust/' },
      process.env.NODE_ENV === 'development' && { text: 'playground', link: '/playground' }
    ].filter(Boolean) as NavItem[],

    sidebar: {
      '/blog/': { 
        base: '/blog/', 
        items: [
          { 
            text: "2024",
            items: blogList
          }
        ] 
      },

      '/rust': {
        base: '/rust/',
        items: rustList
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AlanQtten' }
    ]
  },
  markdown: {
    config(md) {
      md.use(markDownItTaskLists)
    },
    codeTransformers: [
      transformerFlag
    ]
  }
}))
