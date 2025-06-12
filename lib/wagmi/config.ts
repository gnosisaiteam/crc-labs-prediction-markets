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
    //[gnosis.id]: http('https://virtual.gnosis.rpc.tenderly.co/4478dbfb-2795-46b9-841e-667309f0d474'),
    [gnosis.id]: http(),
  },
});
