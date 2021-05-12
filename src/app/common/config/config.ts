const config = {
  routes: {
    HOME: '/',
    OPERATOR: {
      HOME: '/operator',
      SUCCESS_PAGE: '/operator/success',
      GENERATE_KEYS: '/operator/generate',
      CONFIRMATION_PAGE: '/operator/confirm',
    },
    VALIDATOR: {
      HOME: '/validator',
      IMPORT: '/validator/import',
      CREATE: '/validator/create',
      SUCCESS_PAGE: '/validator/success',
      DECRYPT: '/validator/keystore/decrypt',
      CONFIRMATION_PAGE: '/validator/confirm',
      SELECT_OPERATORS: '/validator/operators',
      SLASHING_WARNING: '/validator/slashing-warning',
    },
  },
  FEATURE: {
    OPERATORS: {
      AUTO_SELECT: process.env.REACT_APP_FEATURE_AUTO_SELECT_OPERATORS,
      SELECT_MINIMUM_OPERATORS: 4,
      REQUEST_MINIMUM_OPERATORS: 50,
    },
    TESTING: {
      GENERATE_RANDOM_OPERATOR_KEY: process.env.REACT_APP_DEBUG,
    },
  },
  links: {
    LINK_SSV_DEV_DOCS: process.env.REACT_APP_LINK_SSV_DEV_DOCS,
    LINK_COIN_EXCHANGE_API: process.env.REACT_APP_COIN_EXCHANGE_URL,
  },
  ONBOARD: {
    API_KEY: process.env.REACT_APP_BLOCKNATIVE_KEY,
    NETWORK_ID: process.env.REACT_APP_BLOCKNATIVE_NETWORK_ID,
  },
  COIN_KEY: {
    COIN_EXCHANGE_KEY: process.env.REACT_APP_COIN_EXCHANGE_KEY,
  },
  CONTRACT: {
    ADDRESS: '0x555fe4a050Bb5f392fD80dCAA2b6FCAf829f21e9',
    PAYMENT_ADDRESS: '0xe52350A8335192905359c4c3C2149976dCC3D8bF',
    ABI: [
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': false,
            'internalType': 'string',
            'name': 'name',
            'type': 'string',
          },
          {
            'indexed': false,
            'internalType': 'bytes',
            'name': 'pubkey',
            'type': 'bytes',
          },
          {
            'indexed': false,
            'internalType': 'address',
            'name': 'paymentAddress',
            'type': 'address',
          },
        ],
        'name': 'OperatorAdded',
        'type': 'event',
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': false,
            'internalType': 'bytes',
            'name': 'pubkey',
            'type': 'bytes',
          },
          {
            'indexed': false,
            'internalType': 'address',
            'name': 'ownerAddress',
            'type': 'address',
          },
        ],
        'name': 'ValidatorAdded',
        'type': 'event',
      },
      {
        'inputs': [
          {
            'internalType': 'string',
            'name': '_name',
            'type': 'string',
          },
          {
            'internalType': 'string',
            'name': '_pubkey',
            'type': 'string',
          },
          {
            'internalType': 'address',
            'name': '_paymentAddress',
            'type': 'address',
          },
        ],
        'name': 'addOperator',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'inputs': [
          {
            'internalType': 'string',
            'name': 'pubkey',
            'type': 'string',
          },
          {
            'internalType': 'string[]',
            'name': 'operatorPubKeys',
            'type': 'string[]',
          },
          {
            'internalType': 'uint256[]',
            'name': 'indexes',
            'type': 'uint256[]',
          },
          {
            'internalType': 'string[]',
            'name': 'sharePubKeys',
            'type': 'string[]',
          },
          {
            'internalType': 'string[]',
            'name': 'encryptedKeys',
            'type': 'string[]',
          },
          {
            'internalType': 'address',
            'name': 'ownerAddress',
            'type': 'address',
          },
        ],
        'name': 'addValidator',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
      },
      {
        'inputs': [
          {
            'internalType': 'string',
            'name': 's',
            'type': 'string',
          },
        ],
        'name': 'fromHex',
        'outputs': [
          {
            'internalType': 'bytes',
            'name': '',
            'type': 'bytes',
          },
        ],
        'stateMutability': 'pure',
        'type': 'function',
      },
      {
        'inputs': [
          {
            'internalType': 'uint8',
            'name': 'c',
            'type': 'uint8',
          },
        ],
        'name': 'fromHexChar',
        'outputs': [
          {
            'internalType': 'uint8',
            'name': '',
            'type': 'uint8',
          },
        ],
        'stateMutability': 'pure',
        'type': 'function',
      },
      {
        'inputs': [],
        'name': 'operatorCount',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256',
          },
        ],
        'stateMutability': 'view',
        'type': 'function',
      },
      {
        'inputs': [],
        'name': 'validatorCount',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256',
          },
        ],
        'stateMutability': 'view',
        'type': 'function',
      },
    ],
  },
};

export default config;
