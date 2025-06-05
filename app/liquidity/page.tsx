"use client"

import { useState, useEffect } from "react"
import { ItemList } from "@/components/item-list"
import { MarketDetails } from "@/components/market-details"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { MarketInfo } from "@/lib/types"

// GraphQL endpoint for fetching markets
const GRAPHQL_ENDPOINT = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_GRAPH_API_KEY}/subgraphs/id/9fUVQpFwzpdWS9bq5WkAnmKbNNcoBwatMR4yZq81pbbz`;

// Type for the market data from the GraphQL API
interface GraphQLMarket {
  id: string
  title: string
  collateralToken: string
  outcomeTokenAmounts: string[]
  outcomes: string[]
  answerFinalizedTimestamp: string | null
  resolutionTimestamp: string | null
}

export default function LiquidityPage() {
  const [markets, setMarkets] = useState<GraphQLMarket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch markets from the GraphQL endpoint
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `{
              fixedProductMarketMakers(
                where: { collateralToken: "0x7147a7405fcfe5cfa30c6d5363f9f357a317d082" }
              ) {
                id
                title
                collateralToken
                outcomeTokenAmounts
                outcomes
                answerFinalizedTimestamp
                resolutionTimestamp
              }
            }`
          })
        })


        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const { data } = await response.json()
        setMarkets(data.fixedProductMarketMakers || [])


      } catch (err) {
        console.error("Error fetching markets:", err)
        setError("Failed to fetch markets. Please check your connection.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  return (
    <main className="container mx-auto py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Markets</h1>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => (
              <div
                key={market.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
              >
                <h3 className="font-medium text-lg">{market.title}</h3>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>ID: {market.id.slice(0, 6)}...{market.id.slice(-4)}</span>
                  <span className="font-medium">
                    {market.outcomes.join(' / ')}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    {market.answerFinalizedTimestamp && market.resolutionTimestamp ? 'Resolved' : 'Active'}
                  </span>
                  <button
                    onClick={() => console.log('Add liquidity to', market.id)}
                    disabled={!!(market.answerFinalizedTimestamp && market.resolutionTimestamp)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      market.answerFinalizedTimestamp && market.resolutionTimestamp
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Add Liquidity
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
