const Employee = require("../models/Employee");
const DecisionLog = require("../models/DecisionLog");

// GET logged-in employee account
exports.getMyAccount = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id)
      .select("-password");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const logsCount = await DecisionLog.countDocuments({
      engineerName: employee.employeeName,
    });

    const wells = await DecisionLog.distinct("wellId", {
      engineerName: employee.employeeName,
    });

    res.status(200).json({
      name: employee.employeeName,
      employeeId: employee.employeeId,
      role: employee.role,
      position: employee.position || "",
      directorate: employee.directorate || "",
      yearsOfExperience: employee.yearsOfExperience || 0,

      stats: {
        wellsCount: wells.length,
        logsCount: logsCount,
        yearsOfService: employee.yearsOfExperience || 0,
      },
    });
  } catch (error) {
    console.error("GET ACCOUNT ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// UPDATE logged-in employee profile
exports.updateMyAccount = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const {
      position,
      yearsOfExperience,
      directorate,
    } = req.body;

    if (position !== undefined) {
      employee.position = position.trim();
    }

    if (yearsOfExperience !== undefined) {
      const experience = Number(yearsOfExperience);

      if (isNaN(experience) || experience < 0) {
        return res.status(400).json({
          message: "Invalid years of experience",
        });
      }

      employee.yearsOfExperience = experience;
    }

    if (directorate !== undefined) {
      employee.directorate = directorate.trim();
    }

    await employee.save();

    res.status(200).json({
      message: "Account updated successfully",

      account: {
        name: employee.employeeName,
        employeeId: employee.employeeId,
        role: employee.role,
        position: employee.position || "",
        directorate: employee.directorate || "",
        yearsOfExperience: employee.yearsOfExperience || 0,
      },
    });

  } catch (error) {
    console.error("UPDATE ACCOUNT ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};