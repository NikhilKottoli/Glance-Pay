/**
 * Glance Pay — Even Hub G2 app entry point.
 */

import { init } from "./init";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}