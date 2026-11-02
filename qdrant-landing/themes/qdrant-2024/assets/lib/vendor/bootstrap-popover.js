// Third-party: Bootstrap Popover (bundles Popper), exposed as window.bootstrap.Popover
// for code-blocks/copy-code.js and each part's js/copy-markdown.js.
import Popover from 'bootstrap/js/src/popover.js';

window.bootstrap = Object.assign(window.bootstrap || {}, { Popover });
