import React, { useEffect, useRef, useState } from 'react';
import _ from 'underscore';
import { observer } from 'mobx-react';
import debounce from 'lodash/debounce';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import { useStores } from '~app/hooks/useStores';
import Status from '~app/components/common/Status';
import ToolTip from '~app/components/common/ToolTip';
import { equalsAddresses } from '~lib/utils/strings';
import Checkbox from '~app/components/common/CheckBox';
import TextInput from '~app/components/common/TextInput';
import config, { translations } from '~app/common/config';
import BorderScreen from '~app/components/common/BorderScreen';
import { formatNumberToUi, roundNumber } from '~lib/utils/numbers';
import GoogleTagManager from '~lib/analytics/GoogleTag/GoogleTagManager';
import WalletStore from '~app/common/stores/applications/SsvWeb/Wallet.store';
import OperatorStore from '~app/common/stores/applications/SsvWeb/Operator.store';
import Filters
  from '~app/components/applications/SSV/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/components/Filters';
import {
  useStyles,
} from '~app/components/applications/SSV/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/FirstSquare.styles';
import StyledCell
  from '~app/components/applications/SSV/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/components/StyledCell';
import OperatorDetails
  from '~app/components/applications/SSV/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/components/OperatorDetails';
import ClusterSize
  from '~app/components/applications/SSV/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/components/ClusterSize/ClusterSize';
import MevCounterBadge
  from '~app/components/applications/SSV/RegisterValidatorHome/components/SelectOperators/components/FirstSquare/components/MevBadge/MevCounterBadge';
import { fromWei, getFeeForYear } from '~root/services/conversions.service';
import { IOperator } from '~app/model/operator.model';
import { getOperators as getOperatorsOperatorService } from '~root/services/operator.service';
import { DEFAULT_PAGINATION } from '~app/common/config/config';

