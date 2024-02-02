import { defineConfig } from 'vitepress'

const blogList = [
  { text: '关于`x-mixed-replace`', link: 'x-mixed-replace' },
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "blog",
  description: "blog",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'blog', link: `/blog/${blogList[0].link}`, activeMatch: '/blog/' },
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
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/AlanQtten' }
    ]
  }
})
