import React, { useEffect, useState } from 'react';
import _ from 'underscore';
import { observer } from 'mobx-react';
import Grid from '@mui/material/Grid';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import config from '~app/common/config';
import { useStores } from '~app/hooks/useStores';
import Status from '~app/components/common/Status';
import { useStyles } from './SingleCluster.styles';
import { longStringShorten } from '~lib/utils/strings';
import ImageDiv from '~app/components/common/ImageDiv';
import PrimaryButton from '~app/components/common/Button/PrimaryButton';
import WalletStore from '~app/common/stores/applications/SsvWeb/Wallet.store';
import OperatorStore from '~app/common/stores/applications/SsvWeb/Operator.store';
import useValidatorRegistrationFlow from '~app/hooks/useValidatorRegistrationFlow';
import Balance from '~app/components/applications/SSV/MyAccount/components/Balance';
import NewWhiteWrapper from '~app/components/common/NewWhiteWrapper/NewWhiteWrapper';
import NotificationsStore from '~app/common/stores/applications/SsvWeb/Notifications.store';
import Dashboard from '~app/components/applications/SSV/MyAccount/components/Dashboard/Dashboard';
import Settings
  from '~app/components/applications/SSV/MyAccount/components/Validator/SingleCluster/components/Settings';
import ProcessStore from '~app/common/stores/applications/SsvWeb/Process.store';
import OperatorBox
  from '~app/components/applications/SSV/MyAccount/components/Validator/SingleCluster/components/OperatorBox';
import ActionsButton
  from '~app/components/applications/SSV/MyAccount/components/Validator/SingleCluster/components/actions/ActionsButton';
import { getClusterHash } from '~root/services/cluster.service';
import { validatorsByClusterHash } from '~root/services/validator.service';
import { isMainnet } from '~root/providers/networkInfo.provider';
import { SingleCluster as SingleClusterProcess } from '~app/model/processes.model';

const ButtonTextWrapper = styled.div`
    display: flex;
    height: 100%;
    flex-direction: row;
    align-items: center;
    gap: 4px;
`;

const ButtonText = styled.p`
    font-size: 16px;
    font-weight: 600;
    background-color: ${({ theme }) => theme.primaryBlue};
`;

const Icon = styled.div<{ theme: any, icon: string, withoutDarkMode: boolean }>`
    width: 24px;
    height: 24px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-image: ${({ theme, icon, withoutDarkMode }) => {
        if (withoutDarkMode) {
            return `url(${icon}.svg)`;
        } else {
            return `url(${icon}${theme.colors.isDarkTheme ? '-dark.svg' : '.svg'})`;
        }
    }};
`;

