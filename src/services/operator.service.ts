import { getStoredNetwork } from '~root/providers/networkInfo.provider';
import { putRequest, getRequest, IHttpResponse } from '~root/services/httpApi.service';
import { IOperator } from '~app/model/operator.model';
import { IPagination } from '~app/model/pagination.model';
import { DEFAULT_PAGINATION } from '~app/common/config/config';

type OperatorsListQuery = {
  page?: number,
  search?: string,
  type?: string[],
  perPage?: number
  ordering?: string,
  dkgEnabled?: boolean,
};

type OperatorValidatorListQuery = {
  page?: number,
  perPage?: number
  operatorId: number,
};

const PERFORMANCE_PERIOD = '24hours';

const getOperatorsByOwnerAddress = async (page: number = 1, perPage: number = 8, ownerAddress: string, skipRetry?: boolean): Promise<{ operators: IOperator[], pagination: IPagination }> => {
  const url = `${getStoredNetwork().api}/operators/owned_by/${ownerAddress}?page=${page}&perPage=${perPage}&withFee=true&ts=${new Date().getTime()}&ordering=id:desc`;
  try {
    return await getRequest(url, skipRetry);
  } catch (e) {
    return { operators: [], pagination: DEFAULT_PAGINATION };
  }
};

const getOperators = async (props: OperatorsListQuery, skipRetry?: boolean) => {
  const { page, perPage, type, ordering, search, dkgEnabled } = props;
  let url = `${getStoredNetwork().api}/operators?`;
  if (search) url += `search=${search}&`;
  if (ordering) url += `ordering=${ordering}&`;
  if (page) url += `page=${page}&`;
  if (perPage) url += `perPage=${perPage}&`;
  if (type?.length) url += `type=${type.join(',')}&`;
  if (dkgEnabled) url += 'has_dkg_address=true&';
  url += `ts=${new Date().getTime()}`;

  try {
    return await getRequest(url, skipRetry);
  } catch (e) {
    return { operators: [], pagination: {} };
  }
};

const getOperator = async (operatorId: number | string, skipRetry?: boolean) => {
  const utcTimestamp = new Date(new Date().toUTCString()).getTime();
  const url = `${getStoredNetwork().api}/operators/${operatorId}?performances=${PERFORMANCE_PERIOD}&withFee=true&ts=${utcTimestamp}`;
  try {
    return await getRequest(url, skipRetry);
  } catch (e) {
    return null;
  }
};

const getOperatorsByIds = async (operatorIds: number[]): Promise<IOperator[]> => {
  try {
    const promises = operatorIds.map(operatorId => getOperator(operatorId, false));
    const responses = await Promise.all(promises);
    for (let response of responses) {
      if (!response) {
        return [];
      }
    }
    return responses;
  } catch (error) {
    return [];
  }
};

const getOperatorByPublicKey = async (publicKey: string, skipRetry: boolean = true) => {
  const url = `${getStoredNetwork().api}/operators/public_key/${publicKey}`;
  try {
    return await getRequest(url, skipRetry);
  } catch (e) {
    return null;
  }
};

const updateOperatorMetadata = async (operatorId: number, signature: string, operatorMetadata: Record<string, any>): Promise<IHttpResponse<IOperator>> => {
  const url = `${getStoredNetwork().api}/operators/${operatorId}/metadata`;
  return await putRequest(url, { ...operatorMetadata, signature });
};

const getOperatorNodes = async (layer: number): Promise<[]> => {
  const url = `${getStoredNetwork().api}/operators/nodes/${layer}`;
  try {
    return await getRequest(url, true);
  } catch (e) {
    return [];
  }
};

const getOperatorAvailableLocations = async (): Promise<[]> => {
  const url = `${getStoredNetwork().api}/operators/locations`;
  try {
    return await getRequest(url, true);
  } catch (e) {
    return [];
  }
};

const getOperatorValidators = async (props: OperatorValidatorListQuery, skipRetry?: boolean) => {
  const { page, perPage, operatorId } = props;
  const url = `${getStoredNetwork().api}/validators/in_operator/${operatorId}?page=${page}&perPage=${perPage}&ts=${new Date().getTime()}`;
  try {
    return await getRequest(url, skipRetry);
  } catch (e) {
    return { validators: [], pagination: {} };
  }
};

export {
  getOperatorsByOwnerAddress,
  getOperator,
  getOperators,
  getOperatorsByIds,
  getOperatorByPublicKey,
  updateOperatorMetadata,
  getOperatorNodes,
  getOperatorAvailableLocations,
  getOperatorValidators,
};

