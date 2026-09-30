import api from "./client";
const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));
export async function loginUser({ employeeId, password, role }) {
  await delay();
  if (!employeeId || !password) {
    throw new Error("Employee ID and password are required.");
  }
  return {
    token: "mock-jwt-token",
    user: {
      id: "u-1001",
      name: "Rohit Gogoi",
      employeeId,
      role,
      directorate: "Drilling Engineering Directorate, Duliajan",
    },
  };
}
export async function registerUser({ employeeId, fullName, password }) {
  await delay();
  if (!employeeId || !fullName || !password) {
    throw new Error("All fields are required.");
  }
  return { message: "Registration submitted for HR verification." };
}
export async function loginWithGoogle() {
  await delay();
  return {
    token: "mock-google-jwt",
    user: {
      id: "u-1002",
      name: "Priyanka Sharma",
      employeeId: "OIL-DRL-3312",
      role: "field",
      directorate: "Drilling Engineering Directorate, Duliajan",
    },
  };
}

// WELLS
const MOCK_WELLS = [
  { id: "DKM-114", name: "Dikom-114", formation: "Barail Group", block: "AA-ONN-2010/9", status: "active" },
  { id: "DKM-098", name: "Dikom-098", formation: "Barail Group", block: "AA-ONN-2010/9", status: "active" },
  { id: "DKM-102", name: "Dikom-102", formation: "Barail Group", block: "AA-ONN-2010/9", status: "suspended" },
  { id: "DKM-071", name: "Dikom-071", formation: "Barail Group", block: "Adjacent Block", status: "active" },
];

// GET /api/wells?search=<query>
//   -> [{ id, name, formation, block, status }]
export async function searchWells(query = "") {
  await delay(300);
  const q = query.toLowerCase();
  return MOCK_WELLS.filter((w) => w.id.toLowerCase().includes(q) || q === "");
}

// POST /api/wells   { id, name, formation, block, latitude, longitude, spudDate, status, targetDepth }
//   -> { well }
export async function createWell(payload) {
  await delay(500);
  return { well: { ...payload, status: payload.status || "Planned" } };
}

// GET /api/wells/:id
//   -> { id, name, formation, block, latitude, longitude, spudDate, targetDepth,
//        currentDepth, status, rig, casingProgram, mudType }
export async function getWellDetails(id) {
  await delay(300);
  return {
    id,
    name: "Dikom-114",
    formation: "Barail Group",
    block: "AA-ONN-2010/9",
    latitude: "27.4728° N",
    longitude: "95.3372° E",
    spudDate: "02 Jan 2024",
    targetDepth: "3,200 m",
    currentDepth: "2,760 m",
    status: "Drilling — Active",
    rig: "OIL Rig-14",
    casingProgram: '20" x 13⅜" x 9⅝" x 7"',
    mudType: "Water-based, 1.42 SG",
  };
}
export async function getWellRisks(id) {
  await delay(400);
  return {
    earlyWarning: {
      title: "Real-Time Alert: Approaching high-risk zone at 2,840 m",
      body: "3 offset wells (DKM-098, DKM-102, DKM-071) recorded mud loss events between 2,800–2,900 m in this formation. Current depth: 2,760 m. Recommend reviewing mud weight program before proceeding.",
    },
    mudLoss: {
      score: 78,
      level: "high",
      desc: "Fractured limestone zone historically associated with partial-to-severe losses.",
      why: [
        "DKM-098 lost 42 bbl/hr at 2,865 m — treated with LCM pill",
        "DKM-102 experienced partial loss at 2,810 m",
        "Formation logs show high fracture density in this interval",
      ],
    },
    stuckPipe: {
      score: 52,
      level: "med",
      desc: "Moderate differential sticking potential due to overbalance in this section.",
      why: [
        "DKM-071: stuck pipe, freed after spotting pipe-lax pill",
        "Current overbalance: +180 psi",
      ],
    },
    kick: {
      score: 21,
      level: "low",
      desc: "Current mud weight maintains adequate margin over pore pressure.",
      why: [
        "No overpressure events recorded in offset wells within this formation above 3,000 m",
        "Margin currently 0.35 SG above estimated pore pressure",
      ],
    },
    liveParams: {
      depth: "2,760 m",
      rop: "18.4 m/hr",
      wob: "12.6 klbs",
      mudWeight: "1.42 SG",
      standpipePressure: "2,340 psi",
      flowRate: "2,850 lpm",
    },
  };
}

// GET /api/wells/:id/risk-timeseries   (office dashboard real-time graph)
//   -> { depths: [numbers], mudLoss: [numbers 0-100], stuckPipe: [...], kick: [...] }
export async function getRiskTimeseries(id) {
  await delay(400);
  return {
    depths: [2400, 2500, 2600, 2700, 2760],
    mudLoss: [25, 32, 45, 62, 78],
    stuckPipe: [10, 18, 28, 40, 52],
    kick: [5, 6, 7, 9, 21],
  };
}
export async function getNearbyWells(id, radiusKm = 8) {
  await delay(350);
  return [
    { id: "DKM-114", status: "Drilling — Active", formation: "Barail Group", x: 50, y: 50, isActiveWell: true,
      fieldSummary: "No major NPT recorded yet on this well.",
      officeSummary: "Currently being drilled by Rohit Gogoi's crew. No major NPT recorded yet." },
    { id: "DKM-098", status: "Completed", formation: "Barail Group", x: 36, y: 34,
      fieldSummary: "Faced mud loss (42 bbl/hr) at 2,865 m — sealed with LCM pill at 1.48 SG within 90 min.",
      officeSummary: "Last worked by Anupam Baruah. Faced mud loss at 2,865 m; sealed with LCM pill." },
    { id: "DKM-102", status: "Suspended", formation: "Barail Group", x: 68, y: 41,
      fieldSummary: "Partial mud loss at 2,810 m — resolved by reducing flow rate and pulling back 30 m.",
      officeSummary: "Last worked by Priyanka Sharma. Partial mud loss at 2,810 m; flow rate reduced." },
    { id: "DKM-071", status: "Completed", formation: "Barail Group", x: 60, y: 70,
      fieldSummary: "Differential sticking at 2,790 m — freed using pipe-lax pill after 6 hours.",
      officeSummary: "Last worked by Priyanka Sharma. Stuck pipe at 2,790 m; freed with pipe-lax pill." },
    { id: "DKM-085", status: "Suspended", formation: "Barail Group", x: 30, y: 66,
      fieldSummary: "No major operational events recorded.",
      officeSummary: "Last worked by Manoj Dutta. No major NPT recorded." },
    { id: "DKM-090", status: "Completed", formation: "Barail Group", x: 80, y: 59,
      fieldSummary: "Kick observed at 3,100 m — controlled via BOP shut-in and mud weight increase.",
      officeSummary: "Last worked by Anupam Baruah. Kick at 3,100 m; controlled via BOP shut-in." },
  ];
}

