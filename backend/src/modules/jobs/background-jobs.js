import { env } from "../../config/env.js";
import { releaseExpiredStockReservations } from "../orders/inventory.service.js";
import {
  processSupplierDispatchRetries,
  syncAllConnectedSuppliers,
  syncSupplierOrderStatuses
} from "../suppliers/supplier.service.js";

function scheduleJob(name, intervalMs, task) {
  const run = () => {
    task().catch((err) => {
      console.error(`[job:${name}] failed:`, err.message || err);
    });
  };
  const timer = setInterval(run, intervalMs);
  console.log(`[job:${name}] scheduled every ${Math.round(intervalMs / 60000)} minutes.`);
  return timer;
}

export function startBackgroundJobs() {
  if (!env.backgroundJobsEnabled) {
    console.log("[jobs] disabled by BACKGROUND_JOBS_ENABLED=false");
    return [];
  }

  return [
    scheduleJob("supplier-sync", env.supplierSyncIntervalMs, () => syncAllConnectedSuppliers()),
    scheduleJob("supplier-dispatch-retry", env.supplierRetryIntervalMs, () => processSupplierDispatchRetries({ limit: 25 })),
    scheduleJob("supplier-status-sync", env.supplierStatusSyncIntervalMs, () => syncSupplierOrderStatuses({ limit: 100 })),
    scheduleJob("expired-stock-release", env.expiredStockReleaseIntervalMs, () =>
      releaseExpiredStockReservations({
        olderThanMinutes: env.expiredStockReservationMinutes,
        limit: 100
      })
    )
  ];
}
