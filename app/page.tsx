"use client"

import { useState, useEffect } from "react"
import { usePublicClient } from 'wagmi'
import { ItemList } from "@/components/item-list"
import { MarketDetails } from "@/components/market-details"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { MarketInfo } from "@/lib/types"
import { config } from "@/lib/wagmi/config"
import { ALLOWED_COLLATERAL, BET_CONTRACT_FACTORY_ABI, BET_CONTRACT_FACTORY_ADDRESS } from "@/lib/constants"




export default function Home() {
  const [marketAddresses, setMarketAddresses] = useState<string[]>([])
  const [selectedMarketAddress, setSelectedMarketAddress] = useState<string | null>(null)
  const [selectedMarketInfo, setSelectedMarketInfo] = useState<MarketInfo | null>(null)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [isLoadingMarketInfo, setIsLoadingMarketInfo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marketsData, setMarketsData] = useState<Record<string, { id: string; outcomes: string[]; title: string; outcomeTokenAmounts: string[] }>>({})

  const client = usePublicClient({ config });


  // Fetch the list of market addresses
  useEffect(() => {
    const fetchMarketAddresses = async () => {
      if (!client) {
        setError("Client not initialized. Please check your wallet connection.");
        setIsLoadingAddresses(false);
        return;
      }

      try {
        setIsLoadingAddresses(true)
        setError(null)

        const addresses = (await client.readContract({
          address: BET_CONTRACT_FACTORY_ADDRESS,
          abi: BET_CONTRACT_FACTORY_ABI,
          functionName: "getAllProcessedFPMMAddresses",
        })) as string[];

        // ToDo - read from subgraph

        console.log('market_info', addresses[0]);
        const query = `
            {
              fixedProductMarketMakers(where: {
              id_in: [${addresses.map(addr => `"${addr.toLowerCase()}"`).join(",")}],
              collateralToken: "${ALLOWED_COLLATERAL.toLowerCase()}"
              }) {
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
        console.log("data", data.data.fixedProductMarketMakers);

        // Create a map of market data by address
        const marketsDataMap = data.data.fixedProductMarketMakers
          .filter((market: any) => market.outcomes.length > 0)
          .reduce((acc: Record<string, any>, market: any) => {
            acc[market.id.toLowerCase()] = market;
            return acc;
          }, {});

          // filter addresses that are included in marketsDataMap
          const filteredAddresses = addresses.filter(addr => marketsDataMap[addr.toLowerCase()]);

        setMarketsData(marketsDataMap);
        setMarketAddresses(filteredAddresses);

        // Select the first market by default if available
        if (filteredAddresses.length > 0) {
          setSelectedMarketAddress(filteredAddresses[0]);
        }

        setIsLoadingAddresses(false);
      } catch (err) {
        console.error("Error fetching market addresses:", err)
        setError("Failed to fetch market addresses. Please check your connection.")
        setIsLoadingAddresses(false)
      }
    }

    fetchMarketAddresses()
  }, [client])

  // Fetch market info when a market is selected
  useEffect(() => {
    const fetchMarketInfo = async () => {
      if (!selectedMarketAddress || !client) return

      try {
        setIsLoadingMarketInfo(true)
        setError(null)

        const marketInfo = (await client.readContract({
          address: BET_CONTRACT_FACTORY_ADDRESS,
          abi: BET_CONTRACT_FACTORY_ABI,
          functionName: "getMarketInfo",
          args: [selectedMarketAddress],
        })) as MarketInfo

        setSelectedMarketInfo(marketInfo)
        setIsLoadingMarketInfo(false)
      } catch (err) {
        console.error("Error fetching market info:", err)
        setError("Failed to fetch market info. Please check your connection.")
        setIsLoadingMarketInfo(false)
      }
    }

    fetchMarketInfo()
  }, [selectedMarketAddress, client])

  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-slate-800 text-white p-4 shadow">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold">Prediction Markets with Circles</h1>
            <p>This application allows users to explore and create prediction markets using Circles tokens.</p>
          </div>

        </div>
        <p className="mt-4 text-sm">Explore the following steps:</p>
        <ul className="list-disc pl-6 mt-2 text-sm">
          <li>
            Pick a market from the list on the left.
          </li>
          <li>Open the Metri app, click on Wallet, then Send, then click on the QR code logo.</li>
          <li>Scan the QR code of the outcome you want to wager on.</li>
          <li>Send an amount of Circles you want to bet.</li>
        </ul>
      </header>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar with market addresses */}
        <aside className="w-full md:w-64 bg-slate-100 p-4 border-r">
          <h2 className="text-lg font-semibold mb-4">Markets</h2>

          {isLoadingAddresses ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-red-500 p-2 text-sm">{error}</div>
          ) : marketAddresses.length === 0 ? (
            <div className="text-gray-500 p-2">No markets found</div>
          ) : (
            <ItemList
              addresses={marketAddresses}
              selectedAddress={selectedMarketAddress}
              onSelectAddress={setSelectedMarketAddress}
            />
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mt-2">
            {isLoadingMarketInfo ? (
              <div className="bg-white p-6 rounded-lg shadow-md flex justify-center">
                <LoadingSpinner />
              </div>
            ) : error && !isLoadingAddresses ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-red-500">{error}</div>
              </div>
            ) : selectedMarketInfo ? (
              <MarketDetails 
              marketInfo={selectedMarketInfo!} 
              marketData={selectedMarketAddress ? marketsData[selectedMarketAddress.toLowerCase()] : null}
            />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500">Select a market to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
