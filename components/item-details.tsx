import type { Item } from "@/lib/types"

interface ItemDetailsProps {
  item: Item
}

export function ItemDetails({ item }: ItemDetailsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{item.name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Category</h3>
          <p>{item.category}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Rarity</h3>
          <p className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getRarityColor(item.rarity)}`}></span>
            {item.rarity}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Power Level</h3>
          <p>{item.powerLevel}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Created</h3>
          <p>{item.created}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
        <p className="text-gray-700">{item.description}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Properties</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(item.properties).map(([key, value]) => (
            <div key={key} className="bg-slate-100 p-2 rounded">
              <span className="text-xs text-gray-500 block">{key}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case "common":
      return "bg-gray-400"
    case "uncommon":
      return "bg-green-500"
    case "rare":
      return "bg-blue-500"
    case "epic":
      return "bg-purple-500"
    case "legendary":
      return "bg-yellow-500"
    default:
      return "bg-gray-400"
  }
}
