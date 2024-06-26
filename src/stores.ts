import { createContext } from 'react';
import BaseStore from '~app/common/stores/BaseStore';

const stores = [
  'SSV',
  'Wallet',
  'Process',
  'Cluster',
  'Checkbox',
  'Operator',
  'Validator',
  'MyAccount',
  'Distribution',
  'Notifications',
  'OperatorMetadata',
  'DistributionTestnet',
];
const rootStore: Record<string, any> = BaseStore.getInstance().preloadStores(stores);
const rootStoreContext = createContext(rootStore);

export {
  rootStore,
};

export default rootStoreContext;
