"use client"

import { shortenAddress } from "@/lib/utils"

interface ItemListProps {
  addresses: string[]
  selectedAddress: string | null
  onSelectAddress: (address: string) => void
}

export function ItemList({ addresses, selectedAddress, onSelectAddress }: ItemListProps) {
  return (
    <div className="space-y-2">
      <ul className="space-y-1 max-h-[calc(100vh-150px)] overflow-y-auto">
        {addresses.map((address, index) => (
          <li key={address}>
            <button
              onClick={() => onSelectAddress(address)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selectedAddress === address ? "bg-slate-700 text-white" : "hover:bg-slate-200"
              }`}
            >
              <span className="font-medium">Market {index + 1}</span>
              <span className="block text-xs font-mono mt-1">{shortenAddress(address)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
