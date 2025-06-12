"use client"

import { useState } from "react"
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useSimulateContract } from 'wagmi'
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { useAskQuestion } from "@/hooks/useRealitio"
import { CONDITIONAL_TOKENS_ABI, CONDITIONAL_TOKENS_ADDRESS } from "@/lib/contracts/conditionalTokens"
import { ERC20_ABI } from "@/lib/contracts/erc20"


import { parseEther, getAddress, decodeEventLog } from 'viem'
import { gnosis } from 'viem/chains'
import { BET_CONTRACT_FACTORY_ABI, BET_CONTRACT_FACTORY_ADDRESS, FPMM_DETERMINISTIC_FACTORY_ABI, FPMM_DETERMINISTIC_FACTORY_ADDRESS } from "@/lib/constants"
import { config } from "@/lib/wagmi/config"


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

const CRC_GROUP_ADDRESS = "0x44057a3af7f746bd4f957fe0b22b1f82423c2b4a";
const ERC20_CRC_GROUP_ADDRESS = "0xB783d9cB66404D1061C2998596a0174990986866";
const ORACLE_ADDRESS = "0xAB16D643bA051C11962DA645f74632d3130c81E2";

export default function CreateMarket() {

  const circlesGroups: CirclesGroup[] = [
    { address: CRC_GROUP_ADDRESS, name: 'Dappcon25' },
    { address: '0x86533d1ada8ffbe7b6f7244f9a1b707f7f3e239b', name: 'Metri Core Group' },
    // Add more groups here as needed
  ]

  const [formData, setFormData] = useState<FormData>({
    title: "",
    closingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    outcomes: ["Yes", "No"],
    initialFunds: "0",
    feePercentage: "2.0",
    circlesGroup: CRC_GROUP_ADDRESS // defaults to Dappcon25
  })
  const [newOutcome, setNewOutcome] = useState("")

  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const [marketCreationResult, setMarketCreationResult] = useState<{
    creator: string
    fixedProductMarketMaker: string
    conditionalTokens: string
    collateralToken: string
    conditionIds: string[]
    fee: string
    betContractAddresses?: string[]
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

  const publicClient = usePublicClient({ config });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: (prepareTxHash || approveTxHash) as `0x${string}`
    })



  // Get current allowance
  const { data: allowanceData, refetch: refetchAllowance } = useSimulateContract({
    address: ERC20_CRC_GROUP_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONDITIONAL_TOKENS_ADDRESS, 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
    query: {
      enabled: !!address,
    },
  })

  // Get current allowance - using the existing refetchAllowance from above
  const needsApproval = async (amount: bigint) => {
    if (!address) {
      throw new Error('No connected wallet')
    }
    console.log("Checking if approval is needed for amount:", amount.toString());

    try {
      console.log('Fetching allowance for:', {
        token: ERC20_CRC_GROUP_ADDRESS,
        owner: address,
        spender: CONDITIONAL_TOKENS_ADDRESS
      });

      const allowance = await publicClient.readContract({
        address: ERC20_CRC_GROUP_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address!, CONDITIONAL_TOKENS_ADDRESS]  // owner, spender
      });

      console.log('Current allowance:', allowance);

      // Convert to BigInt for comparison
      const allowanceBigInt = BigInt(allowance.toString());
      const needsMoreApproval = allowanceBigInt < amount;
      console.log("needsMoreApproval", needsMoreApproval);
      console.log("allowance big int", allowanceBigInt);
      console.log("amount", amount);

      console.log('Needs more approval?', needsMoreApproval);
      return needsMoreApproval;

    } catch (err) {
      console.error('Error checking allowance:', err);
      throw new Error('Failed to check token allowance');
    }

  }

  const approveToken = async () => {
    if (!address) {
      throw new Error('No connected wallet')
    }

    // Use maximum uint256 value for unlimited approval
    const maxUint256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n

    try {
      // Use the maximum uint256 value for approval
      const hash = await writeContract({
        address: ERC20_CRC_GROUP_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONDITIONAL_TOKENS_ADDRESS, maxUint256],
      })

      console.log('Approval transaction hash:', hash)
      return hash
    } catch (err) {
      console.error('Error approving token:', err)
      throw err
    }
  }

  const getConditionId = async (questionId: string): Promise<`0x${string}`> => {
    if (!address) {
      throw new Error('No connected wallet')
    }
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    try {
      const result = await publicClient.readContract({
        address: CONDITIONAL_TOKENS_ADDRESS,
        abi: CONDITIONAL_TOKENS_ABI,
        functionName: 'getConditionId',
        args: [
          ORACLE_ADDRESS, // oracle
          questionId as `0x${string}`, // questionId
          BigInt(formData.outcomes.length) // outcomeSlotCount
        ]
      }) as `0x${string}`

      if (!result) {
        throw new Error('Failed to get condition ID')
      }

      return result
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
    console.log("entered prepareCondition");
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

    const outcomeSlotCount = formData.outcomes.length;
    console.log("after 1st try-catch", outcomeSlotCount);

    console.log('Preparing condition with:', {
      oracle: ORACLE_ADDRESS,
      questionId,
      outcomeSlotCount,
      contract: CONDITIONAL_TOKENS_ADDRESS
    });

    // Convert questionId to bytes32 format if it's not already
    let questionIdBytes32: `0x${string}`
    if (questionId.startsWith('0x') && questionId.length === 66) {
      questionIdBytes32 = questionId as `0x${string}`
    } else {
      // If it's not in the correct format, hash it
      questionIdBytes32 = `0x${questionId.replace('0x', '').padStart(64, '0')}` as `0x${string}`
    }

    try {
      const hash = await prepareConditionWrite({
        address: CONDITIONAL_TOKENS_ADDRESS,
        abi: CONDITIONAL_TOKENS_ABI,
        functionName: 'prepareCondition',
        args: [
          ORACLE_ADDRESS, // oracle
          questionIdBytes32, // questionId
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

  const prepareBetContractIdentifier = (outcomeIndex: number) => {
    const outcome = formData.outcomes[outcomeIndex];
    const separator = " - ";
    const titlePrefix = formData.title.slice(0, 32 - outcome.length - separator.length);
    const betContractIdentifier = `${titlePrefix}${separator}${outcome}`;
    console.log("length contract identifier", betContractIdentifier, betContractIdentifier.length)
    return betContractIdentifier;
  };

  const prepareLiquidityContractIdentifiers = () => {
    const suffix1 = "add";
    const suffix2 = "sub";
    const separator = " - ";
    const results = [];
    for (let i of [suffix1, suffix2]){
      const titlePrefix = formData.title.slice(0, 32 - i.length - separator.length);
      const liquidityContractIdentifier = `${titlePrefix}${separator}${i}`;
      console.log("length contract identifier", liquidityContractIdentifier, liquidityContractIdentifier.length)
      results.push(liquidityContractIdentifier);
    }
    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handle submit");

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
      console.log("initialFundsWei", initialFundsWei);
      const approvalNeeded = await needsApproval(initialFundsWei)

      if (approvalNeeded) {
        console.log('Approving CRC tokens...')
        await approveToken()

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
      const timeout = 7 * 24 * 60 * 60;
            
      
      const closingTimestamp = Math.floor(new Date(formData.closingDate).getTime() / 1000);
      console.log("closingTimestamp", closingTimestamp);
      // Nonce (using current timestamp)
      //const nonce = BigInt(Math.floor(Date.now() / 1000))
      const nonce = 0;

      console.log('Asking question on Realitio...', {
        templateId,
        question,
        arbitrator,
        timeout,
        closingTimestamp,
        nonce
      })
      console.log('before ask question');
      // askQuestion returns the questionId directly
      const questionId = await askQuestion(
        templateId,
        question,
        arbitrator,
        timeout,
        closingTimestamp,
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


      // Get the condition ID first
      const conditionId = await getConditionId(questionId!)


      const createMarketHash = await writeContract({
        address: FPMM_DETERMINISTIC_FACTORY_ADDRESS,
        abi: FPMM_DETERMINISTIC_FACTORY_ABI,
        functionName: 'create2FixedProductMarketMaker',
        args: [
          saltNonce,
          CONDITIONAL_TOKENS_ADDRESS,
          ERC20_CRC_GROUP_ADDRESS,
          [conditionId],
          BigInt(feeBasisPoints),
          parseEther(formData.initialFunds),
          []
        ]
      })

      console.log('Market creation transaction hash:', createMarketHash);


      // Wait for transaction receipt with retry logic
      console.log('Waiting for transaction receipt...');
      let receipt;
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries && !receipt) {
        try {
          console.log(`Attempt ${retryCount + 1} to get receipt...`);
          receipt = await publicClient.waitForTransactionReceipt({
            hash: createMarketHash,
            timeout: 60_000,
            confirmations: 1,
            onReplaced: (replacement) => {
              console.log('Transaction replaced:', replacement);
            },
          });
        } catch (err) {
          console.error(`Attempt ${retryCount + 1} failed:`, err);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to get receipt after ${maxRetries} attempts: ${err instanceof Error ? err.message : String(err)}`);
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 10_000));
        }
      }

      if (!receipt) {
        throw new Error('Failed to get transaction receipt after multiple attempts');
      }

      console.log('Transaction receipt received. Status:', receipt.status);
      console.log('Block number:', receipt.blockNumber);
      console.log('Transaction index:', receipt.transactionIndex);

      console.log('Market created successfully. Transaction status:', receipt.status)
      console.log('Transaction receipt:', receipt)

      // Set up event watcher for FixedProductMarketMakerCreation event
      console.log('Setting up event watcher for FixedProductMarketMakerCreation event...');

      // Get the ABI for the event
      const eventLog = receipt.logs?.find(log =>
        log.topics[0] === '0x92e0912d3d7f3192cad5c7ae3b47fb97f9c465c1dd12a5c24fd901ddb3905f43'
      );

      // Use Promise to handle the event watching asynchronously
      let marketAddress: string | undefined;

      if (eventLog) {
        const decodedEvent = decodeEventLog({
          abi: FPMM_DETERMINISTIC_FACTORY_ABI,
          data: eventLog.data,
          topics: eventLog.topics,
        })

        console.log('Decoded event:', decodedEvent)

        // Extract specific values with proper typing
        const {
          creator,
          fixedProductMarketMaker,
          conditionalTokens,
          collateralToken,
          conditionIds,
          fee
        } = decodedEvent.args
        marketAddress = fixedProductMarketMaker;
        console.log('Market Address:', fixedProductMarketMaker)
        console.log('Creator:', creator)
        console.log('Conditional Tokens:', conditionalTokens)
        console.log('Collateral Token:', collateralToken)
        console.log('Condition IDs:', conditionIds)
        console.log('Fee:', fee)
      }

      if (!marketAddress) {
        throw new Error('Market address is not available');
      }

      console.log('Market created at address:', marketAddress);

      // Create a bet contract for each outcome
      const txHashes: string[] = [];
      const outcomeIndexes: number[] = [];
      const betContractIdentifiers: string[] = [];
      const metadataDigests: `0x${string}`[] = [];
      // ToDo - get conditionId from market

      for (let outcomeIndex = 0; outcomeIndex < formData.outcomes.length; outcomeIndex++) {
        outcomeIndexes.push(outcomeIndex + 1);
        const betContractIdentifier = prepareBetContractIdentifier(outcomeIndex); 
        betContractIdentifiers.push(betContractIdentifier);

        // Use the first 32 bytes of the questionId as metadata digest
        // Todo - use organization metadata digest       
        metadataDigests.push("0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);
      }
      const liquidityContractIdentifiers = prepareLiquidityContractIdentifiers();
      console.log("before creating bet contracts");
      console.log("fpmm market", getAddress(marketAddress));
      console.log("circles group", formData.circlesGroup);
      console.log("condition id", conditionId);
      console.log("bet contract identifiers", betContractIdentifiers);
      console.log("metadata digests", metadataDigests);
      console.log("liquidity contract identifiers", liquidityContractIdentifiers);

      // Call createBetContract
      const txHash = await writeContract({
        address: BET_CONTRACT_FACTORY_ADDRESS,
        abi: BET_CONTRACT_FACTORY_ABI,
        functionName: 'createContractsForFpmm',
        args: [
          getAddress(marketAddress), // fpmmAddress
          getAddress(formData.circlesGroup), // groupCRCToken (using circles group address)
          outcomeIndexes,
          [conditionId],
          betContractIdentifiers,
          metadataDigests,
          liquidityContractIdentifiers,
          metadataDigests
        ]
      });
      console.log("created bet contracts", txHash);

      txHashes.push(txHash);


      // Wait for all transactions to be mined
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      await Promise.all(
        txHashes.map(txHash =>
          publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        )
      );

      // Get the bet contract addresses using getMarketInfo
      const marketInfo = await publicClient.readContract({
        address: BET_CONTRACT_FACTORY_ADDRESS,
        abi: BET_CONTRACT_FACTORY_ABI,
        functionName: 'getMarketInfo',
        args: [getAddress(marketAddress)]
      });

      if (!marketInfo || typeof marketInfo !== 'object' || !('betContracts' in marketInfo)) {
        throw new Error('Market info is missing or invalid');
      }
      const betContractAddresses = (marketInfo as { betContracts: unknown }).betContracts as `0x${string}`[];
      console.log('Bet contracts created:', betContractAddresses);

      // Set the market creation result with the addresses
      setMarketCreationResult({
        creator: address || '',
        fixedProductMarketMaker: marketAddress,
        conditionalTokens: CONDITIONAL_TOKENS_ADDRESS,
        collateralToken: ERC20_CRC_GROUP_ADDRESS,
        conditionIds: [conditionId],
        fee: feeBasisPoints.toString(),
        betContractAddresses: betContractAddresses
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


          </div>
        )}
      </form>
    </div>
  )
}
