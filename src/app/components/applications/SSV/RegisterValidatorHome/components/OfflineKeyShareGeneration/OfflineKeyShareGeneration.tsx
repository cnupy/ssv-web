import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { isWindows, osName } from 'react-device-detect';
import { useStores } from '~app/hooks/useStores';
import LinkText from '~app/components/common/LinkText';
import TextInput from '~app/components/common/TextInput';
import config, { translations } from '~app/common/config';
import BorderScreen from '~app/components/common/BorderScreen';
import ErrorMessage from '~app/components/common/ErrorMessage';
import { validateAddressInput } from '~lib/utils/validatesInputs';
import CustomTooltip from '~app/components/common/ToolTip/ToolTip';
import { validateDkgAddress } from '~lib/utils/operatorMetadataHelper';
import PrimaryButton from '~app/components/common/Button/PrimaryButton';
import WalletStore from '~app/common/stores/applications/SsvWeb/Wallet.store';
import ProcessStore from '~app/common/stores/applications/SsvWeb/Process.store';
import { CopyButton } from '~app/components/common/Button/CopyButton/CopyButton';
import { getStoredNetwork, isMainnet } from '~root/providers/networkInfo.provider';
import NewWhiteWrapper from '~app/components/common/NewWhiteWrapper/NewWhiteWrapper';
import { DEVELOPER_FLAGS } from '~lib/utils/developerHelper';
import NotificationsStore from '~app/common/stores/applications/SsvWeb/Notifications.store';
import OperatorStore from '~app/common/stores/applications/SsvWeb/Operator.store';
import DkgOperator from '~app/components/applications/SSV/RegisterValidatorHome/components/DkgOperator/DkgOperator';
import {
  useStyles,
} from '~app/components/applications/SSV/RegisterValidatorHome/components/OfflineKeyShareGeneration/OfflineKeyShareGeneration.styles';
import { getFromLocalStorageByKey } from '~root/providers/localStorage.provider';
import { IOperator } from '~app/model/operator.model';
import { getOwnerNonce } from '~root/services/account.service';

const OFFLINE_FLOWS = {
  COMMAND_LINE: 1,
  DESKTOP_APP: 2,
  DKG: 3,
};

const XS = 12;
const MIN_VALIDATORS_COUNT = 1;
const MAX_VALIDATORS_COUNT = 100;

