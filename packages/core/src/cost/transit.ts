/**
 * Transit planning estimates for route pages (cost-model-v1 companion). Pure arithmetic over two
 * stated planning assumptions, never a promise about a delivery window: the delivery spread on an
 * interstate move is whatever the bill of lading says.
 *
 *   drivingDistanceFactor  straight-line (haversine) miles × 1.18 ≈ road miles. The factor is the
 *                          model's own planning assumption and every page that uses it says so.
 *   milesPerDrivingDay     up to 500 road miles per driving day (a planning assumption);
 *                          loading and unloading days are not included.
 */
import { isStateCode } from "../geo";

export interface TransitModelConfig {
  drivingDistanceFactor: number;
  milesPerDrivingDay: number;
}

export const TRANSIT_MODEL_V1: Readonly<TransitModelConfig> = Object.freeze({
  drivingDistanceFactor: 1.18,
  milesPerDrivingDay: 500,
});

export const TRANSIT_MODEL_VERSION = "transit-model-v1";

export interface TransitEstimate {
  /** Straight-line miles as passed in. */
  straightMiles: number;
  /** Estimated road miles (straightMiles × factor), rounded to whole miles. */
  drivingMiles: number;
  /** Whole driving days at up to milesPerDrivingDay; at least 1 for any move over 0 miles. */
  drivingDays: number;
  version: string;
}

export function estimateTransit(straightMiles: number, config: TransitModelConfig = TRANSIT_MODEL_V1): TransitEstimate {
  if (!Number.isFinite(straightMiles) || straightMiles < 0) throw new RangeError(`straightMiles must be a non-negative number, got ${straightMiles}`);
  const drivingMiles = Math.round(straightMiles * config.drivingDistanceFactor);
  const drivingDays = drivingMiles === 0 ? 0 : Math.max(1, Math.ceil(drivingMiles / config.milesPerDrivingDay));
  return { straightMiles, drivingMiles, drivingDays, version: TRANSIT_MODEL_VERSION };
}

/** The generic road model is supported only when both endpoints are in the contiguous US/DC.
 * AK/HI need mode-specific routing; same-state endpoints do not prove a road connection.
 */
export function estimateRoadTransit(straightMiles: number, originState: string, destinationState: string): TransitEstimate | null {
  if (!isStateCode(originState) || !isStateCode(destinationState) || [originState, destinationState].some((state) => state === "AK" || state === "HI")) return null;
  return estimateTransit(straightMiles);
}
