import wretch from 'wretch';
import QueryStringAddon from 'wretch/addons/queryString';

export const apiClient = wretch('/api').addon(QueryStringAddon);
