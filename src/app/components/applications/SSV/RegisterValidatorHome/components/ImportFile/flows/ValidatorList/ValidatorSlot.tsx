import React from 'react';
import Grid from '@mui/material/Grid';
import { useStores } from '~app/hooks/useStores';
import ImageDiv from '~app/components/common/ImageDiv/ImageDiv';
import GoogleTagManager from '~lib/analytics/GoogleTag/GoogleTagManager';
import NotificationsStore from '~app/common/stores/applications/SsvWeb/Notifications.store';
import {
  useStyles,
} from '~app/components/applications/SSV/RegisterValidatorHome/components/ImportFile/flows/ValidatorList/ValidatorList.styles';
import { longStringShorten } from '~lib/utils/strings';
import { getBeaconChainLink } from '~root/providers/networkInfo.provider';

const ValidatorSlot = ({ validatorPublicKey, errorMessage, registered, isSelected }: {
  validatorPublicKey: string,
  errorMessage?: string,
  registered?: boolean,
  isSelected: boolean
}) => {
  const classes = useStyles();
  const stores = useStores();
  const notificationsStore: NotificationsStore = stores.Notifications;

  const copyToClipboard = (publicKey: string) => {
    navigator.clipboard.writeText(publicKey);
    notificationsStore.showMessage('Copied to clipboard.', 'success');
  };

  const openBeaconcha = (publicKey: string) => {
    GoogleTagManager.getInstance().sendEvent({
      category: 'external_link',
      action: 'click',
      label: 'Open Beaconcha',
    });
    window.open(`${getBeaconChainLink()}/validator/${publicKey}`);
  };

  return (
    <Grid
      className={`${classes.ValidatorSlotWrapper} ${isSelected && classes.SelectedValidatorSlot} ${errorMessage && classes.ErrorValidatorSlot}`}>
      <Grid className={classes.ValidatorKeyWrapper}>{longStringShorten(validatorPublicKey, 6, 4)}<ImageDiv
        onClick={() => copyToClipboard(validatorPublicKey)} image={'copy'} width={24} height={24}/>
        <ImageDiv onClick={() => openBeaconcha(validatorPublicKey)} image={'beacon'} width={24} height={24}/>
      </Grid>
      {errorMessage && <Grid className={classes.ErrorBadge}>{errorMessage}</Grid>}
      {registered && <Grid className={classes.RegisteredBadge}>Registered</Grid>}
    </Grid>
  );
};

export default ValidatorSlot;
