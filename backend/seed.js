require('dotenv').config();
const mongoose = require('mongoose');
const Well = require('./models/Well');
const Event = require('./models/Event');
const wellsData = require('./data/well_master.json'); // your actual well file
const eventsData = require('./data/event_log.json');
const Formation = require('./models/Formation');
const formationsData = require('./data/formations.json');
const DrillingData = require('./models/DrillingData');
const drillingData = require('./data/drilling_timeseries_balanced.json');

const getLatestFormationPerWell = (records) => {
  const latestByWell = {}; // { wellId: { timestamp, formation } }

  records.forEach((record) => {
    const wellId = record.Well_ID;
    const timestamp = new Date(record.Timestamp);

    if (!latestByWell[wellId] || timestamp > latestByWell[wellId].timestamp) {
      latestByWell[wellId] = {
        timestamp,
        formation: record.Formation,
      };
    }
  });

  // Convert to simple { wellId: formation } map
  const formationMap = {};
  Object.keys(latestByWell).forEach((wellId) => {
    formationMap[wellId] = latestByWell[wellId].formation;
  });

  return formationMap;
};

const formationLookup = getLatestFormationPerWell(drillingData);

const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');

// Convert raw JSON (Latitude/Longitude as strings) into schema-ready format
const formatWells = (rawWells) => {
  return rawWells.map((well) => ({
    wellId: well.Well_ID,
    wellName: well.Well_Name,
    field: well.Field,
    block: well.Block,
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(well.Longitude), // longitude FIRST
        parseFloat(well.Latitude),  // latitude SECOND
      ],
    },
    wellType: well.Well_Type,
    spudDate: well.Spud_Date,
    completionDate: well.Completion_Date,
    totalDepth: parseFloat(well.Total_Depth),
    status: well.Status,
    formation: formationLookup[well.Well_ID] || null,
  }));
};

// Convert raw formation JSON (strings) into schema-ready format
const formatFormations = (rawFormations) => {
  return rawFormations.map((f) => ({
    formation: f.formation,
    depthFrom: parseFloat(f.depth_from),
    depthTo: parseFloat(f.depth_to),
    lithology: f.lithology,
    rockType: f.rock_type,
    porosityPct: parseFloat(f.porosity_pct),
    permeabilityMd: parseFloat(f.permeability_md),
    reservoirPressurePsi: parseFloat(f.reservoir_pressure_psi),
    temperatureC: parseFloat(f.temperature_c),
  }));
};

// Convert raw event JSON into schema-ready format
const formatEvents = (rawEvents) => {
  return rawEvents.map((e) => {
    let eventDate = new Date();
    if (e.Timestamp) {
      // Handles "DD-MM-YYYY HH:mm" or ISO strings
      const parts = e.Timestamp.split(' ');
      if (parts[0] && parts[0].includes('-')) {
        const dmy = parts[0].split('-');
        if (dmy.length === 3 && dmy[0].length === 2 && dmy[2].length === 4) {
          eventDate = new Date(`${dmy[2]}-${dmy[1]}-${dmy[0]}T${parts[1] || '00:00'}:00`);
        } else {
          eventDate = new Date(e.Timestamp);
        }
      }
    }

    return {
      wellId: e.Well_ID || e.wellId,
      depth: parseFloat(e.Depth_From || e.depth || 0),
      type: e.Event_Type || e.type,
      description: e.Description || e.description,
      mitigation: e.Mitigation || e.mitigation,
      date: isNaN(eventDate.getTime()) ? new Date() : eventDate,
      loggedBy: e.loggedBy || 'System Seed',
    };
  });
};

async function populateData() {
  await Well.deleteMany({});
  await Event.deleteMany({});
  await Formation.deleteMany({});
  await DrillingData.deleteMany({});

  const formattedWells = formatWells(wellsData);
  const formattedFormations = formatFormations(formationsData);
  const formattedEvents = formatEvents(eventsData);

  await Well.insertMany(formattedWells);
  await Event.insertMany(formattedEvents);
  await Formation.insertMany(formattedFormations);
  await DrillingData.insertMany(drillingData);

  // Seed default test employees if none exist
  const existingEmployees = await Employee.countDocuments();
  if (existingEmployees === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await Employee.create([
      {
        employeeId: 'EMP001',
        employeeName: 'Field Engineer',
        password: hashedPassword,
        role: 'field',
        position: 'Senior Drilling Engineer',
        yearsOfExperience: 8,
        directorate: 'Operations',
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Office Analyst',
        password: hashedPassword,
        role: 'office',
        position: 'Subsurface Geoscientist',
        yearsOfExperience: 5,
        directorate: 'Analytics',
      },
    ]);
    console.log('Seeded default employees (EMP001/field, EMP002/office, password: password123)');
  }

  console.log(`Seed complete: ${formattedWells.length} wells inserted`);
  console.log(`${formattedEvents.length} events seeded`);
  console.log(`${drillingData.length} drilling records seeded`);
  console.log(`${formattedFormations.length} formations seeded`);
}

async function seedDatabase(customUri) {
  const uri = customUri || process.env.MONGO_URI || 'mongodb://localhost:27017/nwis';
  console.log(`Connecting to MongoDB at: ${uri}`);
  await mongoose.connect(uri);
  await populateData();
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, populateData, formatWells, formatEvents, formatFormations };