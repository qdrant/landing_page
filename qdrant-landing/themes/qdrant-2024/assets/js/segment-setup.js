import * as params from '@params';
import { setSegmentWriteKey } from './segment-helpers';

if (params.segmentWriteKey) {
    setSegmentWriteKey(params.segmentWriteKey);
}