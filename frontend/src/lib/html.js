/**
 * html tagged template - binds htm to React.createElement
 *
 * Ensures a single React instance is used across the entire app.
 * Avoids the dual-React-instance bug when using htm/react from esm.sh.
 */

import htm from 'htm';
import { createElement } from 'react';

export const html = htm.bind(createElement);
