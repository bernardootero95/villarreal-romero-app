import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Elevamos sutilmente el límite si es necesario, pero optimizando los bloques
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Separación SOLID de librerías core pesadas en archivos independientes distribuidos en red
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-excel'; // SheetJS se descarga de forma aislada
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'; // Los iconos se descargan por separado
            }
            return 'vendor-core'; // React, React Router, etc.
          }
        }
      }
    }
  }
});