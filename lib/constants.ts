export const BET_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "getAddressesWithBalanceGreaterThan0",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
export const BET_CONTRACT_FACTORY_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_hubAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_liquidityContractFactory",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "EnforcedPause"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "ExpectedPause"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "OwnableInvalidOwner"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "OwnableUnauthorizedAccount"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "betContract",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "outcomeIndex",
                "type": "uint256",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "BetContractDeployed",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "previousOwner",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "OwnershipTransferred",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "Paused",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "Unpaused",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fpmmAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "groupCRCToken",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "outcomeIndexes",
                "type": "uint256[]"
            },
            {
                "internalType": "bytes32[]",
                "name": "conditionIds",
                "type": "bytes32[]"
            },
            {
                "internalType": "string[]",
                "name": "betContractsOrganizationNames",
                "type": "string[]"
            },
            {
                "internalType": "bytes32[]",
                "name": "betContractsOrganizationMetadataDigests",
                "type": "bytes32[]"
            },
            {
                "internalType": "string[]",
                "name": "liquidityOrganizationNames",
                "type": "string[]"
            },
            {
                "internalType": "bytes32[]",
                "name": "liquidityOrganizationMetadataDigests",
                "type": "bytes32[]"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "createContractsForFpmm"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fpmmAddress",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "fpmmAlreadyProcessed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "fpmmToBetContracts",
        "outputs": [
            {
                "internalType": "address",
                "name": "fpmmAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "groupCRCToken",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "fpmmToLiquidityInfo",
        "outputs": [
            {
                "internalType": "address",
                "name": "liquidityVaultToken",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "liquidityAdder",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "liquidityRemover",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "getAllProcessedFPMMAddresses",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fpmmAddress",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getLiquidityInfo",
        "outputs": [
            {
                "internalType": "struct LiquidityInfo",
                "name": "",
                "type": "tuple",
                "components": [
                    {
                        "internalType": "address",
                        "name": "liquidityVaultToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "liquidityAdder",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "liquidityRemover",
                        "type": "address"
                    }
                ]
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fpmmAddress",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getMarketInfo",
        "outputs": [
            {
                "internalType": "struct MarketInfo",
                "name": "",
                "type": "tuple",
                "components": [
                    {
                        "internalType": "address",
                        "name": "fpmmAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "groupCRCToken",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "outcomeIdxs",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "address[]",
                        "name": "betContracts",
                        "type": "address[]"
                    }
                ]
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "hubAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "liquidityVaultToken",
        "outputs": [
            {
                "internalType": "contract LiquidityVaultToken",
                "name": "",
                "type": "address"
            }
        ]
    }
];

export const BET_CONTRACT_FACTORY_ADDRESS = "0x4c1e719001CDFa6A5Febb5D3cb03EC39A43F3D67" as `0x${string}`;

export const FPMM_DETERMINISTIC_FACTORY_ADDRESS = '0x9083A2B699c0a4AD06F63580BDE2635d26a3eeF0' as `0x${string}`
export const FPMM_DETERMINISTIC_FACTORY_ABI = [
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
] as const;