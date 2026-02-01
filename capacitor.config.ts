import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maskerati.teatrodelleombre',
  appName: 'Il Teatro delle Ombre',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
