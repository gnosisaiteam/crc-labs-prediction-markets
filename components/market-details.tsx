import type { MarketInfo } from "@/lib/types"
import { QRCode } from "@/components/qr-code"
import { useState, useEffect } from "react"
import { usePublicClient } from 'wagmi'
import { BET_CONTRACT_ABI } from "@/lib/constants"
import { config } from "@/lib/wagmi/config"

interface FetchedMarketData {
  id: string;
  outcomes: string[];
  title: string;
  outcomeTokenAmounts?: string[];
}

interface MarketDetailsProps {
  marketInfo: MarketInfo;
  marketData: FetchedMarketData | null;
}

export function MarketDetails({ marketInfo, marketData }: MarketDetailsProps) {


  interface ProfileData {
    name?: string;
    previewImageUrl?: string;
    address: string;
  }

  const [localMarketData, setLocalMarketData] = useState<FetchedMarketData | null>(marketData);
  const [bettorsByContract, setBettorsByContract] = useState<{[key: string]: string[]}>({});
  const [profiles, setProfiles] = useState<{[address: string]: ProfileData}>({});

  useEffect(() => {
    // Only fetch if marketData wasn't provided as a prop
    if (!marketData) {
      const fetchMarketData = async () => {
        console.log('market_info', marketInfo.fpmmAddress);
        const query = `
          {
            fixedProductMarketMaker(id: "${marketInfo.fpmmAddress.toLowerCase()}") {
              id
              outcomes
              title
              outcomeTokenAmounts
            }
          }
        `;
        
        const response = await fetch(`https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_GRAPH_API_KEY}/subgraphs/id/9fUVQpFwzpdWS9bq5WkAnmKbNNcoBwatMR4yZq81pbbz`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();
        
        setLocalMarketData(data.data.fixedProductMarketMaker);
      };

      fetchMarketData();
    }
  }, [marketData, marketInfo.fpmmAddress]);

  const publicClient = usePublicClient({config});

  const fetchProfile = async (address: string): Promise<ProfileData | null> => {
    try {
      // Check if we already have the profile
      if (profiles[address]) return profiles[address];
      
      // Fetch profile data
      const profileResponse = await fetch(`https://rpc.aboutcircles.com/profiles/search?address=${address}`);
      const profileData = await profileResponse.json();
      
      if (!profileData || profileData.length === 0) return null;
      
      const profile = profileData[0];
      if (!profile.CID) return null;
      
      // Fetch IPFS data
      const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${profile.CID}`);
      const ipfsData = await ipfsResponse.json();
      
      const profileInfo: ProfileData = {
        name: profile.name,
        previewImageUrl: ipfsData.previewImageUrl,
        address: address
      };
      
      // Update profiles state
      setProfiles(prev => ({
        ...prev,
        [address]: profileInfo
      }));
      
      return profileInfo;
    } catch (error) {
      console.error(`Error fetching profile for ${address}:`, error);
      return null;
    }
  };

  const fetchBettors = async (contractAddress: string) => {
    if (!publicClient) {
      console.error('Public client not available');
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: BET_CONTRACT_ABI,
        functionName: 'getAddressesWithBalanceGreaterThan0',
      }) as `0x${string}`[];
      
      if (data) {
        setBettorsByContract(prev => ({
          ...prev,
          [contractAddress]: data
        }));
        
        // Fetch profiles for all addresses
        await Promise.all(data.map(addr => fetchProfile(addr)));
      }
    } catch (error) {
      console.error(`Error fetching bettors for contract ${contractAddress}:`, error);
    }
  };

  useEffect(() => {
    // Fetch bettors for each contract when marketInfo changes
    marketInfo.betContracts.forEach(contract => {
      if (contract) {
        fetchBettors(contract);
      }
    });
  }, [marketInfo.betContracts]);

  const displayMarketData = marketData || localMarketData;

  if (!displayMarketData) {
    return <div>Loading market data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Market Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Market Title</h3>
          <div className="font-mono text-sm bg-slate-100 p-2 rounded mt-1 break-all">{displayMarketData.title}</div>
          <h3 className="text-sm font-medium text-gray-500 mt-4">Market address</h3>
          <div className="font-mono text-sm bg-slate-100 p-2 rounded mt-1 break-all">{marketInfo.fpmmAddress}</div>
          <div className="mt-4">
            <a
              href={`https://presagio.pages.dev/markets?id=${marketInfo.fpmmAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-md text-sm transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Presagio
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Outcomes</h3>
          <div className="space-y-2 mt-1">
            {displayMarketData.outcomes?.map((outcome: string, index: number) => {
              const totalTokens = displayMarketData.outcomeTokenAmounts?.reduce(
                (sum: number, amount: string) => sum + parseFloat(amount), 
                0
              ) || 0;
              const probability = displayMarketData.outcomeTokenAmounts && totalTokens > 0 
                ? (1 - (parseFloat(displayMarketData.outcomeTokenAmounts[index]) / totalTokens)).toFixed(4)
                : 'N/A';
                
              return (
                <div key={index} className="bg-slate-100 p-2 rounded">
                  <div className="font-mono text-sm">{index}: {outcome}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {displayMarketData.outcomeTokenAmounts?.[index] && (
                      <div>Tokens: {displayMarketData.outcomeTokenAmounts[index]}</div>
                    )}
                    Probability: {(parseFloat(probability) * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Group CRC Token</h3>
            <div className="font-mono text-sm bg-slate-100 p-2 rounded mt-1 break-all">{marketInfo.groupCRCToken}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {marketInfo.betContracts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {marketInfo.betContracts.map((contract, index) => (
              <div key={index} className="bg-slate-100 p-4 rounded flex flex-col items-center">
                <a
                  href={`https://app.metri.xyz/transfer/${contract}/crc`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-white hover:text-white bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-md text-sm transition-colors mb-2"
                >
                  Place bet on outcome {marketData?.outcomes[index]}
                </a>
                <QRCode value={contract} size={180} />
                <span className="font-mono text-xs mt-3 break-all text-center">{contract}</span>
                <div className="mt-2 w-full">
                  <h4 className="text-sm font-medium text-gray-600 mt-2">Bettors:</h4>
                  <div className="max-h-32 overflow-y-auto mt-1 bg-white p-2 rounded border border-gray-200">
                    {bettorsByContract[contract]?.length > 0 ? (
                      <ul className="space-y-1">
                        {bettorsByContract[contract].map((address, idx) => {
                          const profile = profiles[address];
                          return (
                            <li key={idx} className="flex items-center space-x-2 py-1">
                              {profile?.previewImageUrl ? (
                                <img 
                                  src={profile.previewImageUrl} 
                                  alt={profile.name || 'Profile'} 
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs">{address.slice(2, 4)}</span>
                                </div>
                              )}
                              <span className="font-mono text-xs break-all">
                                {profile?.name || address}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No bettors yet</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-gray-500">No bet contracts available</p>
        )}
      </div>
    </div>
  )
}
