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
    primary: "#EE428F",    // Rosa Vibrante (Logo e Destaques)
    secondary: "#FBC9C3",  // Rosa Suave (Apoio e Detalhes)
    dark: "#121212",       // Preto Carbono (Contraste e Dark Mode)
    light: "#FFFFFF",      // Branco (Fundo e Pureza)
    muted: "#94a3b8",      // Cinza para textos secundários
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
