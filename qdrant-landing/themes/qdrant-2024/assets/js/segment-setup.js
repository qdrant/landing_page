import * as params from '@params';
import { setSegmentWriteKey } from './segment-helpers';

if (params.SEGMENT_WRITE_KEY) {
    setSegmentWriteKey(params.SEGMENT_WRITE_KEY);
}