"use client"

import { useState } from "react"
import Link from "next/link"
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useSimulateContract, useWatchContractEvent } from 'wagmi'
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { useAskQuestion } from "@/hooks/useRealitio"
import { CONDITIONAL_TOKENS_ABI, CONDITIONAL_TOKENS_ADDRESS } from "@/lib/contracts/conditionalTokens"
import { ERC20_ABI, CRC_TOKEN_ADDRESS } from "@/lib/contracts/erc20"

const FPMM_DETERMINISTIC_FACTORY_ADDRESS = '0x9083A2B699c0a4AD06F63580BDE2635d26a3eeF0' as `0x${string}`
const FPMM_DETERMINISTIC_FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "saltNonce", "type": "uint256" },
      { "internalType": "contract ConditionalTokens", "name": "conditionalTokens", "type": "address" },
      { "internalType": "contract IERC20", "name": "collateralToken", "type": "address" },
      { "internalType": "bytes32[]", "name": "conditionIds", "type": "bytes32[]" },
      { "internalType": "uint256", "name": "fee", "type": "uint256" },
      { "internalType": "uint256", "name": "initialFunds", "type": "uint256" },
      { "internalType": "uint256[]", "name": "distributionHint", "type": "uint256[]" }
    ],
    "name": "create2FixedProductMarketMaker",
    "outputs": [{ "internalType": "contract FixedProductMarketMaker", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "contract FixedProductMarketMaker", "name": "fixedProductMarketMaker", "type": "address" },
      { "indexed": false, "internalType": "contract ConditionalTokens", "name": "conditionalTokens", "type": "address" },
      { "indexed": false, "internalType": "contract IERC20", "name": "collateralToken", "type": "address" },
      { "indexed": false, "internalType": "bytes32[]", "name": "conditionIds", "type": "bytes32[]" },
      { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "name": "FixedProductMarketMakerCreation",
    "type": "event"
  }
] as const
import { parseEther } from 'viem'
import { gnosis } from 'viem/chains'
import { useRouter } from 'next/navigation'

interface CirclesGroup {
  address: string;
  name: string;
}

interface FormData {
  title: string;
  closingDate: string;
  outcomes: string[];
  initialFunds: string;
  feePercentage: string;
  circlesGroup: string;
}

