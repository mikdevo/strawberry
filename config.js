window.PROFILE_CONFIG = {
  site: {
    backgroundImage: "./assets/background.png",
    animatedBackground: {
      enabled: true,
      type: "blobs",
      blobs: 5,
      speed: 28
    },
    theme: {
      primary: "#ffffff",
      accent: "#ffc0cb",
      secondary: "#f0f0f0",
      text: "#ffffff",
      muted: "#e8e8e8",
    },
  },
  user: {
    displayName: "strawberry",
    avatar: "./avatar.png",
    banner: "./banner.png",
    roles: [
      "Designer",
      "Quoter",
      "Creative Artist",
    ],
  },
  roles: {
    "Designer": '<i class="fas fa-palette"></i>',
    "Quoter": '<i class="fas fa-quote-left"></i>',
    "Creative Artist": '<i class="fas fa-paint-brush"></i>',
  },
  dynamic: {
    discord: {
      enabled: true,
      userId: "1416933664264163329",
      sourcePriority: ["japi", "lanyard"],
      refreshMs: 10000,
      overrideDisplayName: false,
      imageSizes: { avatar: 512, banner: 2048 },
    },
  },
  socials: [
    { name: "Discord", url: "https://discord.gg/iraq", icon: "fab fa-discord" },
    { name: "Spotify", url: "https://open.spotify.com/user/31phyicdz7ewiieb3qnpwons6cpa", icon: "fab fa-spotify" },
    { name: "Instagram", url: "https://www.instagram.com/o.ovco/", icon: "fab fa-instagram" },
    { name: "Instagram", url: "https://www.instagram.com/12.12.11.28/", icon: "fab fa-instagram" },
  ],
};
