/**
 * Tessy Nails - Identidade Visual Oficial
 * Centraliza as cores e caminhos de assets da marca.
 */

export const BRAND = {
  name: "Tessy Nails",
  shortName: "Tessy",
  slogan: "Manicure & Pedicure",
  
  // Paleta de Cores extraída da marca aprovada
  colors: {
    primary: "#4B2E2B",    // Marrom Café (Logo e Destaques)
    secondary: "#6D4C41",  // Marrom Chocolate (Apoio e Detalhes)
    dark: "#2D1F1B",       // Marrom Escuro (Contraste e Dark Mode)
    light: "#FFFFFF",      // Branco (Fundo e Pureza)
    muted: "#7B6F6A",      // Cinza acastanhado para textos secundários
  },
  
  // Caminhos dos Assets
  assets: {
    logo: {
      principal: "/brand/logo/principal.png",
      horizontal: "/brand/logo/horizontal.png",
    },
    icons: {
      app: "/brand/icons/icon-app.png",
      appDark: "/brand/icons/icon-app-dark.png",
      favicon: "/brand/icons/favicon-32.png",
      pwa192: "/brand/icons/icon-192.png",
      pwa512: "/brand/icons/icon-512.png",
    }
  }
};
