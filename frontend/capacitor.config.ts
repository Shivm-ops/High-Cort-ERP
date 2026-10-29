import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.highcourterp.app',
  appName: 'Fastcase',
  webDir: 'public',
  server: {
    url: 'https://fastcase.in',
    cleartext: true
  }

};

export default config;
