export const CONDITIONAL_TOKENS_ADDRESS = '0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce' as const;

export const CONDITIONAL_TOKENS_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "oracle",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "outcomeSlotCount",
        "type": "uint256"
      }
    ],
    "name": "getConditionId",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "oracle",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "outcomeSlotCount",
        "type": "uint256"
      }
    ],
    "name": "prepareCondition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "conditionId",
        "type": "bytes32"
      }
    ],
    "name": "getOutcomeSlotCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "conditionId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "oracle",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "outcomeSlotCount",
        "type": "uint256"
      }
    ],
    "name": "ConditionPreparation",
    "type": "event"
  }
] as const;
