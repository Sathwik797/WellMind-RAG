import React from "react";
import { IconActivity } from "../Icons";

export default function TelemetryPanel({ telemetry = {}, currentDepth = 2450.5 }) {
  // Baseline or live values with sensible oilfield fallbacks
  const data = {
    rop: telemetry.rop ?? telemetry.ROP ?? 18.4,
    wob: telemetry.wob ?? telemetry.WOB ?? 28.5,
    rpm: telemetry.rpm ?? telemetry.RPM ?? 115,
    torque: telemetry.torque ?? telemetry.Torque ?? 240,
    spp: telemetry.spp ?? telemetry.Standpipe_Pressure ?? 1480,
    mudWeight: telemetry.mudWeight ?? telemetry.Mud_Weight ?? 1.42,
    flowRate: telemetry.flowRate ?? telemetry.Flow_Rate ?? 680,
    pv: telemetry.pv ?? telemetry.Plastic_Viscosity ?? 21.0,
    yp: telemetry.yp ?? telemetry.Yield_Point ?? 8.5,
  };

  const ITEMS = [
    {
      id: "rop",
      label: "ROP",
      val: Number(data.rop).toFixed(1),
      unit: "m/h",
      desc: "Penetration Rate",
      warn: data.rop > 45,
    },
    {
      id: "wob",
      label: "WOB",
      val: Number(data.wob).toFixed(1),
      unit: "klbs",
      desc: "Weight on Bit",
      warn: data.wob > 38,
    },
    {
      id: "rpm",
      label: "RPM",
      val: Math.round(data.rpm),
      unit: "rpm",
      desc: "Rotary Speed",
      warn: data.rpm > 160,
    },
    {
      id: "torque",
      label: "TORQUE",
      val: Math.round(data.torque),
      unit: "kft·lb",
      desc: "Rotary Torque",
      warn: data.torque > 290,
    },
    {
      id: "spp",
      label: "SPP",
      val: Math.round(data.spp),
      unit: "psi",
      desc: "Standpipe Pressure",
      warn: data.spp > 2800 || data.spp < 800,
    },
    {
      id: "mw",
      label: "MUD WT",
      val: Number(data.mudWeight).toFixed(2),
      unit: "SG",
      desc: "Specific Gravity",
      warn: data.mudWeight > 1.6 || data.mudWeight < 1.2,
    },
    {
      id: "flow",
      label: "FLOW",
      val: Math.round(data.flowRate),
      unit: "gpm",
      desc: "Mud Circulation",
      warn: data.flowRate > 950 || data.flowRate < 350,
    },
    {
      id: "pv_yp",
      label: "PV / YP",
      val: `${Math.round(data.pv)} / ${Math.round(data.yp)}`,
      unit: "cP · lb",
      desc: "Rheology Profile",
      warn: false,
    },
  ];

  return (
    <div className="telemetry-strip">
      <div className="telemetry-strip-header">
        <div className="tsh-title-group">
          <IconActivity size={13} />
          <span>REAL-TIME DRILLING HYDRAULICS &amp; DYNAMICS</span>
        </div>
        <div className="tsh-metric">
          BIT DEPTH: <strong>{telemetry.md ? Number(telemetry.md).toFixed(1) : Number(currentDepth).toFixed(1)}m</strong>
        </div>
      </div>

      <div className="telemetry-grid-strip">
        {ITEMS.map((item) => (
          <div
            key={item.id}
            className={`t-metric-card ${item.warn ? "surge-warning" : ""}`}
          >
            <div className="tmc-label-group">
              <span className="tmc-label">{item.label}</span>
              <span className="tmc-unit">{item.unit}</span>
            </div>
            <div className="tmc-val">{item.val}</div>
            <div className="tmc-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
