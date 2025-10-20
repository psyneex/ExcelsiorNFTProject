import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        // RainbowKit references wagmi connector subpaths (e.g. 'wagmi/connectors/safe'),
        // but wagmi@2.18.1 doesn't expose them via its own export map. Alias the
        // namespace to the connectors package until dependencies are upgraded.
        find: 'wagmi/connectors',
        replacement: '@wagmi/connectors',
      },
      { find: 'wagmi/connectors/walletConnect', replacement: '/src/shims/wagmi-connectors/walletConnect.ts' },
      { find: 'wagmi/connectors/safe', replacement: '/src/shims/wagmi-connectors/safe.ts' },
      { find: 'wagmi/connectors/coinbaseWallet', replacement: '/src/shims/wagmi-connectors/coinbaseWallet.ts' },
      { find: 'wagmi/connectors/metaMask', replacement: '/src/shims/wagmi-connectors/metaMask.ts' },
      { find: 'wagmi/connectors/injected', replacement: '/src/shims/wagmi-connectors/injected.ts' },
      { find: 'wagmi/connectors/baseAccount', replacement: '/src/shims/wagmi-connectors/baseAccount.ts' },
      { find: 'wagmi/connectors/gemini', replacement: '/src/shims/wagmi-connectors/gemini.ts' },
      { find: 'wagmi/connectors/porto', replacement: '/src/shims/wagmi-connectors/porto.ts' },
      { find: 'wagmi/connectors/mock', replacement: '/src/shims/wagmi-connectors/mock.ts' },
    ],
  },
});