const SingleCluster = () => {
  const stores = useStores();
  const classes = useStyles();
  const navigate = useNavigate();
  const walletStore: WalletStore = stores.Wallet;
  const processStore: ProcessStore = stores.Process;
  const operatorStore: OperatorStore = stores.Operator;
  const notificationsStore: NotificationsStore = stores.Notifications;
  const process: SingleClusterProcess = processStore.getProcess;
  const [rows, setRows] = useState<any[]>([]);
  const [clusterValidators, setClusterValidators] = useState<any[]>([]);
  const [loadingValidators, setLoadingValidators] = useState<boolean>(false);
  const [clusterValidatorsPagination, setClusterValidatorsPagination] = useState({
    page: 1,
    total: 10,
    pages: 1,
    per_page: 5,
    rowsPerPage: 7,
    onChangePage: console.log,
  });
  const cluster = process?.item;
  const showAddValidatorBtnCondition = cluster.operators.some((operator: any) => operator.is_deleted) || cluster.isLiquidated;
  const { getNextNavigation } = useValidatorRegistrationFlow(window.location.pathname);

  useEffect(() => {
    if (!cluster) return navigate(config.routes.SSV.MY_ACCOUNT.CLUSTER_DASHBOARD);
    setLoadingValidators(true);
      validatorsByClusterHash(1, getClusterHash(cluster.operators, walletStore.accountAddress), clusterValidatorsPagination.rowsPerPage).then((response: any) => {
        setClusterValidators(response.validators);
        setClusterValidatorsPagination(response.pagination);
        setLoadingValidators(false);
      });
  }, []);

  const createData = (
    publicKey: JSX.Element,
    status: JSX.Element,
    balance: JSX.Element,
    apr: JSX.Element,
  ) => {
    return { publicKey, status, balance, apr };
  };

  const extraButtons = (itemIndex: number) => {
    const validator: any = clusterValidators[itemIndex];
    return <Settings validator={validator}/>;
  };

  const copyToClipboard = (publicKey: string) => {
    navigator.clipboard.writeText(publicKey);
    notificationsStore.showMessage('Copied to clipboard.', 'success');
  };

  const sortValidatorsByStatus = () => {
    setClusterValidators(prevState => [...prevState.sort((a: any, b: any) => a.status === b.status ? 0 : a.status ? -1 : 1)]);
  };

  useEffect(() => {
    setRows(clusterValidators?.map((validator: any) => {
      return createData(
        <Grid container style={{ alignItems: 'center', gap: 8 }}>
          <Grid item>0x{longStringShorten(validator.public_key, 4)}</Grid>
          <ImageDiv onClick={() => copyToClipboard(validator.public_key)} image={'copy'} width={24} height={24}/>
        </Grid>,
        <Status item={validator}/>,
        <></>,
        <></>,
      );
    }));
  }, [clusterValidators]);

  const addToCluster = () => {
    process.processName = 'cluster_registration';
    // @ts-ignore
    process.registerValidator = { depositAmount: 0 };
    operatorStore.selectOperators(cluster.operators);
    navigate(getNextNavigation());
  };

  const backToClustersDashboard = () => {
    navigate(config.routes.SSV.MY_ACCOUNT.CLUSTER_DASHBOARD);
  };

  const onChangePage = _.debounce(async (newPage: number) => {
    setLoadingValidators(true);
    validatorsByClusterHash(newPage, getClusterHash(cluster.operators, walletStore.accountAddress), clusterValidatorsPagination.rowsPerPage).then((response: any) => {
      setClusterValidators(response.validators);
      setClusterValidatorsPagination(response.pagination);
      setLoadingValidators(false);
    }).catch(() => setLoadingValidators(false));
  }, 200);

  return (
    <Grid container className={classes.Wrapper}>
      <NewWhiteWrapper
        stepBack={backToClustersDashboard}
        type={0}
        header={'Cluster'}
      />
      <Grid container item className={classes.Section}>
        {(cluster?.operators).map((operator: any, index: number) => {
          return <OperatorBox key={index} operator={operator}/>;
        })}
      </Grid>
      <Grid container item className={classes.Section}>
        <Grid item>
          <Balance/>
        </Grid>
        <Grid item xs>
          {cluster.operators && <Dashboard
            disable
            rows={rows}
            headerPadding={7}
            loading={loadingValidators}
            noItemsText={'No Validators'}
            header={<Grid container className={classes.HeaderWrapper}>
              <Grid item className={classes.Header}>Validators</Grid>
              <Grid className={classes.ButtonsWrapper}>
                {cluster.validatorCount > 1 && <ActionsButton extendClass={classes.Actions} children={<ButtonTextWrapper>
                  <ButtonText>
                    Actions
                  </ButtonText>
                  <Icon icon={'/images/arrowDown/arrow'} withoutDarkMode={true}/>
                </ButtonTextWrapper>}/>}
                <PrimaryButton disable={showAddValidatorBtnCondition} wrapperClass={classes.AddToCluster}
                               children={<ButtonTextWrapper>
                                 <ButtonText>
                                   Add Validator
                                 </ButtonText>
                                 <Icon icon={'/images/plusIcon/plus'} withoutDarkMode={false}/>
                               </ButtonTextWrapper>} submitFunction={addToCluster}/>
              </Grid>
            </Grid>}
            paginationActions={{
              onChangePage: onChangePage,
              page: clusterValidatorsPagination.page,
              count: clusterValidatorsPagination.total,
              totalPages: clusterValidatorsPagination.pages,
              rowsPerPage: clusterValidatorsPagination.per_page,
            }}
            columns={[
              { name: 'Public Key' },
              {
                name: 'Status',
                onClick: sortValidatorsByStatus,
                tooltip: 'Refers to the validator’s status in the SSV network (not beacon chain), and reflects whether its operators are consistently performing their duties (according to the last 2 epochs).',
              },
              { name: '' },
              { name: '' },
            ]}
            extraActions={extraButtons}
          />}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default observer(SingleCluster);
