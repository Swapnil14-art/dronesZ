import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetPort = env.SERVER_PORT || '8070';
  const targetUrl = env.VITE_API_BASE_URL || `http://localhost:${targetPort}`;

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '3001'),
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
