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
    [gnosis.id]: http(),
    //[gnosis.id]: http("http://localhost:8545"),
  },
});
