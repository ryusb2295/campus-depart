import {transitHandler} from './transit-server.mjs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
const base = process.env.BASE_PATH || '/';
export default defineConfig({base,plugins:[{name:'transit-api',configureServer(server){server.middlewares.use(transitHandler)},configurePreviewServer(server){server.middlewares.use(transitHandler)}},react(),VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg','icon-192.png','icon-512.png'],manifest:{name:'나갈시간 — 대학생 통학 플래너',short_name:'나갈시간',lang:'ko',id:base,scope:base,start_url:base,display:'standalone',background_color:'#ffffff',theme_color:'#347cf5',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,png,woff2,json}']}})]});
