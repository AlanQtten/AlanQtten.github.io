import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import markDownItTaskLists from 'markdown-it-task-lists'

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

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  title: "blog",
  description: "blog",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'blog', link: `/blog/${blogList[0].link}`, activeMatch: '/blog/' },
      { text: "project", link: `/project/${projects[0].link}`, activeMatch: '/project/' }
      // { text: 'Examples', link: '/markdown-examples' }
    ],

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
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AlanQtten' }
    ]
  },
  markdown: {
    config(md) {
      md.use(markDownItTaskLists)
    }
  }
}))
