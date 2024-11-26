import * as params from '@params';
import { setCookie } from './helpers';
import { setSegmentWriteKey } from './segment-helpers';

if (params.segmentWriteKey) {
    setSegmentWriteKey(params.segmentWriteKey);
}

if (params.gaMeasurementId) {
    setCookie('ga_measurement_id', params.gaMeasurementId, 365);
}