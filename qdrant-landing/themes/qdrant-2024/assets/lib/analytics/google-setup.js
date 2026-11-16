import * as params from '@params';
import { setCookie } from './tracking-helpers';

if (params.gaMeasurementId) {
    setCookie('ga_measurement_id', params.gaMeasurementId, 365);
}
