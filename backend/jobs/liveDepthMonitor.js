const DrillingData = require("../models/DrillingData");
const Alert = require("../models/Alert");
const {
  checkAndGenerateWarning,
} = require("../controllers/earlyWarningController");
const RiskSnapshot = require("../models/RiskSnapshot");
const PARAM_BOUNDS = {
  ROP: { min: 5, max: 60, baseline: 25, noise: 1.5, revert: 0.05 },
  WOB: { min: 5, max: 40, baseline: 18, noise: 2, revert: 0.05 },
  RPM: { min: 40, max: 180, baseline: 110, noise: 4, revert: 0.05 },
  Flow_Rate: { min: 200, max: 1200, baseline: 650, noise: 20, revert: 0.04 },
  Mud_Weight: { min: 8.5, max: 16, baseline: 11, noise: 0.02, revert: 0.03 },
  Formation_Pore_Pressure: {
    min: 3000,
    max: 12000,
    baseline: 6500,
    noise: 10,
    revert: 0.03,
  },
};

// Chance per tick of injecting a temporary anomaly (simulated kick/risk event)
const ANOMALY_CHANCE = 0.02; // 2%
const ANOMALY_DURATION_TICKS = 6; // how many ticks the spike lasts before decaying
let anomalyTicksRemaining = 0;
 const processingWells = new Set();
// Mean-reverting random walk: pulls value back toward baseline, adds noise, clamps to bounds
function stepParam(
  current,
  { min, max, baseline, noise, revert },
  extraPull = 0,
) {
  const pull = (baseline - current) * revert;
  const jitter = (Math.random() - 0.5) * noise;
  return Math.min(max, Math.max(min, current + pull + jitter + extraPull));
}

function getActivelyWatchedWellIds(io) {
  const rooms = io.sockets.adapter.rooms;
  const wellIds = [];
  for (const roomName of rooms.keys()) {
    if (roomName.startsWith("well:")) {
      wellIds.push(roomName.replace("well:", ""));
    }
  }
  return wellIds;
}

module.exports = (io) => {
  setInterval(async () => {
    const watchedWellIds = getActivelyWatchedWellIds(io);
    console.log("Watched wells:", watchedWellIds);

    if (watchedWellIds.length === 0) {
      return; // nobody is looking at a dashboard right now — skip this tick entirely
    }

    for (const wellId of watchedWellIds) {
       if (processingWells.has(wellId)) {
    console.log(`Skipping ${wellId}: previous tick still processing`);
    continue;
  }

  processingWells.add(wellId);
      try {
        const latest = await DrillingData.findOne({ Well_ID: wellId }).sort({
          Timestamp: -1,
        });
        if (!latest) continue;
        const nextDepth = Number(latest.Depth_MD) + 5;
        console.log(
          `Depth update ${wellId}: ${latest.Depth_MD} -> ${nextDepth}`,
        );

        const newRecord = latest.toObject();

        delete newRecord._id;
        delete newRecord.__v;

        newRecord.Depth_MD = nextDepth;
        newRecord.Timestamp = new Date();
        if (anomalyTicksRemaining === 0 && Math.random() < ANOMALY_CHANCE) {
          anomalyTicksRemaining = ANOMALY_DURATION_TICKS;
        }

        const anomalyActive = anomalyTicksRemaining > 0;
        const anomalyStrength = anomalyActive
          ? anomalyTicksRemaining / ANOMALY_DURATION_TICKS
          : 0;

        newRecord.RPM = stepParam(newRecord.RPM, PARAM_BOUNDS.RPM);
        newRecord.WOB = stepParam(newRecord.WOB, PARAM_BOUNDS.WOB);
        newRecord.ROP = stepParam(newRecord.ROP, PARAM_BOUNDS.ROP);

        const baseTorque = newRecord.WOB * 8 + newRecord.RPM * 3;
        newRecord.Torque = Math.max(1, baseTorque + (Math.random() - 0.5) * 10);

        newRecord.Flow_Rate = stepParam(
          newRecord.Flow_Rate,
          PARAM_BOUNDS.Flow_Rate,
        );

        const basePressure = newRecord.Flow_Rate * 2.5;

        newRecord.Standpipe_Pressure = Math.max(
          1,
          basePressure + (Math.random() - 0.5) * 20,
        );

        newRecord.Mud_Weight = stepParam(
          newRecord.Mud_Weight,
          PARAM_BOUNDS.Mud_Weight,
        );

        newRecord.Formation_Pore_Pressure = stepParam(
          newRecord.Formation_Pore_Pressure,
          PARAM_BOUNDS.Formation_Pore_Pressure,
          anomalyStrength * 2000,
        );

        if (anomalyTicksRemaining > 0) {
          anomalyTicksRemaining--;
        }

        const createdRecord = await DrillingData.create(newRecord);

        console.log(
          `SAVED ${wellId}:`,
          createdRecord.Depth_MD,
          createdRecord.Timestamp,
          createdRecord._id,
        );

        const saved = await DrillingData.findById(createdRecord._id);

        console.log(
          `READ BACK ${wellId}:`,
          saved?.Depth_MD,
          saved?.Timestamp,
          saved?._id,
        );
        const result = await checkAndGenerateWarning(wellId);

        const riskSnapshot = await RiskSnapshot.create({
  wellId: result.wellId,
  depth: result.depth,
  timestamp: new Date(),
  risks: result.risks,
  level: result.level,
  warnings: result.warnings,
  recommendation: result.recommendation,
});

console.log(
  `RISK SNAPSHOT SAVED ${wellId}:`,
  riskSnapshot.depth,
  riskSnapshot.timestamp
);

        console.log("Risk level:", result.level);

        // Only emit to sockets watching THIS well, not everyone.
        io.to(`well:${wellId}`).emit("drilling-update", {
          wellId: result.wellId,
          depth: result.depth,
          risks: result.risks,
          level: result.level,
          warnings: result.warnings,
          historicalEvents: result.historical_events || [],
          recommendation: result.recommendation,
          updatedAt: new Date(),
        });

        if (result.level === "HIGH" || result.level === "MEDIUM") {
          // PART 16 FIX: Deduplicate alerts. If an unread alert of the same severity
          // exists within the last 10 minutes, update its depth & warnings instead of spamming.
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          const existingAlert = await Alert.findOne({
            wellId: result.wellId,
            level: result.level,
            read: false,
            createdAt: { $gte: tenMinutesAgo },
          }).sort({ createdAt: -1 });

          if (existingAlert) {
            existingAlert.depth = result.depth;
            existingAlert.warnings = result.warnings;
            existingAlert.recommendation = result.recommendation;
            existingAlert.historicalEvents = result.historical_events || [];
            await existingAlert.save();
            console.log(
              `ℹ️ Deduplicated active alert updated for ${wellId}: ${result.level} at depth ${result.depth}`
            );
          } else {
            const alert = await Alert.create({
              wellId: result.wellId,
              depth: result.depth,
              level: result.level,
              warnings: result.warnings,
              historicalEvents: result.historical_events || [],
              recommendation: result.recommendation,
            });

            io.to(`well:${wellId}`).emit("new-alert", alert);
            console.log(
              `🚨 New alert created and pushed for ${wellId}: ${result.level} at depth ${result.depth}`
            );
          }
        }
      } catch (err) {
        console.error(`Live monitor error for well ${wellId}:`, err.message);
      }finally{
        processingWells.delete(wellId);
      }
    }
  }, 30000);
};
