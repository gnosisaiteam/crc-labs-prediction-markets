"use client"

import { useState, useEffect } from "react"
import { useReadContract } from 'wagmi'
import { getLogs } from 'viem/actions'
import { LoadingSpinner } from "@/components/loading-spinner"
import { ALLOWED_COLLATERAL, BET_CONTRACT_FACTORY_ABI, BET_CONTRACT_FACTORY_ADDRESS, ERC20_CRC_METRI_CORE_GROUP_ADDRESS, FPMM_ABI } from "@/lib/constants"
import { usePublicClient } from 'wagmi'
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { config } from "@/lib/wagmi/config"
import { QRCode } from "@/components/qr-code"
import { CopyButton } from "@/components/copy-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { parseAbiItem } from "viem"




interface LiquidityInfo {
  liquidityVaultToken: string
  liquidityAdder: string
  liquidityRemover: string
}

interface ProcessedMarket {
  fpmmAddress: string
  groupCRCToken: string
  liquidityInfo?: LiquidityInfo
}

export default function LiquidityPage() {
  const [markets, setMarkets] = useState<ProcessedMarket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liquidityLoading, setLiquidityLoading] = useState<Record<string, boolean>>({})

  const publicClient = usePublicClient({ config });

  // Fetch processed markets from the BetContractFactory
  const { data: marketAddresses, isError, isLoading: isReading } = useReadContract({
    abi: BET_CONTRACT_FACTORY_ABI,
    address: BET_CONTRACT_FACTORY_ADDRESS,
    functionName: 'getAllProcessedFPMMAddresses',
  });



  // Effect to fetch liquidity info for all markets when they change
  useEffect(() => {
    if (!markets.length) return;

    const fetchAllLiquidityInfo = async () => {
      const updatedMarkets = [...markets];
      let hasUpdates = false;

      for (let i = 0; i < updatedMarkets.length; i++) {
        const market = updatedMarkets[i];

        // Skip if we already have liquidity info for this market
        if (market.liquidityInfo) continue;

        try {

          console.log("fetching");
          const result = await publicClient.readContract({
            address: BET_CONTRACT_FACTORY_ADDRESS,
            abi: BET_CONTRACT_FACTORY_ABI,
            functionName: 'getLiquidityInfo',
            args: [market.fpmmAddress as `0x${string}`],
          });

          if (result) {
            updatedMarkets[i] = {
              ...market,
              liquidityInfo: result as unknown as LiquidityInfo
            };
            hasUpdates = true;
          }
        } catch (err) {
          console.error(`Error fetching liquidity info for ${market.fpmmAddress}`, err);
        }
      }

      if (hasUpdates) {
        setMarkets(updatedMarkets);
      }
    };

    fetchAllLiquidityInfo();
  }, [markets]);



  useEffect(() => {
    const fetchMarkets = async () => {
      if (isError) {
        console.error("Error reading contract:")
        setError("Failed to fetch processed markets from the contract")
        setIsLoading(false)
        return
      }

      if (!isReading && marketAddresses) {
        try {
          // Type assertion since we know the return type from the ABI
          const addresses = marketAddresses as string[]
          const filteredMarkets: ProcessedMarket[] = [];

          
          // Process each market to check collateral token
          for (const address of addresses) {
            try {
              // Check the collateral token for this market
              const marketCollateral = await publicClient.readContract({
                address: address as `0x${string}`,
                abi: FPMM_ABI,
                functionName: 'collateralToken',
                args: [],
              });


              // Only include markets with the correct collateral token
              if (marketCollateral === ALLOWED_COLLATERAL) {
                filteredMarkets.push({
                  fpmmAddress: address,
                  groupCRCToken: '' // This would need to be fetched separately if needed
                });
              }
            } catch (err) {
              console.error(`Error checking collateral for market ${address}:`, err);
              // Continue with other markets if one fails
            }
          }


          setMarkets(filteredMarkets);
        } catch (err) {
          console.error("Error processing markets:", err);
          setError("Failed to process market data");
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchMarkets()
  }, [marketAddresses, isError, isReading])

  return (
    <main className="container mx-auto py-6 px-4">
      <div className="max-w-3xl mx-auto">
      <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Instructions</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 bg-gray-100 p-2 rounded text-xs break-all font-mono">
                            <ul className="list-disc pl-4">
                              <li>Admin can add liquidity to markets to make trades between outcome tokens (YES/NO) possible</li>
                              <li>Liquidity providers earn fees from trades</li>
                              <li>Liquidity providers can remove their liquidity, but collateral will only be returned after market resolution</li>
                              <li>When removing liquidity, any CRC sent is burned, thus only send a tiny amount (0.1 CRC)</li>
                            </ul>
                            
                          </div>
                        </CardDescription>
                      </CardHeader>
                      
                    </Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Markets</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            {error}
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No processed markets found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">Market #{index + 1}</h3>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">FPMM Address:</p>
                      <div className="flex items-center gap-1 bg-gray-100 p-2 rounded text-xs break-all font-mono">
                        {market.fpmmAddress}
                        <CopyButton value={market.fpmmAddress} className="h-3.5 w-3.5 flex-shrink-0" />
                      </div>
                    </div>
                    {market.groupCRCToken && (
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">Group CRC Token:</p>
                        <div className="flex items-center gap-1 bg-gray-100 p-2 rounded text-xs break-all font-mono">
                          {market.groupCRCToken}
                          <CopyButton value={market.groupCRCToken} className="h-3.5 w-3.5 flex-shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {market.liquidityInfo ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Add Liquidity</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 bg-gray-100 p-2 rounded text-xs break-all font-mono">
                            {market.liquidityInfo.liquidityAdder}
                            <CopyButton value={market.liquidityInfo.liquidityAdder} className="h-3.5 w-3.5 flex-shrink-0" />
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col items-center justify-between p-4 pt-0 space-y-4">
                        <div className="w-full flex justify-center py-2">
                          <QRCode value={market.liquidityInfo.liquidityAdder} size={160} />
                        </div>
                        <a
                          href={`https://app.metri.xyz/transfer/${market.liquidityInfo.liquidityAdder}/crc`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Add liquidity via Metri
                        </a>
                      </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Remove Liquidity</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 bg-gray-100 p-2 rounded text-xs break-all font-mono">
                            {market.liquidityInfo.liquidityRemover}
                            <CopyButton value={market.liquidityInfo.liquidityRemover} className="h-3.5 w-3.5 flex-shrink-0" />
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col items-center justify-between p-4 pt-0 space-y-4">
                        <div className="w-full flex justify-center py-2">
                          <QRCode value={market.liquidityInfo.liquidityRemover} size={160} />
                        </div>
                        <a
                          href={`https://app.metri.xyz/transfer/${market.liquidityInfo.liquidityRemover}/crc`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md text-sm transition-colors"
                        >
                          Remove liquidity via Metri (send only 0.1 CRC)
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-4 text-sm text-gray-500">
                    Loading liquidity info...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
