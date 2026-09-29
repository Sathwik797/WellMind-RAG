const Well = require('../models/Well');
const getFormationByDepth = require('../utils/formationHelper');
const DecisionLog = require('../models/DecisionLog');
const Event = require('../models/Event');

// @route GET /api/wells/nearby?lat=26.11&lng=82.66&radius=20
exports.getNearbyWells = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res.status(400).json({
        message: 'lat, lng and radius are required (radius in km)',
      });
    }

    const radiusInMeters = parseFloat(radius) * 1000; // convert km to meters
     const isOffice = req.employee?.role === 'office';

    let nearbyWells = await Well.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select('wellId wellName location wellType status');
    
    if (isOffice) {
      // NEW — attach "last activity" per well, office-only
      nearbyWells = await Promise.all(
        nearbyWells.map(async (well) => {
          const [lastEvent, lastLog] = await Promise.all([
            Event.findOne({ wellId: well.wellId }).sort({ date: -1 }),
            DecisionLog.findOne({ wellId: well.wellId }).sort({ createdAt: -1 }),
          ]);

          // pick whichever is more recent
          let lastActivity = null;
          const candidates = [];
          if (lastEvent) candidates.push({ by: lastEvent.loggedBy, what: lastEvent.description, date: lastEvent.date, source: 'event' });
          if (lastLog) candidates.push({ by: lastLog.engineerName, what: lastLog.problem, date: lastLog.createdAt, source: 'decision_log' });

          if (candidates.length) {
            lastActivity = candidates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          }

          return { ...well.toObject(), lastActivity };
        })
      );
    }


    res.status(200).json({
      count: nearbyWells.length,
      wells: nearbyWells,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function findWellFlexible(idOrName) {
  if (!idOrName) return null;
  let well = await Well.findOne({ wellId: idOrName });
  if (!well) well = await Well.findOne({ wellName: idOrName });
  if (!well && (idOrName === 'WELL-001' || idOrName === 'OIL-BHK-142')) {
    well = await Well.findOne({ wellId: 'W001' });
  }
  if (!well) {
    well = await Well.findOne({ wellId: idOrName.replace(/-/g, '') });
  }
  return well;
}

// @route GET /api/wells/similar/:wellId
exports.getSimilarWells = async (req, res) => {
  try {
    const { wellId } = req.params;
    const { limit } = req.query;

    const targetWell = await findWellFlexible(wellId);
    if (!targetWell) {
      return res.status(404).json({ message: 'Well not found' });
    }

    const targetFormation = await getFormationByDepth(targetWell.totalDepth);
    const otherWells = await Well.find({ wellId: { $ne: targetWell.wellId } });

    const scoredWells = await Promise.all(
      otherWells.map(async (well) => {
        let score = 0;
        const matchedFactors = []; // NEW — human-readable labels for the UI tags

        // 1. Depth closeness (max 30 points)
        const depthDiff = Math.abs(well.totalDepth - targetWell.totalDepth);
        if (depthDiff <= 50) {
          score += 30;
          matchedFactors.push('Similar Depth (±50m)');
        } else if (depthDiff <= 150) {
          score += 20;
          matchedFactors.push('Nearby Depth Range');
        } else if (depthDiff <= 300) {
          score += 10;
        }

        // 2. Same well type (25 points)
        if (well.wellType === targetWell.wellType) {
          score += 25;
          matchedFactors.push(`Same Well Type (${well.wellType})`);
        }

        // 3. Same field (15 points)
        if (well.field === targetWell.field) {
          score += 15;
          matchedFactors.push(`Same Field (${well.field})`);
        }

        // 4. Same block (10 points)
        if (well.block === targetWell.block) {
          score += 10;
          matchedFactors.push(`Same Block (${well.block})`);
        }

        // 5. Same formation (20 points)
        const wellFormation = await getFormationByDepth(well.totalDepth);
        const formationName = wellFormation ? wellFormation.formation : null;

        if (targetFormation && wellFormation && targetFormation.formation === wellFormation.formation) {
          score += 20;
          matchedFactors.push(`Same Formation (${wellFormation.formation})`);
        }

        return {
          _id: well._id,              // NEW — needed to fetch events for this well
          wellId: well.wellId,
          wellName: well.wellName,
          field: well.field,
          block: well.block,
          wellType: well.wellType,
          totalDepth: well.totalDepth,
          formation: formationName,
          status: well.status,
          similarityScore: score,
          similarityPercentage: score,
          matchedFactors,
          latitude: well.latitude,        // NEW
          longitude: well.longitude,
        };
      })
    );

    scoredWells.sort((a, b) => b.similarityScore - a.similarityScore);
    const topResults = scoredWells.slice(0, parseInt(limit) || 5);

    res.status(200).json({
      targetWell: {
        wellId: targetWell.wellId,
        wellName: targetWell.wellName,
        totalDepth: targetWell.totalDepth,
        wellType: targetWell.wellType,
        field: targetWell.field,
        block: targetWell.block,
        formation: targetFormation ? targetFormation.formation : null,
      },
      count: topResults.length,
      similarWells: topResults,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route POST /api/wells
// Create a new well
exports.createWell = async (req, res) => {
  try {
    const {
      wellId,
      wellName,
      field,
      block,
      latitude,
      longitude,
      wellType,
      spudDate,
      completionDate,
      totalDepth,
      status,
    } = req.body;

    if (!wellId || !wellName || !latitude || !longitude) {
      return res.status(400).json({
        message: 'wellId, wellName, latitude and longitude are required',
      });
    }

    const existingWell = await Well.findOne({ wellId });
    if (existingWell) {
      return res.status(400).json({ message: 'Well ID already exists' });
    }

    const newWell = await Well.create({
      wellId,
      wellName,
      field,
      block,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      wellType,
      spudDate,
      completionDate,
      totalDepth: parseFloat(totalDepth),
      status,
    });

    res.status(201).json(newWell);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route GET /api/wells/search?q=W00
// Search wells by partial Well ID match (for search/select dropdown)
exports.searchWells = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query "q" is required' });
    }

    // "i" makes it case-insensitive, so "w00" also matches "W001"
    const matchingWells = await Well.find({
      wellId: { $regex: q, $options: 'i' },
    }).select('wellId wellName field block status'); // only send lightweight fields for a dropdown

    res.status(200).json({
      count: matchingWells.length,
      wells: matchingWells,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route GET /api/wells/:wellId
// Get full details of one exact well (after user selects it)
exports.getWellByWellId = async (req, res) => {
  try {
    const { wellId } = req.params;

    const well = await findWellFlexible(wellId);

    if (!well) {
      return res.status(404).json({ message: 'Well not found' });
    }

    res.status(200).json(well);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route GET /api/wells/:wellId/full
// Combined payload for the map popup: well details + decision log summary
exports.getWellFullDetails = async (req, res) => {
  try {
    const { wellId } = req.params;

    const well = await findWellFlexible(wellId);
    if (!well) {
      return res.status(404).json({ message: 'Well not found' });
    }

    const logs = await DecisionLog.find({ wellId: well.wellId }).sort({ createdAt: -1 });
    
     let lastWorkedBy = null;
    if (req.employee?.role === 'office') {
      const lastEvent = await Event.findOne({ wellId: well.wellId }).sort({ date: -1 });
      const lastLog = logs[0];
      const candidates = [];
      if (lastEvent) candidates.push({ by: lastEvent.loggedBy, what: lastEvent.description, date: lastEvent.date });
      if (lastLog) candidates.push({ by: lastLog.engineerName, what: lastLog.problem, date: lastLog.createdAt });
      if (candidates.length) lastWorkedBy = candidates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    res.status(200).json({
      well,
      decisionLogs: logs, // frontend renders each as "Problem: ... → Solution: ..."
      ...(lastWorkedBy && {lastWorkedBy}), // only present when role === 'office' and data exists
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route GET /api/wells/:wellId/events
// Past events for a single well, for the "view past events" expandable box
exports.getWellEvents = async (req, res) => {
  try {
    const { wellId } = req.params;

    const well = await findWellFlexible(wellId);
    if (!well) {
      return res.status(404).json({ message: 'Well not found' });
    }

    // PART 9 FIX: Event schema uses string wellId ("W001"). Query by well.wellId and fallback to _id
    const events = await Event.find({
      $or: [{ wellId: well.wellId }, { wellId: String(well._id) }]
    }).sort({ date: -1 });

    res.status(200).json({
      wellId: well.wellId,
      count: events.length,
      events: events.map(e => ({
        depth: e.depth,
        type: e.type,             // "mud loss", "stuck pipe", "kick"
        description: e.description,
        mitigation: e.mitigation, // what action was taken
        date: e.date,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }  
};
exports.createEvent = async (req, res) => {
  try {
    const { wellId } = req.params;
    const { depth, type, description, mitigation, date } = req.body;

    if (!type || !description || !mitigation) {
      return res.status(400).json({
        message: 'type, description and mitigation are required',
      });
    }

    const well = await Well.findOne({ wellId });
    if (!well) {
      return res.status(404).json({ message: 'Well not found' });
    }

    const event = await Event.create({
      wellId: well.wellId, // resolved server-side, matches Event string schema
      depth,
      type,
      description,
      mitigation,
      date: date ? new Date(date) : new Date(),
      loggedBy: req.employee?.employeeName || 'Field Engineer',
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route GET /api/wells/:wellId/contributors
// Office-only: list of engineers who worked on this well, grouped, with their problems/solutions
exports.getWellContributors = async (req, res) => {
  try {
    if (req.employee?.role !== 'office') {
      return res.status(403).json({ message: 'Access restricted to office role' });
    }

    const { wellId } = req.params;

    const well = await Well.findOne({ wellId });
    if (!well) {
      return res.status(404).json({ message: 'Well not found' });
    }

    const logs = await DecisionLog.find({ wellId }).sort({ createdAt: -1 });

    // Group logs by engineerName
    const grouped = {};
    for (const log of logs) {
      const name = log.engineerName || 'Unknown';
      if (!grouped[name]) {
        grouped[name] = {
          engineerName: name,
          contributionsCount: 0,
          contributions: [],
          lastContributed: log.createdAt,
        };
      }
      grouped[name].contributionsCount += 1;
      grouped[name].contributions.push({
        problem: log.problem,
        solution: log.solution,
        date: log.createdAt,
      });
    }

    const contributors = Object.values(grouped).sort(
      (a, b) => new Date(b.lastContributed) - new Date(a.lastContributed)
    );

    res.status(200).json({
      wellId: well.wellId,
      totalContributors: contributors.length,
      contributors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};