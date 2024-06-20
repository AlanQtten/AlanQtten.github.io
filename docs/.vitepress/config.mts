import process from 'node:process'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import markDownItTaskLists from 'markdown-it-task-lists'
import UnoCss from 'unocss/vite'
import { transformerMetaWordHighlight } from '@shikijs/transformers'
import transformerFlag from '../transformers/transformerFlag'

const blogList = [
  { text: '关于x-mixed-replace', link: 'x-mixed-replace' },
  { text: '--ff和--no-ff', link: 'ff-and-no-ff' },
  { text: '一个计算器', link: 'a-calculator' },
  { text: 'import和require', link: 'import-and-require' },
  { text: '岛', link: 'island' },
]

const projects = [
  { text: 'list', link: 'list' },
]

// 🚧

const rustList = [
  {
    text: '3. 常规编程概念',
    link: 'common-programming-concepts',
    items: [
      { text: '3.1 变量和可变性', link: 'variables-and-mutability' },
      { text: '3.2 数据类型', link: 'data-types' },
      { text: '3.3 函数', link: 'functions' },
      { text: '3.4 注释', link: 'comments' },
      { text: '3.5 流程控制', link: 'control-flow' },
    ],
  },
  {
    text: '4. 理解所有权',
    link: 'understanding-ownership',
    items: [
      { text: '4.1 什么是所有权？', link: 'what-is-ownership' },
      { text: '4.2 引用和借用', link: 'references-and-borrowing' },
      { text: '4.3 修复错误的所有权', link: 'fixing-ownership-errors' },
      { text: '4.4 切片类型', link: 'the-slice-type' },
      { text: '4.5 所有权回顾', link: 'ownership-recap' },
    ],
  },
  {
    text: '5. 使用结构体存储相关联的数据',
    link: 'using-structs-to-structure-related-data',
    items: [
      { text: '5.1 定义和实例化结构体', link: 'defining-and-instantiating-structs' },
    ],
  },
]

type NavItem = NonNullable<NonNullable<Parameters<typeof defineConfig>[0]['themeConfig']>['nav']>[number]

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: 'blog',
  description: 'blog',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'blog', link: `/blog/${blogList[0].link}`, activeMatch: '/blog/' },
      { text: 'project', link: `/project/${projects[0].link}`, activeMatch: '/project/' },
      { text: 'rust', link: `/rust/${rustList[0].items[0].link}`, activeMatch: '/rust/' },
      process.env.NODE_ENV !== 'production' && { text: 'playground', link: '/playground/playground' },
    ].filter(Boolean) as NavItem[],

    sidebar: {
      '/blog/': {
        base: '/blog/',
        items: [
          {
            text: '2024',
            items: blogList,
          },
        ],
      },

      '/rust': {
        base: '/rust/',
        items: rustList,
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AlanQtten' },
    ],
  },
  markdown: {
    config(md) {
      md.use(markDownItTaskLists)
    },
    codeTransformers: [
      transformerMetaWordHighlight(),
      transformerFlag,
    ],
  },
  vite: {
    plugins: [
      UnoCss(),
    ],
  },
}))
