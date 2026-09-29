const DrillingData = require('../models/DrillingData');
const { getRiskPrediction, getRiskExplanation } = require('../utils/mlService');
const { askQuestion } = require('../utils/wellmindService');
const ScenarioSubmission = require('../models/ScenarioSubmission');
const RiskSnapshot = require("../models/RiskSnapshot");

// exports.predictRiskForWell = async (req, res) => {
//   // try {
//   //   const { wellId } = req.params;

//   //   const latestRecord = await DrillingData.findOne({ Well_ID: wellId }).sort({
//   //     Timestamp: -1,
//   //   });

//   //   if (!latestRecord) {
//   //     return res.status(404).json({
//   //       message: 'No drilling data found for this well'
//   //     });
//   //   }
//     console.log('RECORD FROM MONGODB:');
//     console.log({
//       Well_ID: latestRecord.Well_ID,
//       Previous_Mud_Loss_Count: latestRecord.Previous_Mud_Loss_Count,
//       Previous_Stuck_Pipe_Count: latestRecord.Previous_Stuck_Pipe_Count,
//       Previous_Kick_Count: latestRecord.Previous_Kick_Count,
//       Previous_NPT_Count: latestRecord.Previous_NPT_Count,
//       Similar_Well_Risk_Count: latestRecord.Similar_Well_Risk_Count,
//       Kick_Label: latestRecord.Kick_Label,
//       Fishing_Label: latestRecord.Fishing_Label,
//     });

//     const prediction = await getRiskPrediction(latestRecord);

//     console.log('RISK PREDICTION FOR', wellId);
//     console.log(JSON.stringify(prediction, null, 2));

//     res.status(200).json({
//       wellId,
//       timestamp: latestRecord.Timestamp,
//       depth: latestRecord.Depth_MD,
//       formation: latestRecord.Formation,
//       prediction,
//     });

//   // } catch (error) {
//   //   res.status(500).json({
//   //     message: 'Error getting prediction',
//   //     error: error.message,
//   //   });
//   // }
// };

exports.predictRiskForWell = async (req, res) => {
  console.log("🔥 PREDICTION ROUTE HIT:", req.params);
  try {
    const { wellId } = req.params;

    const latestSnapshot = await RiskSnapshot.findOne({ wellId })
      .sort({ timestamp: -1 })
      .lean();

    // if (latestSnapshot) {
    //   return res.status(200).json({
    //     wellId: latestSnapshot.wellId,
    //     depth: latestSnapshot.depth,
    //     risks: latestSnapshot.risks,
    //     level: latestSnapshot.level,
    //     warnings: latestSnapshot.warnings,
    //     recommendation: latestSnapshot.recommendation,
    //     timestamp: latestSnapshot.timestamp,
    //   });
    // }
    if (latestSnapshot) {
  console.log("🔥 SENDING CACHED PREDICTION TO FRONTEND:", {
    wellId: latestSnapshot.wellId,
    depth: latestSnapshot.depth,
    prediction: latestSnapshot.risks,
  });

  return res.status(200).json({
    wellId: latestSnapshot.wellId,
    timestamp: latestSnapshot.timestamp,
    depth: latestSnapshot.depth,
    prediction: latestSnapshot.risks,
    level: latestSnapshot.level,
    warnings: latestSnapshot.warnings,
    recommendation: latestSnapshot.recommendation,
  });
}

    // Fallback: if no RiskSnapshot exists yet, get the latest drilling record
    const latestRecord = await DrillingData.findOne({
      Well_ID: wellId,
    }).sort({
      Timestamp: -1,
    });

    if (!latestRecord) {
      return res.status(404).json({
        message: "No drilling data found for this well",
      });
    }

    console.log("RECORD FROM MONGODB:");
    console.log({
      Well_ID: latestRecord.Well_ID,
      Previous_Mud_Loss_Count: latestRecord.Previous_Mud_Loss_Count,
      Previous_Stuck_Pipe_Count: latestRecord.Previous_Stuck_Pipe_Count,
      Previous_Kick_Count: latestRecord.Previous_Kick_Count,
      Previous_NPT_Count: latestRecord.Previous_NPT_Count,
      Similar_Well_Risk_Count: latestRecord.Similar_Well_Risk_Count,
      Kick_Label: latestRecord.Kick_Label,
      Fishing_Label: latestRecord.Fishing_Label,
    });

    const prediction = await getRiskPrediction(latestRecord);

    // console.log("RISK PREDICTION FOR", wellId);
    // console.log(JSON.stringify(prediction, null, 2));
    // return res.status(200).json({
    //   wellId,
    //   timestamp: latestRecord.Timestamp,
    //   depth: latestRecord.Depth_MD,
    //   formation: latestRecord.Formation,
    //   prediction,
    // });
    console.log("RISK PREDICTION FOR", wellId);
console.log(JSON.stringify(prediction, null, 2));

console.log("🔥 SENDING FALLBACK PREDICTION TO FRONTEND:", {
  wellId,
  depth: latestRecord.Depth_MD,
  prediction,
});

return res.status(200).json({
  wellId,
  timestamp: latestRecord.Timestamp,
  depth: latestRecord.Depth_MD,
  formation: latestRecord.Formation,
  prediction,
});
  } catch (error) {
    console.error("Risk fetch error:", error);

    return res.status(500).json({
      message: "Error fetching risk",
      error: error.message,
    });
  }
};

