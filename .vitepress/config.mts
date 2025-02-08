import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Scrypted Scripts",
  head: [
    ['link', { rel: 'icon', href: '/img/icons/apple-icon-180.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/img/icons/apple-icon-180.png' }],
    ['link', { rel: 'mask-icon', href: '/img/icons/safari-pinned-tab.svg', color: '#3a0839' }],
    ['link', { rel: 'shortcut icon', href: '/img/icons/favicon-196.png' }],
  ],
  description: "Curated list of useful scripts and automations for Scrypted.",
  themeConfig: {
    editLink: {
      pattern: 'https://github.com/scryptedapp/scripts.scrypted.app/edit/main/:path'
    },
    logo: '/img/logo.png',
    search: {
      provider: 'local'
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Scrypted Docs', link: 'https://docs.scrypted.app' },
    ],

    sidebar: [
      {
        text: 'General',
        items: [
          { text: 'Extension Toggle', link: '/extension-toggle' },
          { text: 'Minimal Switch', link: '/minimal-switch' },
        ]
      },
      {
        text: 'Notifications',
        items: [
          { text: 'Discord Notifications', link: '/discord-notifier' },
          { text: 'Notification Filter', link: '/notification-filter' },
          { text: 'Notification Toggle', link: '/notification-toggle' },
        ]
      },
      {
        text: 'Cameras',
        items: [
          { text: 'Privacy Mask Toggle', link: '/privacy-mask-toggle' },
          { text: 'Pan/Tilt/Zoom Move Button', link: '/ptz-button' },
          { text: 'Pan/Tilt/Zoom Preset Button', link: '/ptz-preset-button' },
          { text: 'Pan/Tilt/Zoom Speed', link: '/ptz-speed' },
          { text: 'Stream to Chromecast Button', link: '/camera-chromecast-button' },
          { text: 'Temperature Overlay', link: '/temperature-overlay' },
        ],
      },
      {
        text: 'Other Devices',
        items: [
          { text: 'Play Audio Button', link: '/play-audio-button' },
          { text: 'Text To Speech Button', link: '/tts-audio-button' },
          { text: 'RATGDO (Garage) MQTT', link: '/ratgdo-mqtt' },
        ],
      },
      {
        text: 'Scrypted NVR',
        items: [
          { text: 'Privacy Mode Toggle', link: '/nvr/privacy-mode-toggle' },
          { text: 'Detection Benchmark', link: '/object-detection-benchmark' },
          { text: 'Face Recognition Unlock', link: '/face-recognition-unlock' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'discord', link: 'https://discord.gg/DcFzmBHYGq' },
      { icon: { svg: '<svg viewBox="0 0 800 800"><path d="M460 668c36-19 84 7 74 43h-268c-10-36 38-62 74-43h120z" /><ellipse cx="472" cy="536" rx="72" ry="86" /><ellipse cx="328" cy="536" rx="72" ry="86" /><path d="M425 711c55-30 89-158 67-268h-184c-22 110 12 238 67 268h50z" /><circle cx="578" cy="269" r="44" /><circle cx="222" cy="269" r="44" /><ellipse cx="400" cy="329" rx="197" ry="129" /><circle class="reddit-eyes" cx="331" cy="304" r="32" /><circle class="reddit-eyes" cx="469" cy="304" r="32" /><path class="reddit-line" d="M521 116l-88-20-32 102M468 388s-16 21-68 21-68-21-68-21" /><circle cx="556" cy="123" r="34" /></svg>' }, link: 'https://reddit.com/r/Scrypted' },
      { icon: 'github', link: 'https://github.com/scryptedapp/scripts.scrypted.app' },
    ]
  }
})