// SIMILAR WELLS
// GET /api/wells/:id/similar
//   -> [{ id, similarityPct, formation, block, targetDepth, tags: [strings],
//          pastEvents: [{ date, problem, solution }] }]
export async function getSimilarWells(id) {
  await delay(400);
  return [
    {
      id: "DKM-098", similarityPct: 94, formation: "Barail Group", block: "AA-ONN-2010/9", targetDepth: "3,180 m",
      tags: ["Same formation", "Same block", "Mud loss history"],
      pastEvents: [
        { date: "14 Mar 2024", problem: "Mud loss — 42 bbl/hr at 2,865 m", solution: "Sealed with calcium-carbonate LCM pill at 1.48 SG within 90 min." },
        { date: "02 Feb 2024", problem: "Torque spike in shale interval", solution: "Reduced RPM by 15%, adjusted lubricity additives." },
      ],
    },
    {
      id: "DKM-102", similarityPct: 88, formation: "Barail Group", block: "AA-ONN-2010/9", targetDepth: "3,240 m",
      tags: ["Same formation", "Similar trajectory"],
      pastEvents: [
        { date: "29 Jan 2024", problem: "Partial mud loss at 2,810 m", solution: "Reduced flow rate, pulled back 30 m before resuming." },
      ],
    },
    {
      id: "DKM-071", similarityPct: 81, formation: "Barail Group", block: "Adjacent Block", targetDepth: "3,050 m",
      tags: ["Same formation", "Stuck pipe history"],
      pastEvents: [
        { date: "02 Apr 2024", problem: "Differential sticking at 2,790 m", solution: "Spotted pipe-lax pill; freed after 6 hours." },
      ],
    },
  ];
}

// KNOWLEDGE REPOSITORY (NLP + OCR document search / chatbot)
// POST /api/knowledge/query   { wellId, question }
//   -> { answer, sources: [{ type: "DDR"|"WCR", ref: string }] }
export async function askKnowledgeRepository({ wellId, question }) {
  await delay(600);
  return {
    answer:
      "Based on offset well records for this formation, similar events were resolved by adjusting mud weight and monitoring standpipe pressure closely during the affected interval.",
    sources: [
      { type: "DDR", ref: "DKM-071, Day 41" },
      { type: "WCR", ref: "DKM-090, §5.1" },
    ],
  };
}

// POST /api/knowledge/upload   multipart/form-data { file, wellId }
//   -> { fileName, indexedEventsCount }
export async function uploadDocument(file, wellId) {
  await delay(900);
  return { fileName: file?.name || "DKM-114_WCR_Section7.pdf", indexedEventsCount: 14 };
}

// DECISION LOG (field user)
// POST /api/wells/:id/decision-log   { depth, problem, solution, category, date, employeeId }
//   -> { message }
export async function submitDecisionLog(wellId, payload) {
  await delay(500);
  return { message: "Decision logged — this will improve future risk predictions for this formation." };
}

// CONTRIBUTORS (office user)
// GET /api/wells/:id/contributors
//   -> [{ name, initials, date, problem, solution }]
export async function getContributors(id) {
  await delay(350);
  return [
    { name: "Anupam Baruah", initials: "AB", date: "14 Mar 2024", problem: "Mud loss encountered at 2,865 m in fractured limestone.", solution: "Pumped calcium-carbonate LCM pill at 1.48 SG; losses sealed within 90 minutes." },
    { name: "Priyanka Sharma", initials: "PS", date: "02 Apr 2024", problem: "Differential sticking of drill string at 2,790 m.", solution: "Spotted pipe-lax pill, worked string free after 6 hours." },
    { name: "Manoj Dutta", initials: "MD", date: "19 May 2024", problem: "Torque spikes while drilling through interbedded shale.", solution: "Adjusted mud lubricity additives and reduced RPM by 15%." },
  ];
}
// ACCOUNT
// GET /api/users/me
const getApiBase = () => {
  let raw = String(import.meta.env.VITE_API_URL || "http://localhost:5000").trim();
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    raw = `https://${raw}`;
  }
  raw = raw.replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

//   -> { name, employeeId, role, directorate, stats: { wellsCount, logsCount, yearsOfService } }
export const getMyAccount = async () => {
  const token = localStorage.getItem("nwis-token");

  const response = await fetch(
    `${getApiBase()}/account/me`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch account");
  }

  return data;
};

export const updateMyAccount = async (data) => {
  const token = localStorage.getItem("nwis-token");

  const response = await fetch(
    `${getApiBase()}/account/me`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update account");
  }

  return result;
};