// @route GET /api/risk/:wellId/explain
// exports.explainRiskForWell = async (req, res) => {
//   try {
//     const { wellId } = req.params;

//     // const latestRecord = await DrillingData.findOne({ Well_ID: wellId }).sort({
//     //   Timestamp: -1,
//     // });

//     // if (!latestRecord) {
//     //   return res.status(404).json({ message: 'No drilling data found for this well' });
//     // }
//     const explanation = await getRiskExplanation(latestRecord);

//     res.status(200).json({
//       wellId,
//       timestamp: latestRecord.Timestamp,
//       depth: latestRecord.Depth_MD,
//       explanation,
//     });
//   // } catch (error) {
//   //   res.status(500).json({
//   //     message: 'Error getting explanation',
//   //     error: error.message,
//   //   });
//   // }
// };

exports.explainRiskForWell = async (req, res) => {
   console.log("🔥 EXPLAIN ROUTE HIT:", req.params);
  try {
    const { wellId } = req.params;

    const latestSnapshot = await RiskSnapshot.findOne({ wellId })
      .sort({ timestamp: -1 });

    if (!latestSnapshot) {
      return res.status(404).json({
        message: "No risk prediction available for this well yet.",
      });
    }

    // if (
    //   latestSnapshot.explanations &&
    //   Object.keys(latestSnapshot.explanations).length > 0
    // ) {
    //   return res.status(200).json(latestSnapshot.explanations);
    // }
    if (
  latestSnapshot.explanations &&
  Object.keys(latestSnapshot.explanations).length > 0
) {
  return res.status(200).json({
    wellId: latestSnapshot.wellId,
    timestamp: latestSnapshot.timestamp,
    depth: latestSnapshot.depth,
    explanation: latestSnapshot.explanations,
  });
}

    // Only call ML if explanation is not already cached
    const latestRecord = await DrillingData.findOne({
      Well_ID: wellId,
    }).sort({
      Timestamp: -1,
    });

    if (!latestRecord) {
      return res.status(404).json({
        message: "No drilling data found for this well",
      });
    }

    const explanation = await getRiskExplanation(latestRecord);

    // Save explanation into the snapshot
    latestSnapshot.explanations = explanation;
    await latestSnapshot.save();

    return res.status(200).json({
       wellId,
  timestamp: latestSnapshot.timestamp,
  depth: latestSnapshot.depth,
  explanation,
    });
  } catch (error) {
    console.error("Risk explanation error:", error);

    return res.status(500).json({
      message: "Error generating risk explanation",
      error: error.message,
    });
  }
};

