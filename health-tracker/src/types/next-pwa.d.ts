declare module 'next-pwa' {
  import { NextConfig } from 'next'
  
  export interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    buildExcludes?: RegExp[]
    publicExcludes?: string[]
    cacheOnFrontendNav?: boolean
    reloadOnOnline?: boolean
    customWorkerDir?: string
  }
  
  export default function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
}