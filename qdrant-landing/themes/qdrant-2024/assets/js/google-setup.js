import * as params from '@params';
import { setCookie } from './helpers';

if (params.gaMeasurementId) {
    setCookie('ga_measurement_id', params.gaMeasurementId, 365);
}