const OfflineKeyShareGeneration = () => {
  const stores = useStores();
  const classes = useStyles();
  const navigate = useNavigate();
  const walletStore: WalletStore = stores.Wallet;
  const processStore: ProcessStore = stores.Process;
  const operatorStore: OperatorStore = stores.Operator;
  const [selectedBox, setSelectedBox] = useState(0);
  const [textCopied, setTextCopied] = useState(false);
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [addressValidationError, setAddressValidationError] = useState({ shouldDisplay: true, errorMessage: '' });
  const [ownerNonce, setOwnerNonce] = useState<number | undefined>(undefined);
  const notificationsStore: NotificationsStore = stores.Notifications;
  const { accountAddress } = walletStore;
  const { apiNetwork } = getStoredNetwork();
  const [confirmedWithdrawalAddress, setConfirmedWithdrawalAddress] = useState(false);
  const operatorsAcceptDkg = Object.values(operatorStore.selectedOperators).every((operator: IOperator) => !validateDkgAddress(operator.dkg_address ?? ''));
  const dynamicFullPath = isWindows ? '%cd%' : '$(pwd)';
  const [validatorsCount, setValidatorsCount] = useState(MIN_VALIDATORS_COUNT);
  const [isInvalidValidatorsCount, setIsInvalidValidatorsCount] = useState(false);

  useEffect(() => {
    const fetchOwnerNonce = async () => {
      const nonce = await getOwnerNonce({ address: accountAddress });
      // TODO: add proper error handling
      setOwnerNonce(nonce);
    };
    fetchOwnerNonce();
  }, []);

  const confirmWithdrawalAddressHandler = () => {
    if (!addressValidationError.shouldDisplay && withdrawalAddress) {
      setConfirmedWithdrawalAddress(true);
    }
  };

  const isSelected = (id: number) => selectedBox === id;

  const goToNextPage = (selectedBoxIndex: number, isSecondRegistration: boolean) => {
    if (selectedBoxIndex === OFFLINE_FLOWS.DKG) {
      navigate(config.routes.SSV.VALIDATOR.DISTRIBUTION_METHOD.DISTRIBUTE_SUMMARY);
      return;
    }
    if (isSecondRegistration) {
      navigate(config.routes.SSV.MY_ACCOUNT.CLUSTER.UPLOAD_KEYSHARES);
    } else {
      navigate(config.routes.SSV.VALIDATOR.DISTRIBUTION_METHOD.UPLOAD_KEYSHARES);
    }
  };

  const goToChangeOperators = () => {
    navigate(-2);
  };

  const sortedOperators = Object.values(operatorStore.selectedOperators).sort((a: any, b: any) => a.id - b.id);
  const { operatorsIds, operatorsKeys } = sortedOperators.reduce((aggr: any, operator: IOperator) => {
    aggr.operatorsIds.push(operator.id);
    aggr.operatorsKeys.push(operator.public_key);
    return aggr;
  }, {
    operatorsIds: [],
    operatorsKeys: [],
  });

  const getOperatorsData = () => {
    const operatorsInfo = Object.values(operatorStore.selectedOperators).map((operator: any) => ({
      id: operator.id,
      public_key: operator.public_key,
      ip: operator.dkg_address,
    }));
    let jsonOperatorInfo = JSON.stringify(operatorsInfo);
    if (isWindows) {
      jsonOperatorInfo = jsonOperatorInfo.replace(/"/g, '\\"');
    }
    return isWindows ? `"${jsonOperatorInfo}"` : `'${jsonOperatorInfo}'`;
  };

  const cliCommand = `--operator-keys=${operatorsKeys.join(',')} --operator-ids=${operatorsIds.join(',')} --owner-address=${accountAddress} --owner-nonce=${ownerNonce}`;
  const dkgCliCommand = `docker pull bloxstaking/ssv-dkg:v2.0.0 && docker run --rm -v ${dynamicFullPath}:/data -it "bloxstaking/ssv-dkg:v2.0.0" init --owner ${walletStore.accountAddress} --nonce ${ownerNonce} --withdrawAddress ${withdrawalAddress} --operatorIDs ${operatorsIds.join(',')} --operatorsInfo ${getOperatorsData()} --network ${apiNetwork} --validators ${validatorsCount} --logFilePath /data/debug.log --outputPath /data`;
  const instructions = [
    {
      id: OFFLINE_FLOWS.COMMAND_LINE, instructions: [
        <Grid>1. Download the <b>{osName}</b> executable from <LinkText text={translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.linkText}
                                                                        link={config.links.SSV_KEYS_RELEASES_URL}/></Grid>,
        translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.COMMAND_LINE_INSTRUCTIONS.secondStep,
        translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.COMMAND_LINE_INSTRUCTIONS.thirdStep,
        translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.COMMAND_LINE_INSTRUCTIONS.fourthStep,
      ],
    },
    {
      id: OFFLINE_FLOWS.DESKTOP_APP, instructions: [
        <Grid>1. Download the <b>{osName}</b> executable from <LinkText text={translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.linkText}
                                                                        link={config.links.SSV_KEYS_RELEASES_URL}/></Grid>,
        translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.DESKTOP_APP.secondStep,
        translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.DESKTOP_APP.thirdStep,
      ],
    },
  ];

  const copyToClipboard = () => {
    const command = selectedBox === OFFLINE_FLOWS.COMMAND_LINE ? cliCommand : dkgCliCommand;
    navigator.clipboard.writeText(command);
    notificationsStore.showMessage('Copied to clipboard.', 'success');
    setTextCopied(true);
  };

  const checkBox = (id: number) => {
    setTextCopied(false);
    setSelectedBox(id);
  };

  const changeWithdrawalAddressHandler = (e: any) => {
    const { value } = e.target;
    setWithdrawalAddress(value);
    validateAddressInput(value, setAddressValidationError, false, 'Withdrawal address');
    setTextCopied(false);
    setConfirmedWithdrawalAddress(false);
  };

  const changeValidatorsCountHandler = (e: any) => {
    const { value } = e.target;
    if (Number(value) >= MIN_VALIDATORS_COUNT && Number(value) <= MAX_VALIDATORS_COUNT) {
      setIsInvalidValidatorsCount(false);
    } else {
      setIsInvalidValidatorsCount(true);
      setTextCopied(false);
    }
    setValidatorsCount(Number(value));
  };

  const showCopyButtonCondition = selectedBox === OFFLINE_FLOWS.COMMAND_LINE || (selectedBox === OFFLINE_FLOWS.DKG && withdrawalAddress && !addressValidationError.shouldDisplay && confirmedWithdrawalAddress);
  const commandCli = selectedBox === OFFLINE_FLOWS.COMMAND_LINE ? cliCommand : dkgCliCommand;
  const buttonLabelCondition = selectedBox === OFFLINE_FLOWS.COMMAND_LINE || selectedBox === OFFLINE_FLOWS.DESKTOP_APP || selectedBox === OFFLINE_FLOWS.DKG && operatorsAcceptDkg || selectedBox === 0;
  const cliCommandPanelCondition = selectedBox === OFFLINE_FLOWS.COMMAND_LINE || selectedBox === OFFLINE_FLOWS.DKG && operatorsAcceptDkg && confirmedWithdrawalAddress && !isInvalidValidatorsCount;
  const buttonLabel = buttonLabelCondition ? translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.BUTTON.NEXT : translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.BUTTON.CHANGE_OPERATORS;
  const submitFunctionCondition = selectedBox === OFFLINE_FLOWS.DKG && !operatorsAcceptDkg;

  const disabledCondition = () => {
    if (selectedBox === OFFLINE_FLOWS.COMMAND_LINE) {
      return !textCopied;
    } else if (selectedBox === OFFLINE_FLOWS.DKG && operatorsAcceptDkg) {
      return !textCopied || isInvalidValidatorsCount;
    } else if (selectedBox === 0) {
      return true;
    } else {
      return false;
    }
  };

  const hideButtonCondition = () => {
    if (submitFunctionCondition) {
      return !processStore.secondRegistration;
    }
    return true;
  };

  // @ts-ignore
  const enableDesktopAppKeysharesGeneration = JSON.parse(getFromLocalStorageByKey(DEVELOPER_FLAGS.ENABLE_DESKTOP_APP_KEYSHARES_GENERATION));

  const MainScreen =
    <BorderScreen
      blackHeader
      withoutNavigation={processStore.secondRegistration}
      header={translations.VALIDATOR.OFFLINE_KEY_SHARE_GENERATION.HEADER}
      overFlow={'none'}
      width={!isMainnet() ? 872 : undefined}
      body={[
        <Grid container style={{ gap: 24 }}>
          <Grid container wrap={'nowrap'} item style={{ gap: 24 }}>
            <Grid container item
                  className={`${classes.Box} ${isSelected(OFFLINE_FLOWS.COMMAND_LINE) ? classes.BoxSelected : ''}`}
                  onClick={() => checkBox(OFFLINE_FLOWS.COMMAND_LINE)}>
              <Grid item xs={XS} className={classes.Image}/>
              <Typography className={classes.BlueText}>Command Line Interface</Typography>
              <Typography className={classes.AdditionalGrayText}>Generate from Existing Key</Typography>
            </Grid>
            <Tooltip disableHoverListener={enableDesktopAppKeysharesGeneration} title="Coming soon..."
                     placement="top-end" children={
              <Grid>
                <Grid container
                      item
                      className={`${classes.Box} ${enableDesktopAppKeysharesGeneration ? '' : classes.Disable} ${isSelected(OFFLINE_FLOWS.DESKTOP_APP) ? classes.BoxSelected : ''}`}
                      onClick={() => checkBox(OFFLINE_FLOWS.DESKTOP_APP)}>
                  <Grid item xs={XS} className={`${classes.Image} ${classes.Desktop}`}/>
                  <Typography className={classes.BlueText}>Desktop App</Typography>
                  <Typography className={classes.AdditionalGrayText}>Generate from Existing Key</Typography>
                </Grid>
              </Grid>}/>
            {!isMainnet() && <Grid container item
																	 className={`${classes.Box} ${isSelected(OFFLINE_FLOWS.DKG) ? classes.BoxSelected : ''}`}
																	 onClick={() => checkBox(OFFLINE_FLOWS.DKG)}>
							<Grid item xs={XS}
										className={`${classes.Image} ${classes.DkgImage} ${!isSelected(OFFLINE_FLOWS.DKG) && classes.DkgImageUnselected}`}/>
							<Grid className={classes.OptionTextWrapper}>
								<Typography className={classes.BlueText}>DKG</Typography>
								<Typography className={classes.AdditionalGrayText}>Generate from New Key</Typography>
							</Grid>
						</Grid>}
          </Grid>
          {selectedBox === OFFLINE_FLOWS.DESKTOP_APP && <Grid container item className={classes.UnofficialTool}>
						This app is an unofficial tool built as a public good by the OneStar team.
					</Grid>}
          {selectedBox !== 0 && selectedBox !== OFFLINE_FLOWS.DKG && <Grid container item>
						<Typography className={classes.GrayText} style={{ marginBottom: 16 }}>instructions:</Typography>
						<Grid container className={classes.ColumnDirection} item style={{ gap: 24 }}>
              {instructions.map((instruction) => {
                if (instruction.id === selectedBox) {
                  return instruction.instructions.map((text, index: number) => {
                    return <Typography key={index}
                                       className={classes.BlackText}>{text}</Typography>;
                  });
                }
              })}
						</Grid>
					</Grid>
          }
          {selectedBox === OFFLINE_FLOWS.DKG && !isMainnet() && operatorsAcceptDkg &&
						<Grid container item className={classes.DkgInstructionsWrapper}>
							<Grid className={classes.DkgNotification}>
								Please note that this tool is yet to be audited. Please refrain from using it on mainnet.
							</Grid>
							<Grid className={classes.DkgSectionWrapper}>
								<Typography className={classes.DkgTitle}>Prerequisite</Typography>
								<Grid className={classes.DkgText}><LinkText text={translations.VALIDATOR.DISTRIBUTE_OFFLINE.DKG.DOCKER_INSTALLED}
																														link={config.links.DKG_DOCKER_INSTALL_URL}/>&nbsp;on
									the machine hosting the DKG client</Grid>
							</Grid>
							<Grid className={classes.DkgSectionWrapper}>
								<Typography className={classes.DkgTitle}>Instructions</Typography>
								<Grid className={classes.DkgText}>1. Select how many validators to generate</Grid>
								<Grid className={classes.DkgWithdrawAddressWrapper}>
									<TextInput value={validatorsCount}
														 onChangeCallback={changeValidatorsCountHandler}/>
                  {isInvalidValidatorsCount &&
										<Typography className={classes.DkgErrorMessage}>Validators count must be a number between
											1-100.</Typography>}
								</Grid>
							</Grid>
							<Grid className={classes.DkgSectionWrapper}>
								<Grid className={classes.DkgText}>2. Set Withdrawal Address <CustomTooltip
									text={translations.VALIDATOR.DISTRIBUTE_OFFLINE.DKG.DKG_WITHDRAWAL_ADDRESS}/></Grid>
								<Grid className={classes.DkgWithdrawAddressWrapper}>
									<TextInput value={withdrawalAddress}
														 onChangeCallback={changeWithdrawalAddressHandler}
														 sideButton={true}
														 sideButtonLabel={confirmedWithdrawalAddress ? 'Confirmed' : 'Confirm'}
														 sideButtonClicked={confirmedWithdrawalAddress}
														 sideButtonAction={confirmWithdrawalAddressHandler}
														 sideButtonDisabled={!withdrawalAddress || addressValidationError.shouldDisplay}/>
                  {addressValidationError.errorMessage && withdrawalAddress &&
										<Typography className={classes.DkgErrorMessage}>{addressValidationError.errorMessage}</Typography>}
								</Grid>
							</Grid>
              {cliCommandPanelCondition && <Grid className={classes.DkgSectionWrapper}>
								<Typography className={classes.DkgText}>2. Initiate the DKG ceremony with the following
									command:</Typography>
								<Grid container item className={classes.CopyWrapper} style={{ gap: textCopied ? 7 : 40 }}>
									<Grid item xs className={classes.CopyText}>{commandCli}</Grid>
                  {showCopyButtonCondition &&
										<CopyButton textCopied={textCopied} classes={classes} onClickHandler={copyToClipboard}/>}
								</Grid>
								<Typography className={classes.DkgCliAdditionalText}>Experiencing issues initiating the ceremony?
									Explore solutions in the <LinkText
										style={{ fontSize: 14, fontWeight: 500 }}
										link={config.links.DKG_TROUBLESHOOTING_LINK}
										text={'troubleshooting guide.'}/></Typography>
							</Grid>}
						</Grid>}
          {selectedBox === 3 && !operatorsAcceptDkg && <Grid className={classes.DkgOperatorsWrapper}>
						<ErrorMessage
							text={translations.VALIDATOR.DISTRIBUTE_OFFLINE.DKG.OPERATOR_DOESNT_SUPPORT_DKG_ERROR_TEXT}/>
            {Object.values(operatorStore.selectedOperators).sort((a: any, b: any) => {
              if (a.dkg_address && !b.dkg_address) {
                return 1;
              } else if (!a.dkg_address && b.dkg_address) {
                return -1;
              }
              return a.id - b.id;
            }).map((operator: IOperator) => <DkgOperator
              operator={operator}/>)}
					</Grid>}
          {selectedBox === 1 &&
						<Grid container item className={classes.CopyWrapper} style={{ gap: textCopied ? 7 : 40 }}>
							<Grid item xs className={classes.CopyText}>{commandCli}</Grid>
              {showCopyButtonCondition &&
								<CopyButton textCopied={textCopied} classes={classes} onClickHandler={copyToClipboard}/>}
						</Grid>
          }
          {hideButtonCondition() && <PrimaryButton children={buttonLabel}
																									 submitFunction={submitFunctionCondition ? goToChangeOperators : () => goToNextPage(selectedBox, processStore.secondRegistration)}
																									 disable={disabledCondition()}/>}
        </Grid>,
      ]}
    />;

  if (processStore.secondRegistration) {
    return (
      <Grid container>
        <NewWhiteWrapper
          type={0}
          header={'Cluster'}
        />
        {MainScreen}
      </Grid>
    );
  }

  return MainScreen;
};

export default observer(OfflineKeyShareGeneration);