// @route POST /api/risk/historical-search
exports.searchHistoricalDocuments = async (req, res) => {
  try {
    const { question, wellIds, documentId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }
    console.time('historical-search-duration');
    const result = await askQuestion(question, documentId || null);
    console.timeEnd('historical-search-duration'); 

    res.status(200).json(result);
  } catch (error) {
    console.error("Historical search error:", error.message);
    res.status(500).json({
      message: 'Error searching historical documents via WellMind',
      error: error.message,
    });
  }
};

// @route POST /api/risk/simulate
exports.simulateScenario = async (req, res) => {
  try {
    const record = req.body;

    const [prediction, explanationRes] = await Promise.all([
      getRiskPrediction(record),
      getRiskExplanation(record),
    ]);
    
    // PART 7 FIX: Scenario simulation is strictly for what-if analysis and audit.
    // It MUST NOT store model-generated predictions as ground-truth training labels.
    try {
      await ScenarioSubmission.create({
        scenarioParameters: record,
        prediction,
        explanation: explanationRes,
        simulatedAt: new Date(),
        simulatedBy: req.employee?.employeeName || 'Anonymous',
        usedForTraining: false, // Never used for training
      });
    } catch (saveErr) {
      console.warn('Scenario submission audit logging warning:', saveErr.message);
    }

    res.status(200).json({
      prediction,
      explanation: explanationRes,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error simulating scenario',
      error: error.message,
    });
  }
};

// @route GET /api/risk/:wellId/timeseries
// Returns risk probability for all 5 labels, at multiple depths, for the graph.
// exports.getRiskTimeseries = async (req, res) => {
//   try {
//     const { wellId } = req.params;
//     const snapshots = await RiskSnapshot.find({ wellId })
//       .sort({ depth: 1 })
//       .limit(100)
//       .lean();

//     return res.status(200).json({
//       wellId,
//       data: snapshots.map((snapshot) => ({
//         depth: snapshot.depth,
//         timestamp: snapshot.timestamp,
//         risks: snapshot.risks,
//       })),
//     });
//   } catch (error) {
//     console.error("Risk timeseries error:", error);

//     res.status(500).json({
//       message: "Error building risk timeseries",
//       error: error.message,
//     });
//   }

// };
exports.getRiskTimeseries = async (req, res) => {
  try {
    const { wellId } = req.params;

    const snapshots = await RiskSnapshot.find({ wellId })
      .sort({ depth: 1 })
      .limit(100)
      .lean();

    const depths = snapshots.map((snapshot) => snapshot.depth);

    const series = {
      Mud_Loss_Label: snapshots.map(
        (snapshot) =>
          (snapshot.risks?.Mud_Loss_Label?.probability ?? 0) * 100
      ),

      Stuck_Pipe_Label: snapshots.map(
        (snapshot) =>
          (snapshot.risks?.Stuck_Pipe_Label?.probability ?? 0) * 100
      ),

      Overpressure_Label: snapshots.map(
        (snapshot) =>
          (snapshot.risks?.Overpressure_Label?.probability ?? 0) * 100
      ),

      Torque_Spike_Label: snapshots.map(
        (snapshot) =>
          (snapshot.risks?.Torque_Spike_Label?.probability ?? 0) * 100
      ),

      Cementing_Issue_Label: snapshots.map(
        (snapshot) =>
          (snapshot.risks?.Cementing_Issue_Label?.probability ?? 0) * 100
      ),
    };

    return res.status(200).json({
      wellId,
      depths,
      series,
    });
  } catch (error) {
    console.error("Risk timeseries error:", error);

    return res.status(500).json({
      message: "Error building risk timeseries",
      error: error.message,
    });
  }
};