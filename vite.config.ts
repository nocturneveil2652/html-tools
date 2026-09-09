import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function multipageRoutingPlugin(): Plugin {
  return {
    name: 'vite-plugin-multipage-routing',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const [pathname, search = ''] = req.url.split('?');
        const query = search ? `?${search}` : '';

        // 旧URL /counter-chinchiro へのアクセスを /beer-counter/ へリダイレクト
        if (pathname === '/counter-chinchiro' || pathname === '/counter-chinchiro/' || pathname.startsWith('/counter-chinchiro/')) {
          const suffix = pathname.replace(/^\/counter-chinchiro\/?/, '');
          const dest = suffix ? `/beer-counter/${suffix}${query}` : `/beer-counter/${query}`;
          res.writeHead(302, { Location: dest });
          res.end();
          return;
        }

        // 末尾スラッシュなしの /beer-counter を /beer-counter/ へ補正
        if (pathname === '/beer-counter') {
          res.writeHead(302, { Location: `/beer-counter/${query}` });
          res.end();
          return;
        }

        // 末尾スラッシュなしの /station-timer を /station-timer/ へ補正
        if (pathname === '/station-timer') {
          res.writeHead(302, { Location: `/station-timer/${query}` });
          res.end();
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), multipageRoutingPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          beerCounter: path.resolve(__dirname, 'beer-counter/index.html'),
          counterChinchiro: path.resolve(__dirname, 'counter-chinchiro/index.html'),
          stationTimer: path.resolve(__dirname, 'station-timer/index.html'),
        },
      },
    },
  };
});
