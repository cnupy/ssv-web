import { Contract } from 'web3-eth-contract';
import { action, observable, computed } from 'mobx';
import BaseStore from '~app/common/stores/BaseStore';
import WalletStore from '~app/common/stores/Wallet.store';
import EthereumKeyStore from '~lib/crypto/EthereumKeyStore';
import PriceEstimation from '~lib/utils/contract/PriceEstimation';
import ApplicationStore from '~app/common/stores/Application.store';
import NotificationsStore from '~app/common/stores/Notifications.store';
import Threshold, { IShares, ISharesKeyPairs } from '~lib/crypto/Threshold';
import ContractOperator, { IOperator } from '~app/common/stores/contract/ContractOperator.store';

class ContractValidator extends BaseStore {
  public static OPERATORS_SELECTION_GAP = 66.66;
  private keyStore: EthereumKeyStore | undefined;

  @observable validatorPrivateKey: string = '';
  @observable validatorPrivateKeyFile: File | null = null;
  @observable validatorKeyStorePassword: string = '';

  @observable addingNewValidator: boolean = false;
  @observable newValidatorReceipt: any = null;

  @observable estimationGas: number = 0;
  @observable dollarEstimationGas: number = 0;

  /**
   * Return validator public key
   */
  @computed
  get validatorPublicKey() {
    if (!this.keyStore) {
      return false;
    }
    return this.keyStore.getPublicKey();
  }

  /**
   * Extract validator private key from keystore file
   */
  @action.bound
  async extractPrivateKey() {
    const applicationStore: ApplicationStore = this.getStore('Application');
    applicationStore.setIsLoading(true);
    return this.validatorPrivateKeyFile?.text().then(async (string) => {
      try {
        this.keyStore = new EthereumKeyStore(string);
        const privateKey = await this.keyStore.getPrivateKey(this.validatorKeyStorePassword);
        this.setValidatorPrivateKey(privateKey);
        return privateKey;
      } catch (error) {
        const notificationsStore: NotificationsStore = this.getStore('Notifications');
        notificationsStore.showMessage(error.message, 'error');
        this.setValidatorPrivateKey('');
        applicationStore.setIsLoading(false);
        return '';
      }
    });
  }

  /**
   * Add new validator
   * @param getGasEstimation
   */
  @action.bound
  async addNewValidator(getGasEstimation?: boolean) {
    const walletStore: WalletStore = this.getStore('Wallet');
    const applicationStore: ApplicationStore = this.getStore('Application');
    const notificationsStore: NotificationsStore = this.getStore('Notifications');
    const operatorStore: ContractOperator = this.getStore('contract/ContractOperator');
    const gasEstimation: PriceEstimation = new PriceEstimation();
    this.newValidatorReceipt = null;
    this.addingNewValidator = true;
    await walletStore.connect();
    const contract: Contract = await walletStore.getContract();
    const ownerAddress: string = walletStore.accountAddress;
    const threshold: Threshold = new Threshold();
    const thresholdResult: ISharesKeyPairs = await threshold.create(this.validatorPrivateKey);

    if (!walletStore.accountAddress) return;
    applicationStore.setIsLoading(true);
    return new Promise((resolve, reject) => {
      if (!walletStore.checkIfWalletReady()) {
        reject();
      }
      // Get list of selected operator's public keys
      const operatorPublicKeys: string[] = operatorStore.operators
        .filter((operator: IOperator) => {
          return operator.selected;
        })
        .map((operator: IOperator) => {
          return operator.pubkey;
        });
      // Collect all public keys from shares
      const sharePublicKeys: string[] = thresholdResult.shares.map((share: IShares) => {
        return share.publicKey;
      });
      // Collect all private keys from shares
      const encryptedKeys: string[] = thresholdResult.shares.map((share: IShares) => {
        return share.privateKey;
      });

      const payload = [
        ownerAddress,
        thresholdResult.validatorPublicKey,
        operatorPublicKeys,
        sharePublicKeys,
        encryptedKeys,
      ];

      console.debug('Add Validator Payload: ', payload);

      if (getGasEstimation) {
        // Send add operator transaction
        contract.methods
          .addValidator(...payload)
          .estimateGas({ from: ownerAddress })
          .then((gasAmount: any) => {
            this.addingNewValidator = true;
            this.estimationGas = gasAmount * 0.000000001;
            gasEstimation
              .estimateGasInUSD(this.estimationGas)
              .then((rate: number) => {
                this.dollarEstimationGas = this.estimationGas * rate;
                resolve(true);
              })
              .catch((error: any) => {
                applicationStore.displayUserError(error);
              });
          })
          .catch((error: any) => {
            applicationStore.displayUserError(error);
            reject(error);
          });
      } else {
        // Send add operator transaction
        contract.methods
          .addValidator(...payload)
          .send({ from: ownerAddress })
          .on('receipt', (receipt: any) => {
            console.debug('Contract Receipt', receipt);
            this.newValidatorReceipt = receipt;
            applicationStore.setIsLoading(false);
          })
          .on('error', (error: any) => {
            this.addingNewValidator = false;
            notificationsStore.showMessage(error.message, 'error');
            console.debug('Contract Error', error);
            applicationStore.setIsLoading(false);
            reject(error);
          })
          .catch((error: any) => {
            this.addingNewValidator = false;
            if (error) {
              notificationsStore.showMessage(error.message, 'error');
              reject(error);
            }
            console.debug('Contract Error', error);
            applicationStore.setIsLoading(false);
            resolve(true);
          });

        // Listen for final event when it's added
        contract.events
          .ValidatorAdded({}, (error: any, event: any) => {
            this.addingNewValidator = false;
            if (error) {
              notificationsStore.showMessage(error.message, 'error');
              reject(error);
            } else {
              console.debug('Contract Receipt', event);
              this.newValidatorReceipt = event;
              notificationsStore.showMessage('You successfully added validator!', 'success');
              resolve(event);
            }
            console.debug({ error, event });
            applicationStore.setIsLoading(false);
          })
          .on('error', (error: any, receipt: any) => {
            if (error) {
              notificationsStore.showMessage(error.message, 'error');
              console.debug({ error, receipt });
              reject(error);
            }
            applicationStore.setIsLoading(false);
          });
      }
    });
  }

  /**
   * Set validator private key
   * @param validatorPrivateKey
   */
  @action.bound
  setValidatorPrivateKey(validatorPrivateKey: string) {
    this.validatorPrivateKey = validatorPrivateKey;
  }

  /**
   * Set keystore file
   * @param validatorPrivateKeyFile
   */
  @action.bound
  setValidatorPrivateKeyFile(validatorPrivateKeyFile: any) {
    this.validatorPrivateKeyFile = validatorPrivateKeyFile;
    this.validatorPrivateKey = '';
  }

  /**
   * Set password from keystore file
   * @param validatorKeyStorePassword
   */
  @action.bound
  setValidatorKeyStorePassword(validatorKeyStorePassword: string) {
    this.validatorKeyStorePassword = validatorKeyStorePassword;
  }
}

export default ContractValidator;