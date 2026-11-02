// Third-party: Bootstrap Popover (bundles Popper), exposed as window.bootstrap.Popover
// for each part's js/copy-code.js and js/copy-markdown.js.
import Popover from 'bootstrap/js/src/popover.js';

window.bootstrap = Object.assign(window.bootstrap || {}, { Popover });
