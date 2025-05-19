"use client"

import { useState, useEffect } from "react"
import { createPublicClient, http } from "viem"
import { gnosis } from "viem/chains"
import { ItemList } from "@/components/item-list"
import { MarketDetails } from "@/components/market-details"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { MarketInfo } from "@/lib/types"

// Contract address
const CONTRACT_ADDRESS = "0x62a3Cf54A77189A6680Ec0368432f72D73a87440"

// ABI for the contract functions we need
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "getAllProcessedFPMMAddresses",
    outputs: [{ type: "address[]", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "address", name: "fpmmAddress" }],
    name: "getMarketInfo",
    outputs: [
      {
        components: [
          { type: "address", name: "fpmmAddress" },
          { type: "address", name: "groupCRCToken" },
          { type: "uint256[]", name: "outcomeIdxs" },
          { type: "address[]", name: "betContracts" },
        ],
        type: "tuple",
        name: "marketInfo",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export default function Home() {
  const [marketAddresses, setMarketAddresses] = useState<string[]>([])
  const [selectedMarketAddress, setSelectedMarketAddress] = useState<string | null>(null)
  const [selectedMarketInfo, setSelectedMarketInfo] = useState<MarketInfo | null>(null)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [isLoadingMarketInfo, setIsLoadingMarketInfo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create a public client for Gnosis chain
  const client = createPublicClient({
    chain: gnosis,
    transport: http("http://localhost:8545"),
  })

  // Fetch the list of market addresses
  useEffect(() => {
    const fetchMarketAddresses = async () => {
      try {
        setIsLoadingAddresses(true)
        setError(null)

        const addresses = (await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getAllProcessedFPMMAddresses",
        })) as string[]

        setMarketAddresses(addresses)

        // Select the first market by default if available
        if (addresses.length > 0) {
          setSelectedMarketAddress(addresses[0])
        }

        setIsLoadingAddresses(false)
      } catch (err) {
        console.error("Error fetching market addresses:", err)
        setError("Failed to fetch market addresses. Please check your connection.")
        setIsLoadingAddresses(false)
      }
    }

    fetchMarketAddresses()
  }, [])

  // Fetch market info when a market is selected
  useEffect(() => {
    const fetchMarketInfo = async () => {
      if (!selectedMarketAddress) return

      try {
        setIsLoadingMarketInfo(true)
        setError(null)

        const marketInfo = (await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
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
  }, [selectedMarketAddress])

  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-slate-800 text-white p-2 shadow">
        <h1 className="text-xl font-semibold">Prediction Markets with Circles</h1>
        This application allows users to explore prediction markets using Circles tokens.
        <p className="mt-2 text-sm">Explore the following steps:</p>
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
              <MarketDetails marketInfo={selectedMarketInfo} />
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
