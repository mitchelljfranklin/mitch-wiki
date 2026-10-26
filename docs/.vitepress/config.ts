import { defineConfig } from "vitepress";

const sidebar = [
  {
    text: "Getting Started",
    collapsed: true,
    items: [
      { text: "Introduction", link: "/getting-started/introduction" },
      { text: "Quick Start", link: "/getting-started/quick-start" },
    ],
  },
  {
    text: "Self-Hosting",
    collapsed: true,
    items: [
      { text: "Installation", link: "/self-hosting/installation" },
      { text: "Configuration", link: "/self-hosting/configuration" },
      { text: "Environment Variables", link: "/self-hosting/environment-variables" },
      { text: "Integrations", link: "/self-hosting/integrations" },
      { text: "Reverse Proxy", link: "/self-hosting/reverse-proxy/" },
      { text: "Development", link: "/self-hosting/development" },
    ],
  },
  {
    text: "User Guide",
    collapsed: true,
    items: [
      { text: "Workspace", link: "/user-guide/workspace" },
      { text: "Spaces", link: "/user-guide/spaces" },
      { text: "Pages", link: "/user-guide/pages" },
      { text: "Editor", link: "/user-guide/editor" },
      { text: "Search", link: "/user-guide/search" },
      { text: "Diagrams", link: "/user-guide/diagrams" },
      { text: "Authentication", link: "/user-guide/authentication/" },
      { text: "OIDC SSO", link: "/user-guide/authentication/oidc" },
      { text: "Groups", link: "/user-guide/groups" },
      { text: "Import & Export", link: "/user-guide/import-export" },
      { text: "Preferences", link: "/user-guide/preferences" },
      { text: "Translations", link: "/user-guide/translations" },
    ],
  },
  {
    text: "API Reference",
    collapsed: true,
    items: [
      { text: "Overview & Endpoints", link: "/api-reference/overview" },
    ],
  },
  {
    text: "FAQ",
    link: "/faq",
  },
];

export default defineConfig({
  title: "Mitch-Wiki",
  description:
    "Open-source collaborative wiki and documentation — self-hosted, modern editor, real-time collaboration",
  lang: "en-US",
  srcDir: ".",
  base: "/",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["meta", { name: "theme-color", content: "#2b7af1" }],
  ],

  themeConfig: {
    logo: "/favicon.svg",
    search: { provider: "local" },

    nav: [
      { text: "Home", link: "/" },
      { text: "GitHub", link: "https://github.com/mitchelljfranklin/mitch-wiki" },
    ],

    sidebar,

    socialLinks: [
      { icon: "github", link: "https://github.com/mitchelljfranklin/mitch-wiki" },
    ],

    editLink: {
      pattern:
        "https://github.com/mitchelljfranklin/mitch-wiki/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },

    outline: [2, 3],

    footer: {
      message:
        "Open-source, self-hosted wiki platform. Licensed under AGPL-3.0.",
    },
  },

  vite: {
    server: {
      fs: {
        allow: [".."],
      },
    },
  },

  ignoreDeadLinks: [
    "http://localhost:3080",
  ],
});
