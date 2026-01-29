import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // BASE PATH - ajuste para seu domínio se estiver em subpasta
  // Exemplo: base: "/cms/" se acessado via seudominio.com/cms/
  base: "/",
  
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: {
        name: "Painel Conto",
        short_name: "Conto",
        description: "Sistema de gestão comercial, CRM e estratégia",
        start_url: "/",
        display: "standalone",
        background_color: "#141414",
        theme_color: "#c4378f",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["business", "productivity"]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hora
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevenir múltiplas instâncias de React
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  
  // Otimização de dependências
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
  
  // Configurações de build para produção
  build: {
    // Otimizações de produção
    minify: "terser",
    terserOptions: {
      compress: {
        // Remove console.logs em produção (exceto errors/warns)
        drop_console: mode === "production",
        drop_debugger: true,
      },
    },
    // Gerar source maps apenas em desenvolvimento
    sourcemap: mode === "development",
    // Otimizar chunks
    rollupOptions: {
      output: {
        // Separar vendors em chunk próprio para melhor cache
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover"],
        },
      },
    },
    // Limite de warning para chunks grandes
    chunkSizeWarningLimit: 1000,
  },
  
  // Definir variáveis de ambiente em produção
  define: {
    // Disponível via import.meta.env.MODE
    "import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
  },
}));