const FirstSquare = ({ editPage, clusterSize, setClusterSize, clusterBox }: {
  editPage: boolean,
  clusterSize: number,
  setClusterSize: Function,
  clusterBox: number[]
}) => {
  const stores = useStores();
  const [loading, setLoading] = useState(false);
  const classes = useStyles({ loading });
  const wrapperRef = useRef(null);
  const scrollRef: any = useRef(null);
  const walletStore: WalletStore = stores.Wallet;
  const [sortBy, setSortBy] = useState('');
  const operatorStore: OperatorStore = stores.Operator;
  const [filterBy, setFilterBy] = useState([]);
  const [sortOrder, setSortOrder] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [operatorsData, setOperatorsData]: [any[], any] = useState([]);
  const [operatorsPagination, setOperatorsPagination] = useState(DEFAULT_PAGINATION);
  const [dkgEnabled, selectDkgEnabled] = useState(false);

  const headers = [
    { type: '', displayName: '' },
    { type: 'name', displayName: 'Name', sortable: false },
    { type: 'validators_count', displayName: 'Validators', sortable: true },
    { type: 'performance.30d', displayName: '30d performance', sortable: true },
    { type: 'fee', displayName: 'Yearly Fee', sortable: true },
    { type: 'mev', displayName: 'MEV', sortable: true },
    { type: '', displayName: '', sortable: true },
  ];

  const getOperators = async (page: number) => {
    if (page > operatorsPagination.pages && operatorsPagination.pages !== 0) return;
    const ordering: string = `${sortBy ? `${sortBy}:${sortOrder}` : 'id:asc'}`;

    const payload = {
      page,
      ordering,
      dkgEnabled,
      perPage: 10,
      type: filterBy,
      search: searchInput,
    };

    const response = await getOperatorsOperatorService(payload);
    if (response?.pagination?.page > 1) {
      const operatorListInString = operatorsData.map(operator => operator.id);
      const operators = response.operators.filter((operator: any) => !operatorListInString.includes(operator.id));
      setOperatorsData([...operatorsData, ...operators]);
    } else {
      setOperatorsData(response.operators);
    }
    setOperatorsPagination(response.pagination);
  };

  const selectOperator = (e: any, operator: IOperator) => {
    // @ts-ignore
    if (wrapperRef.current?.isEqualNode(e.target)) return;
    if (operatorStore.isOperatorSelected(operator.id)) {
      operatorStore.unselectOperatorByPublicKey(operator);
      return;
    }
    const indexes = clusterBox;
    let availableIndex: undefined | number;
    indexes.forEach((index: number) => {
      if (!operatorStore.selectedOperators[index] && !availableIndex) {
        availableIndex = index;
      }
    });
    if (availableIndex) {
      operatorStore.selectOperator(operator, availableIndex, clusterBox);
    }
  };

  const redirectTo = (publicKey: string) => {
    GoogleTagManager.getInstance().sendEvent({
      category: 'explorer_link',
      action: 'click',
      label: 'operator',
    });
    window.open(`${config.links.EXPLORER_URL}/operators/${publicKey}`, '_blank');
  };

  const sortHandler = (sortType: string) => {
    if (sortBy === sortType && sortOrder === 'asc') {
      setSortBy('');
      setSortOrder('desc');
    } else if (sortBy === sortType && sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      GoogleTagManager.getInstance().sendEvent({
        category: 'validator_register',
        action: 'sort',
        label: sortType,
      });
      setSortBy(sortType);
      setSortOrder('desc');
    }
  };

  const dataRows = () => {
    if (operatorsData?.length === 0 && !loading) {
      return (
        <TableRow hover>
          <StyledCell className={classes.NoRecordsWrapper}>
            <Grid container>
              <Grid item xs={12} className={classes.NoRecordImage}/>
              <Grid item xs={12} className={classes.NoRecordsText}>No results found</Grid>
              <Grid item xs={12} className={classes.NoRecordsText}>Please try different keyword or filter</Grid>
            </Grid>
          </StyledCell>
        </TableRow>
      );
    }

    return operatorsData.map((operator) => {
      const isDeleted = operator.is_deleted;
      const hasValidators = operator.validators_count !== 0;
      const isSelected = operatorStore.isOperatorSelected(operator.id);
      const reachedMaxValidators = operatorStore.hasOperatorReachedValidatorLimit(operator.validators_count);
      const isPrivateOperator = operator.address_whitelist && operator.address_whitelist !== config.GLOBAL_VARIABLE.DEFAULT_ADDRESS_WHITELIST && !equalsAddresses(operator.address_whitelist, walletStore.accountAddress);
      const disabled = isDeleted || isPrivateOperator;
      const disableCheckBoxes = operatorStore.selectedEnoughOperators;
      const isInactive = operator.is_active < 1;
      const mevRelays = operator?.mev_relays || '';
      const mevRelaysCount = mevRelays ? mevRelays.split(',').filter((item: string) => item).length : 0;

      return (
        <TableRow
          key={Math.floor(Math.random() * 10000000)}
          className={`${classes.RowWrapper} ${isSelected ? classes.Selected : ''} ${disabled ? classes.RowDisabled : ''}`}
          onClick={(e) => {
            !disabled && selectOperator(e, operator);
          }}
        >
          <StyledCell style={{ paddingLeft: 20, width: 60, paddingTop: 35 }}>
            <Checkbox disable={disableCheckBoxes && !isSelected || disabled} grayBackGround text={''}
                      isChecked={isSelected}/>
          </StyledCell>
          <StyledCell>
            <OperatorDetails nameFontSize={14} idFontSize={12} logoSize={24} withoutExplorer operator={operator}/>
          </StyledCell>
          <StyledCell>
            <Grid container>
              <Grid item>{operator.validators_count}</Grid>
              {reachedMaxValidators && (
                <Grid item style={{ alignSelf: 'center', marginLeft: 4 }}>
                  <ToolTip text={'Operator reached  maximum amount of validators'}/>
                </Grid>
              )}
            </Grid>
          </StyledCell>
          <StyledCell>
            <Grid container>
              <Grid item
                    className={hasValidators && isInactive ? classes.Inactive : ''}>{roundNumber(operator.performance['30d'], 2)}%</Grid>
              {isInactive && (
                <Grid item xs={12}>
                  <Status item={operator}/>
                </Grid>
              )}
            </Grid>
          </StyledCell>
          <StyledCell>
            <Grid container>
              <Grid item
                    className={classes.FeeColumn}>{formatNumberToUi(getFeeForYear(fromWei(operator.fee)))} SSV</Grid>
            </Grid>
          </StyledCell>
          <StyledCell>
            <Grid container>
              <MevCounterBadge mevRelaysList={mevRelays.split(',')} mevCount={mevRelaysCount}/>
            </Grid>
          </StyledCell>
          <StyledCell>
            <Grid ref={wrapperRef} className={classes.ChartIcon} onClick={() => {
              redirectTo(operator.id);
            }}/>
          </StyledCell>
        </TableRow>
      );
    });
  };

  const updateValue = _.debounce(() => {
    if (loading) return;
    if (operatorsPagination.page <= operatorsPagination.pages) {
      const newPagination = Object.create(operatorsPagination);
      newPagination.page += 1;
      setOperatorsPagination(newPagination);
    }
  }, 200);

  const handleScroll = (event: any) => {
    const element = event.target;
    if (loading) return;
    if (element.scrollTop + element.offsetHeight > element.scrollHeight * 0.80) {
      updateValue();
    }
  };

  const inputHandler = debounce((e: any) => {
    const userInput = e.target.value.trim();
    if (userInput.length >= 1 || userInput.length === 0) {
      GoogleTagManager.getInstance().sendEvent({
        category: 'validator_register',
        action: 'search',
        label: userInput,
      });
      setSearchInput(userInput);
    }
  }, 1000);

  const rows: any = dataRows();

  useEffect(() => {
  }, [JSON.stringify(operatorStore.selectedOperators)]);

  useEffect(() => {
    setLoading(true);
    getOperators(1).then(() => {
      setLoading(false);
      scrollRef.current.scrollTop = 0;
    });
  }, [searchInput, sortBy, sortOrder, filterBy]);

  useEffect(() => {
    getOperators(operatorsPagination.page).then(async () => {
      await operatorStore.updateOperatorValidatorsLimit();
    });
  }, [operatorsPagination.page]);

  return (
    <BorderScreen
      blackHeader
      withConversion
      withoutNavigation={editPage}
      wrapperClass={classes.ScreenWrapper}
      wrapperHeight={791}
      header={translations.VALIDATOR.SELECT_OPERATORS.TITLE}
      body={[
        <Grid container>
          <ClusterSize currentClusterSize={clusterSize} changeClusterSize={setClusterSize}/>
          <Grid item container>
            <Grid item xs className={classes.SearchInputWrapper}>
              <TextInput
                withSideText
                placeHolder={'Search...'}
                onChangeCallback={inputHandler}
                sideIcon={loading ? <CircularProgress size={25} className={classes.Loading}/> :
                  <div className={classes.SearchIcon}/>}
              />
            </Grid>
            <Filters setFilterBy={setFilterBy} dkgEnabled={dkgEnabled} selectDkgEnabled={selectDkgEnabled}/>
          </Grid>
          <TableContainer className={classes.OperatorsTable} ref={scrollRef} onScroll={handleScroll}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {rows.length > 0 && headers.map((header: any, index: number) => {
                    const sortByType = sortBy === header.type;
                    const ascending = sortOrder === 'asc';
                    const descending = sortOrder === 'desc';
                    let headerClasses = classes.SortArrow;

                    if (sortByType) {
                      if (ascending) headerClasses += ` ${classes.ArrowDown}`;
                      if (descending) headerClasses += ` ${classes.ArrowUp}`;
                    }

                    return (
                      <StyledCell key={index} className={classes.HeaderWrapper}>
                        <Grid container onClick={() => header.sortable && sortHandler(header.type)}>
                          <Grid item>{header.displayName}</Grid>
                          {header.sortable && header.displayName !== '' && (
                            <Grid
                              item
                              className={headerClasses}
                            />
                          )}
                        </Grid>
                      </StyledCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>,
      ]}
    />
  );
};

export default observer(FirstSquare);
