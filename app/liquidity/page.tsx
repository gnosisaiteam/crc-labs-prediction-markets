"use client"

import { useState, useEffect } from "react"
import { useReadContract } from 'wagmi'
import { LoadingSpinner } from "@/components/loading-spinner"
import { BET_CONTRACT_FACTORY_ABI, BET_CONTRACT_FACTORY_ADDRESS } from "@/lib/constants"
import { usePublicClient } from 'wagmi'
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { config } from "@/lib/wagmi/config"
import { QRCode } from "@/components/qr-code"
import { CopyButton } from "@/components/copy-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"




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
      console.log("upded markets", updatedMarkets);
      let hasUpdates = false;

      for (let i = 0; i < updatedMarkets.length; i++) {
        const market = updatedMarkets[i];
        console.log("market", market.fpmmAddress as `0x${string}`);
        
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
        // Type assertion since we know the return type from the ABI
        const addresses = marketAddresses as string[]

        // Convert the addresses to the expected format
        const processedMarkets = addresses.map((address) => {
          //let liq = await fetchLiquidityInfo(address);
          //console.log('liquidityInfo', liq);
          return {
            fpmmAddress: address,
            groupCRCToken: '' // This would need to be fetched separately if needed
          }
        });

        setMarkets(processedMarkets)
        setIsLoading(false)


      }
    }

    fetchMarkets()
  }, [marketAddresses, isError, isReading])

  return (
    <main className="container mx-auto py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Processed Markets</h1>
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
                    <p className="text-sm text-gray-500 mt-1 break-all">FPMM Address: {market.fpmmAddress}</p>
                    {market.groupCRCToken && (
                      <p className="text-sm text-gray-500 mt-1 break-all">Group CRC Token: {market.groupCRCToken}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      Processed
                    </span>
                  </div>
                </div>
                {market.liquidityInfo ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Add Liquidity</CardTitle>
                        <CardDescription className="text-xs">
                          <div className="flex items-center gap-1 truncate">
                            {market.liquidityInfo.liquidityAdder}
                            <CopyButton value={market.liquidityInfo.liquidityAdder} className="h-4 w-4" />
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <QRCode value={market.liquidityInfo.liquidityAdder} size={160} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Remove Liquidity</CardTitle>
                        <CardDescription className="text-xs">
                          <div className="flex items-center gap-1 truncate">
                            {market.liquidityInfo.liquidityRemover}
                            <CopyButton value={market.liquidityInfo.liquidityRemover} className="h-4 w-4" />
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center">
                        <QRCode value={market.liquidityInfo.liquidityRemover} size={160} />
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
