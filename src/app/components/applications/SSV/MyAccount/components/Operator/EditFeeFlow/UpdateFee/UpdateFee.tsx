import { observer } from 'mobx-react';
import { Grid } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import Operator from '~lib/api/Operator';
import { useStores } from '~app/hooks/useStores';
import WhiteWrapper from '~app/components/common/WhiteWrapper';
import OperatorStore from '~app/common/stores/applications/SsvWeb/Operator.store';
import ApplicationStore from '~app/common/stores/applications/SsvWeb/Application.store';
import OperatorId from '~app/components/applications/SSV/MyAccount/components/Operator/common/OperatorId';
import CancelUpdateFee from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/CancelUpdateFee';
import { useStyles } from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/UpdateFee/UpdateFee.styles';
import DeclareFee from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/UpdateFee/components/DeclareFee';
import FeeUpdated from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/UpdateFee/components/FeeUpdated';
import WaitingPeriod from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/UpdateFee/components/WaitingPeriod';
import PendingExpired from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/UpdateFee/components/PendingExpired';
import PendingExecution from '~app/components/applications/SSV/MyAccount/components/Operator/EditFeeFlow/UpdateFee/components/PendingExecution';

const UpdateFee = () => {
    const stores = useStores();
    const history = useHistory();
    const operatorStore: OperatorStore = stores.Operator;
    const [operator, setOperator] = useState(null);
    const [processState, setProcessState] = useState(0);
    const [previousFee, setPreviousFee] = useState('');
    const applicationStore: ApplicationStore = stores.Application;

    useEffect(() => {
        if (!operatorStore.processOperatorId) return history.push(applicationStore.strategyRedirect);
        applicationStore.setIsLoading(true);
        Operator.getInstance().getOperator(operatorStore.processOperatorId).then(async (response: any) => {
            if (response) {
                setOperator(response);
                getCurrentState();
            }
            applicationStore.setIsLoading(false);
        });
    }, []);

    const getCurrentState = async (forceState?: number) => {
        if (typeof forceState === 'number') {
            setProcessState(forceState);
            return;
        }

        // @ts-ignore
        await operatorStore.getOperatorFeeInfo(operatorStore.processOperatorId);
        if (operatorStore.operatorApprovalBeginTime && operatorStore.operatorApprovalEndTime && operatorStore.operatorFutureFee) {
            const todayDate = new Date();
            const endPendingStateTime = new Date(operatorStore.operatorApprovalEndTime * 1000);
            const startPendingStateTime = new Date(operatorStore.operatorApprovalBeginTime * 1000);
            const isInPendingState = todayDate >= startPendingStateTime && todayDate < endPendingStateTime;

            // @ts-ignore
            const daysFromEndPendingStateTime = Math.ceil(Math.abs(todayDate - endPendingStateTime) / (1000 * 3600 * 24));

            if (isInPendingState) {
                setProcessState(2);
            } else if (startPendingStateTime > todayDate) {
                setProcessState(1);
            } else if (todayDate > endPendingStateTime && daysFromEndPendingStateTime <= 3) {
                // @ts-ignore
                const savedOperator = JSON.parse(localStorage.getItem('expired_operators'));
                if (savedOperator && savedOperator?.includes(operatorStore.processOperatorId)) {
                    setProcessState(0);
                    return;
                }
                setProcessState(4);
            }
        }
    };

    // @ts-ignore
    const { logo, id } = operator || {};
    const classes = useStyles({ operatorLogo: logo });

    const renderBody = () => {
        // @ts-ignore
        switch (processState) {
            // @ts-ignore
            case 0:
                return <DeclareFee getCurrentState={getCurrentState} />;
            // @ts-ignore
            case 1:
                return <WaitingPeriod getCurrentState={getCurrentState} />;
            // @ts-ignore
            case 2:
                return <PendingExecution setPreviousFee={setPreviousFee} getCurrentState={getCurrentState} />;
            // @ts-ignore
            case 3:
                return <FeeUpdated previousFee={previousFee} />;
            // @ts-ignore
            case 4:
                return <PendingExpired />;
            default:
            // code block
        }
    };

    if (!operator) return null;

    return (
      <Grid container item>
        <WhiteWrapper header={'Update Operator Fee'}>
          <OperatorId id={id} />
        </WhiteWrapper>
        <Grid className={classes.BodyWrapper}>
          {renderBody()}
          <CancelUpdateFee getCurrentState={getCurrentState} />
        </Grid>
      </Grid>
    );
};

export default observer(UpdateFee);