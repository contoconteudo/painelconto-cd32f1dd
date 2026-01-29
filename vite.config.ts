import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  
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
