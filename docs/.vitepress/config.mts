import type { Route } from './types'
import process from 'node:process'
import { transformerMetaWordHighlight } from '@shikijs/transformers'
import markDownItTaskLists from 'markdown-it-task-lists'
import { defineConfig } from 'vitepress'
import transformerFlag from '../transformers/transformerFlag'
import { rustList } from './rust-list'
import { findFirstAvailableLink } from './utils'

const blogList: Route[] = [
  { text: '关于x-mixed-replace', link: 'x-mixed-replace' },
  { text: '--ff和--no-ff', link: 'ff-and-no-ff' },
  { text: '一个计算器', link: 'a-calculator' },
  { text: 'import和require', link: 'import-and-require' },
  { text: '岛', link: 'island' },
  { text: '一个有趣的选择列', link: 'fun-select-col' },
  { text: '一些配色', link: 'some-color' },
]

const projects: Route[] = [
  { text: 'list', link: 'list' },
]

type NavItem = NonNullable<NonNullable<Parameters<typeof defineConfig>[0]['themeConfig']>['nav']>[number]

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'blog',
  description: 'blog',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'blog', link: `/blog/${findFirstAvailableLink(blogList)}`, activeMatch: '/blog/' },
      { text: 'project', link: `/project/${findFirstAvailableLink(projects)}`, activeMatch: '/project/' },
      { text: 'rust', link: `/rust/${findFirstAvailableLink(rustList)}`, activeMatch: '/rust/' },
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
  transformHead({ assets }) {
    // 相应地调整正则表达式以匹配字体
    const myFontFile = assets.find(fileName => /\.woff2$/.test(fileName))
    if (myFontFile) {
      return [
        [
          'link',
          {
            rel: 'preload',
            href: myFontFile,
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
          },
        ],
      ]
    }
  },
})
