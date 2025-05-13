export interface MarketInfo {
  fpmmAddress: string
  groupCRCToken: string
  outcomeIdxs: bigint[]
  betContracts: string[]
}

export interface Item {
  id: number
  name: string
  category: string
  rarity: string
  powerLevel: number
  created: string
  description: string
  properties: { [key: string]: string }
}