export default function CreateMarket() {
  
  const circlesGroups: CirclesGroup[] = [
    { address: '0x86533d1ada8ffbe7b6f7244f9a1b707f7f3e239b', name: 'Metri Core Group' },
    // Add more groups here as needed
  ]

  const [formData, setFormData] = useState<FormData>({
    title: "",
    closingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    outcomes: ["Yes", "No"],
    initialFunds: "0",
    feePercentage: "2.0",
    circlesGroup: '0x86533d1ada8ffbe7b6f7244f9a1b707f7f3e239b' // Default to Metri Core Group
  })
  const [newOutcome, setNewOutcome] = useState("")

  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isSwitching, setIsSwitching] = useState(false)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [marketCreationResult, setMarketCreationResult] = useState<{
    creator: string
    fixedProductMarketMaker: string
    conditionalTokens: string
    collateralToken: string
    conditionIds: string[]
    fee: string
  } | null>(null)
  
  const { askQuestion, isLoading: isAskingQuestion } = useAskQuestion((id) => {
    setQuestionId(id);
    console.log('Question created with ID:', id);
    // Here you can add any additional logic you want to perform when a question is created
  })

  const { 
    writeContractAsync: prepareConditionWrite,
    isPending: isPreparingCondition,
    isError: isPrepareError,
    error: prepareError,
    data: prepareTxHash
  } = useWriteContract()

  const {
    writeContractAsync: writeContract,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError,
    data: approveTxHash
  } = useWriteContract()

  const publicClient = usePublicClient()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: (prepareTxHash || approveTxHash) as `0x${string}`
    })

  // We're now getting the market address directly from the transaction receipt
  // instead of using the event watcher
    
  // Get current allowance
  const { data: allowanceData, refetch: refetchAllowance } = useSimulateContract({
    address: CRC_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address || '0x0', CONDITIONAL_TOKENS_ADDRESS] as const,
    query: {
      enabled: !!address,
    },
  })

  const needsApproval = (amount: bigint) => {
    if (!allowanceData?.result) return true
    // Ensure the result is a bigint
    const result = allowanceData.result as unknown
    const currentAllowance = typeof result === 'bigint' ? result : BigInt(result as string | number)
    return currentAllowance < amount
  }

  const approveToken = async (amount: bigint) => {
    if (!address) {
      throw new Error('No connected wallet')
    }

    try {
      // Add a small buffer to the approval amount to account for any potential rounding issues
      const approvalAmount = (amount * 101n) / 100n // 1% more than needed
      
      const hash = await writeContract({
        address: CRC_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONDITIONAL_TOKENS_ADDRESS, approvalAmount],
      })
      
      console.log('Approval transaction hash:', hash)
      return hash
    } catch (err) {
      console.error('Error approving token:', err)
      throw err
    }
  }

  const getConditionId = async (questionId: string): Promise<`0x${string}`> => {
    if (!publicClient || !address) {
      throw new Error('No public client or connected wallet')
    }

    try {
      const conditionId = await publicClient.readContract({
        address: CONDITIONAL_TOKENS_ADDRESS,
        abi: CONDITIONAL_TOKENS_ABI,
        functionName: 'getConditionId',
        args: [
          address, // oracle
          questionId as `0x${string}`, // questionId
          BigInt(formData.outcomes.length) // outcomeSlotCount
        ]
      }) as `0x${string}`

      return conditionId
    } catch (err) {
      console.error('Error getting condition ID:', err)
      throw err
    }
  }

  const doesConditionExist = async (questionId: string): Promise<boolean> => {
    if (!address || !publicClient) return false
    
    try {
      const conditionId = await getConditionId(questionId)
      
      try {
        const outcomeSlotCount = await publicClient.readContract({
          address: CONDITIONAL_TOKENS_ADDRESS,
          abi: CONDITIONAL_TOKENS_ABI,
          functionName: 'getOutcomeSlotCount',
          args: [conditionId]
        }) as bigint
        
        return outcomeSlotCount > 0n
      } catch (err) {
        console.error('Error checking if condition exists:', err)
        return false
      }
    } catch (err) {
      console.error('Error getting condition ID:', err)
      return false
    }
  }

  const prepareCondition = async (questionId: string) => {
    if (!address) {
      throw new Error('No connected wallet')
    }

    try {
      // First check if condition already exists
      const conditionExists = await doesConditionExist(questionId)
      if (conditionExists) {
        console.log('Condition already exists, skipping creation')
        return null
      }
    } catch (err) {
      console.error('Error checking if condition exists:', err)
      throw err
    }

    const outcomeSlotCount = formData.outcomes.length
    
    console.log('Preparing condition with:', {
      oracle: address,
      questionId,
      outcomeSlotCount,
      contract: CONDITIONAL_TOKENS_ADDRESS
    })

    try {
      const hash = await prepareConditionWrite({
        address: CONDITIONAL_TOKENS_ADDRESS,
        abi: CONDITIONAL_TOKENS_ABI,
        functionName: 'prepareCondition',
        args: [
          address, // oracle
          questionId as `0x${string}`, // questionId
          BigInt(outcomeSlotCount) // outcomeSlotCount
        ]
      })
      
      console.log('Condition preparation transaction hash:', hash)
      return hash
    } catch (err) {
      console.error('Error preparing condition:', err)
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      setError("Please connect your wallet")
      return
    }
    
    // Check if we're on the correct network (Gnosis Chain)
    if (chainId !== gnosis.id) {
      try {
        setIsSwitching(true)
        await switchChain({ chainId: gnosis.id })
      } catch (err) {
        setError("Failed to switch to Gnosis Chain")
        return
      } finally {
        setIsSwitching(false)
      }
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Convert initial funds to wei
      const initialFundsWei = parseEther(formData.initialFunds)
      
      // Step 1: Check and approve CRC token allowance if needed
      const approvalNeeded = needsApproval(initialFundsWei)
      
      if (approvalNeeded) {
        console.log('Approving CRC tokens...')
        await approveToken(initialFundsWei)
        
        // Wait for the approval to be confirmed
        if (isApproving) {
          console.log('Waiting for approval to be confirmed...')
        }
        
        if (isApproveError) {
          throw approveError || new Error('Failed to approve tokens')
        }
        
        console.log('Tokens approved successfully')
        
        // Refetch allowance to ensure it's updated
        await refetchAllowance()
      } else {
        console.log('Sufficient allowance already exists')
      }
      
      // Step 2: Ask question on Realitio
      const templateId = BigInt(2)
      
      // Format question according to Realitio's expected format for template 2
      const question = [
        formData.title.replace(/"/g, '\\"'),  // Escape quotes
        formData.outcomes.map(o => `"${o}"`).join(','),  // Comma-separated quoted outcomes
        'prediction-market',
        'en'
      ].join('␟')  // Use the unicode unit separator
      
      // Use Kleros 31 jurors with appeal as arbitrator
      const arbitrator = '0x5562Ac605764DC4039fb6aB56a74f7321396Cdf2' as `0x${string}`
      // 7 days timeout in seconds
      const timeout = 7 * 24 * 60 * 60
      // Current timestamp + 1 hour
      const openingTs = Math.floor(Date.now() / 1000) + 3600
      // Nonce (using current timestamp)
      const nonce = BigInt(Math.floor(Date.now() / 1000))
      
      console.log('Asking question on Realitio...', {
        templateId,
        question,
        arbitrator,
        timeout,
        openingTs,
        nonce
      })
      console.log('before ask question');
      // askQuestion returns the questionId directly
      const questionId = await askQuestion(
        templateId,
        question,
        arbitrator,
        timeout,
        openingTs,
        nonce,
        parseEther('0.1') // Bond amount (0.1 xDai for now)
      );
      
      if (!questionId) {
        throw new Error('Failed to get question ID from transaction');
      }
      
      console.log('Question created with ID:', questionId);
      
      // Step 2: Prepare condition with ConditionalTokens contract if it doesn't exist
      console.log('Checking if condition already exists...')
      const prepareResult = await prepareCondition(questionId)
      
      if (prepareResult) {
        // Only wait for confirmation if we actually created a new condition
        console.log('New condition being prepared...')
        
        // Wait for the condition preparation to be confirmed
        if (isPreparingCondition) {
          console.log('Waiting for condition preparation to be confirmed...')
        }
        
        if (isPrepareError) {
          throw prepareError || new Error('Failed to prepare condition')
        }
        
        console.log('Condition prepared successfully')
      } else {
        console.log('Using existing condition')
      }
      
      // Step 3: Create the market using FPMMDeterministicFactory
      console.log('Creating market with FPMMDeterministicFactory...')
      
      // Generate a random salt nonce
      const saltNonce = BigInt(Math.floor(Math.random() * 1e18))
      
      // Convert fee percentage to basis points (e.g., 2.0% -> 200)
      const feeBasisPoints = Math.round(parseFloat(formData.feePercentage) * 100)
      
      // Calculate distribution hint (equal distribution for now)
      const distributionHint = Array(formData.outcomes.length).fill(
        (BigInt(1e18) * BigInt(100)) / BigInt(formData.outcomes.length)
      )
      
      // Get the condition ID first
      const conditionId = await getConditionId(questionId!)
      
      // Call create2FixedProductMarketMaker
      const createMarketHash = await writeContract({
        address: FPMM_DETERMINISTIC_FACTORY_ADDRESS,
        abi: FPMM_DETERMINISTIC_FACTORY_ABI,
        functionName: 'create2FixedProductMarketMaker',
        args: [
          saltNonce,
          CONDITIONAL_TOKENS_ADDRESS,
          CRC_TOKEN_ADDRESS,
          [conditionId],
          BigInt(feeBasisPoints),
          parseEther(formData.initialFunds),
          distributionHint
        ]
      })
      
      console.log('Market creation transaction hash:', createMarketHash)
      
      // Wait for the market creation transaction to be confirmed
      if (!publicClient) {
        throw new Error('Public client not available')
      }
      
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: createMarketHash
      })
      
      console.log('Market created successfully:', receipt)
      
      // Get the return value from the transaction receipt
      const returnData = receipt.logs?.[0]?.data || ''
      // The return value is the last 32 bytes of the data
      const marketAddress = '0x' + returnData.slice(-40)
      
      // Set the market creation result with the address from the return value
      setMarketCreationResult({
        creator: address || '',
        fixedProductMarketMaker: marketAddress,
        conditionalTokens: CONDITIONAL_TOKENS_ADDRESS,
        collateralToken: CRC_TOKEN_ADDRESS,
        conditionIds: [conditionId],
        fee: feeBasisPoints.toString()
      })
      
      // Redirect to the market page with the questionId
      //router.push(`/market/${questionId}`)
      
      
    } catch (err) {
      console.error('Error creating market:', err)
      setError(err instanceof Error ? err.message : 'Failed to create market')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOutcome = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedOutcome = newOutcome.trim()
    if (trimmedOutcome && !formData.outcomes.includes(trimmedOutcome)) {
      setFormData(prev => ({
        ...prev,
        outcomes: [...prev.outcomes, trimmedOutcome]
      }))
      setNewOutcome("")
    }
  }

  const removeOutcome = (outcomeToRemove: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (formData.outcomes.length <= 2) return // Prevent removing if only two outcomes left
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter(outcome => outcome !== outcomeToRemove)
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // For initialFunds, only allow positive integers
    if (name === 'initialFunds') {
      // Only update if it's a valid positive integer or empty string
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Market</h1>
        <WalletConnectButton />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Market Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                name="title"
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Will the event happen?"
                required
              />
            </div>

            <div>
              <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 mb-1">
                Closing Date
              </label>
              <input
                type="datetime-local"
                id="closingDate"
                value={formData.closingDate}
                name="closingDate"
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcomes
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <span className="mr-1">{outcome}</span>
                    {formData.outcomes.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => removeOutcome(outcome, e)}
                        className="text-gray-500 hover:text-red-500"
                        title="Remove outcome"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOutcome(e)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add new outcome"
                />
                <button
                  type="button"
                  onClick={addOutcome}
                  disabled={!newOutcome.trim()}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">At least 2 outcomes required</p>
            </div>

            <div>
              <label htmlFor="circlesGroup" className="block text-sm font-medium text-gray-700 mb-1">
                Circles Group
              </label>
              <select
                id="circlesGroup"
                name="circlesGroup"
                value={formData.circlesGroup}
                onChange={handleInputChange}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {circlesGroups.map((group) => (
                  <option key={group.address} value={group.address}>
                    {group.name} ({group.address.slice(0, 6)}...{group.address.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="initialFunds" className="block text-sm font-medium text-gray-700 mb-1">
                Amount of CRC Tokens
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="initialFunds"
                  min="0"
                  step="1"
                  value={formData.initialFunds}
                  name="initialFunds"
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="feePercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Fee Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="feePercentage"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.feePercentage}
                  name="feePercentage"
                  onChange={handleInputChange}
                  className="w-full pr-10 py-2 pl-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formData.outcomes.length < 2 || isSubmitting || isAskingQuestion || isSwitching}
              className={`px-6 py-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${formData.outcomes.length < 2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
            >
              {isSwitching ? 'Switching Network...' : isSubmitting || isAskingQuestion ? 'Creating Market...' : 'Create Market'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {marketCreationResult && (
          <div className="mt-6 p-6 bg-green-50 border-l-4 border-green-400 rounded-lg">
            <h3 className="text-lg font-bold text-green-800 mb-4">🎉 Market Created Successfully!</h3>
            
            {/* Market ID Section */}
            <div className="mb-4 p-3 bg-white rounded-md border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Market ID</p>
                  <p className="font-mono text-sm break-all">{marketCreationResult.fixedProductMarketMaker}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(marketCreationResult.fixedProductMarketMaker);
                    // You might want to add a toast notification here
                  }}
                  className="ml-2 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Other Market Details */}
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex justify-between">
                <span className="font-medium">Condition ID:</span>
                <span className="font-mono text-xs">{marketCreationResult.conditionIds[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Trading Fee:</span>
                <span>{(parseInt(marketCreationResult.fee) / 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Collateral Token:</span>
                <span className="font-mono text-xs">{marketCreationResult.collateralToken}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-100">
              <a
                href={`/market/${marketCreationResult.fixedProductMarketMaker}`}
                className="inline-block mr-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Market
              </a>
              <a
                href={`https://gnosisscan.io/address/${marketCreationResult.fixedProductMarketMaker}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-600"
              >
                View on block explorer
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
