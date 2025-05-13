import type { MarketInfo } from "@/lib/types"
import { QRCode } from "@/components/qr-code"

interface MarketDetailsProps {
  marketInfo: MarketInfo
}

export function MarketDetails({ marketInfo }: MarketDetailsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Market Details</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">FPMM Address</h3>
          <div className="font-mono text-sm bg-slate-100 p-2 rounded mt-1 break-all">{marketInfo.fpmmAddress}</div>
          <div className="mt-2">
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
          <h3 className="text-sm font-medium text-gray-500">Group CRC Token</h3>
          <div className="font-mono text-sm bg-slate-100 p-2 rounded mt-1 break-all">{marketInfo.groupCRCToken}</div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Outcome Indexes</h3>
          {marketInfo.outcomeIdxs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {marketInfo.outcomeIdxs.map((idx, index) => (
                <div key={index} className="bg-slate-100 p-2 rounded">
                  <span className="text-xs text-gray-500 block">Index {index}</span>
                  <span className="font-medium">{idx.toString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-gray-500">No outcome indexes available</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Bet Contracts</h3>
          {marketInfo.betContracts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {marketInfo.betContracts.map((contract, index) => (
                  <div key={index} className="bg-slate-100 p-4 rounded flex flex-col items-center">
                    <span className="text-sm text-gray-500 mb-2">Contract {index + 1}</span>
                    <QRCode value={contract} size={180} />
                    <span className="font-mono text-xs mt-3 break-all text-center">{contract}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-gray-500">No bet contracts available</p>
          )}
        </div>
      </div>
    </div>
  )
}
