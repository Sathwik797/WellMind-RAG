// Maps ML risk labels to human-friendly names.
export const RISK_LABELS = {
  Mud_Loss_Label: { title: "Mud Loss Risk", short: "Mud Loss" },
  Stuck_Pipe_Label: { title: "Stuck Pipe Risk", short: "Stuck Pipe" },
  Overpressure_Label: { title: "Overpressure Risk", short: "Overpressure" },
  Torque_Spike_Label: { title: "Torque Spike Risk", short: "Torque Spike" },
  Cementing_Issue_Label: { title: "Cementing Issue Risk", short: "Cementing Issue" },
};

// Maps raw feature names to a plain-language description of what they mean.
export const FEATURE_INFO = {
  Flow_Rate: "how fast drilling mud is being pumped into the well",
  ROP: "Rate of Penetration — how fast the drill bit is cutting through rock",
  WOB: "Weight on Bit — downward force applied to the drill bit",
  Mud_Weight: "the density (thickness) of the drilling mud",
  Similar_Well_Risk_Count: "how many nearby wells had this same problem before",
  Torque: "the rotational force needed to turn the drill string",
  Standpipe_Pressure: "the pressure of mud being pumped down the pipe",
  Formation_Pore_Pressure: "the natural pressure inside the rock formation",
  Reservoir_Pressure: "the pressure inside the oil/gas reservoir",
  Previous_Mud_Loss_Count: "how many times mud loss happened before in this well",
  Previous_Stuck_Pipe_Count: "how many times stuck pipe happened before in this well",
  Yield_Point: "how resistant the mud is to starting to flow",
  Depth_TVD: "the true vertical depth of the well",
  Depth_MD: "the measured depth along the wellbore path",
  Hook_Load: "the weight currently held by the rig's hook",
  Inclination: "how much the wellbore is angled/tilted from vertical",
};

function prettyFeatureName(feature) {
  return feature.replace(/_/g, " ");
}

// Converts one SHAP entry into a plain-English sentence.
export function explainFactor(feature, shapValue) {
  const desc = FEATURE_INFO[feature] || "this drilling parameter";
  const direction = shapValue > 0 ? "increasing" : "decreasing";
  const magnitude = Math.abs(shapValue) > 2 ? "strongly" : Math.abs(shapValue) > 1 ? "moderately" : "slightly";
  return {
    label: prettyFeatureName(feature),
    sentence: `${prettyFeatureName(feature)} — ${desc} — is ${magnitude} ${direction} this risk.`,
    direction,
  };
}

// Turns a probability (0-1) into a risk level for card coloring.
export function getRiskLevel(probability) {
  if (probability >= 0.6) return "high";
  if (probability >= 0.3) return "med";
  return "low";
}