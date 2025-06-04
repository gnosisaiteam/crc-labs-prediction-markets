import { http, createConfig } from 'wagmi';
import { gnosis } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [gnosis],
  connectors: [
    injected(),
  ],
  ssr: true,
  transports: {
    [gnosis.id]: http('https://virtual.gnosis.rpc.tenderly.co/fc5a1921-bd87-49f7-8910-60a5dcd8bb18'),
  },
});
