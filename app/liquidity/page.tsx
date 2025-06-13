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
import { formatEther, parseAbiItem } from "viem"




interface LiquidityInfo {
  liquidityVaultToken: string
  liquidityAdder: string
  liquidityRemover: string
}

interface FPMMGraphData {
  id: string;
  collateralToken: string;
  outcomes: string[];
  title: string;
  liquidityMeasure: string;
  currentAnswer: string;
  answerFinalizedTimestamp: string;
  resolutionTimestamp: string;
}

interface ProcessedMarket {
  id: string
  title: string
  outcomes: string[]
  liquidityMeasure: string
  currentAnswer: string
  answerFinalizedTimestamp: string
  resolutionTimestamp: string
  collateralToken: string
  liquidityInfo?: LiquidityInfo
}

export default function LiquidityPage() {
  const [markets, setMarkets] = useState<ProcessedMarket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        if (market.liquidityInfo) {
          console.log("no liq info");
          continue;
        }

        try {

          console.log("fetching");
          const result = await publicClient.readContract({
            address: BET_CONTRACT_FACTORY_ADDRESS,
            abi: BET_CONTRACT_FACTORY_ABI,
            functionName: 'getLiquidityInfo',
            args: [market.id as `0x${string}`],
          });

          if (result) {
            updatedMarkets[i] = {
              ...market,
              liquidityInfo: result as unknown as LiquidityInfo
            };
            hasUpdates = true;
          }
        } catch (err) {
          console.error(`Error fetching liquidity info for ${market.id}`, err);
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
          if (!Array.isArray(marketAddresses)) {
            throw new Error('marketAddresses is not an array');
          }
          console.log("addresses", marketAddresses);
          const query = `
              {
                fixedProductMarketMakers(where: {
                  id_in: [${marketAddresses.map((address: string) => `"${address.toLowerCase()}"`).join(",")}]
                }) {
                  id
                  collateralToken
                  openingTimestamp
                  liquidityMeasure
                  currentAnswer
                  answerFinalizedTimestamp
                  resolutionTimestamp
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
          console.log("markets", data);



          const filteredMarkets: ProcessedMarket[] = [];

          // Process each market to check collateral token
          for (const market of data.data.fixedProductMarketMakers) {

            const result = await publicClient.readContract({
              address: BET_CONTRACT_FACTORY_ADDRESS,
              abi: BET_CONTRACT_FACTORY_ABI,
              functionName: 'getLiquidityInfo',
              args: [market.id as `0x${string}`],
            }) as LiquidityInfo;
            console.log("result", result);

            // Only include markets with the correct collateral token

            if (market.collateralToken.toLowerCase() === ALLOWED_COLLATERAL.toLowerCase()) {
              console.log("here");

              filteredMarkets.push({
                ...market,
                liquidityInfo: result,
              });
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
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Liquidity Management</CardTitle>
            <CardDescription className="text-gray-600">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">Overview</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Admins can add liquidity to markets to facilitate trading between outcome tokens (YES/NO)</li>
                    <li>Liquidity providers earn fees from trades</li>
                    <li>Liquidity providers can remove their liquidity after market resolution</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">Important Notes</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>When removing liquidity, the CRC sent is burned</li>
                    <li>Send exactly 1 CRC when removing liquidity</li>
                  </ul>
                </div>
              </div>
            </CardDescription>
          </CardHeader>

        </Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mt-6">Markets</h1>
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">{market.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Liquidity</p>
                        <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg text-sm font-mono">
                          {parseFloat(formatEther(BigInt(market.liquidityMeasure))).toFixed(2)}

                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">Status</p>
                        {(() => {
                          const now = Math.floor(Date.now() / 1000);
                          const answerFinalized = market.answerFinalizedTimestamp ? Number(market.answerFinalizedTimestamp) : null;
                          const resolution = market.resolutionTimestamp ? Number(market.resolutionTimestamp) : null;

                          if (!market.resolutionTimestamp && !market.answerFinalizedTimestamp) {
                            return (
                              <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-yellow-50 text-yellow-800 text-sm font-medium">
                                <span>Open</span>
                              </div>
                            )
                          }
                          else if (!!market.resolutionTimestamp && !!market.answerFinalizedTimestamp) {
                            return (
                              <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-800 text-sm font-medium">
                                <span>Resolved</span>
                              </div>
                            )
                          }
                          else {
                            return (
                              <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-800 text-sm font-medium">
                                <span>Reports open</span>
                              </div>
                            )
                          }
                        })()}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <p className="text-sm font-medium text-gray-600">FPMM Address</p>
                        <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg text-sm font-mono">
                          <span className="break-all">{market.id}</span>
                          <CopyButton value={market.id} className="h-4 w-4 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
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
                          Remove liquidity via Metri (send 1 CRC)
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
