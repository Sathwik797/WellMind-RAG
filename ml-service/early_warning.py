def generate_early_warning(
    mud_loss_risk,
    stuck_pipe_risk,
    overpressure_risk,
    torque_spike_risk,
    cementing_issue_risk,
    drilling_data
):
    risks = {
        "Mud Loss": mud_loss_risk,
        "Stuck Pipe": stuck_pipe_risk,
        "Overpressure": overpressure_risk,
        "Torque Spike": torque_spike_risk,
        "Cementing Issue": cementing_issue_risk
    }

    warnings = []

    # Generate warnings based on risk percentages
    for event, risk in risks.items():
        if risk >= 80:
            level = "HIGH"
        elif risk >= 40:
            level = "MEDIUM"
        else:
            continue

        warnings.append({
            "type": "ML",
            "event": event,
            "risk": round(risk, 2),
            "level": level,
            "message": f"{level.title()} {event} risk predicted ({risk:.1f}%)."
        })

    # Overall level
    if any(risk >= 80 for risk in risks.values()):
        overall_level = "HIGH"
    elif any(risk >= 40 for risk in risks.values()):
        overall_level = "MEDIUM"
    else:
        overall_level = "LOW"

    # --------------------------------------------------
    # Dynamic recommendations with validated physical units
    # --------------------------------------------------
    recommendations = []

    # Normalize Mud_Weight to Specific Gravity (SG)
    # NWIS dataset uses SG (e.g. 1.2 - 1.8 SG). If value > 5.0, it is in ppg (e.g. 10 - 15 ppg).
    raw_mw = float(drilling_data.get("Mud_Weight", 1.42))
    mw_sg = raw_mw / 8.33 if raw_mw > 5.0 else raw_mw

    flow_rate = float(drilling_data.get("Flow_Rate", 700.0))
    wob = float(drilling_data.get("WOB", 30.0))
    rpm = float(drilling_data.get("RPM", 110.0))
    pore_press = float(drilling_data.get("Formation_Pore_Pressure", 2500.0))
    res_press = float(drilling_data.get("Reservoir_Pressure", 2500.0))
    spp = float(drilling_data.get("Standpipe_Pressure", 1500.0))

    if mud_loss_risk >= 40:
        if flow_rate > 800:
            recommendations.append(
                "Reduce flow rate and monitor mud volume closely."
            )
        elif mw_sg < 1.25:  # Low mud density in SG (< 1.25 SG / ~10.4 ppg)
            recommendations.append(
                "Review mud weight and monitor mud loss closely."
            )
        else:
            recommendations.append(
                "Monitor mud volume, flow rate and mud properties closely."
            )

    if stuck_pipe_risk >= 40:
        if wob > 30:
            recommendations.append(
                "Reduce WOB and monitor torque and drag."
            )
        elif rpm > 150:
            recommendations.append(
                "Reduce RPM and monitor torque for further increase."
            )
        else:
            recommendations.append(
                "Monitor torque, WOB and drag closely."
            )

    if overpressure_risk >= 40:
        if pore_press > res_press:
            recommendations.append(
                "Monitor formation pressure and well-control parameters closely."
            )
        else:
            recommendations.append(
                "Monitor standpipe pressure and formation pressure closely."
            )

    if torque_spike_risk >= 40:
        if wob > 30 and rpm > 140:
            recommendations.append(
                "Reduce WOB and RPM to control the torque spike."
            )
        elif wob > 30:
            recommendations.append(
                "Reduce WOB and monitor torque."
            )
        else:
            recommendations.append(
                "Monitor torque and drilling parameters for further spikes."
            )

    if cementing_issue_risk >= 40:
        if spp > 2500:
            recommendations.append(
                "Review pressure and flow conditions before continuing cementing operations."
            )
        else:
            recommendations.append(
                "Review cementing parameters and monitor pressure and flow."
            )

    if not recommendations:
        recommendation = (
            "No immediate action required. Continue normal drilling "
            "operations and monitor well parameters."
        )
    else:
        recommendation = " ".join(recommendations)

    return {
        "level": overall_level,
        "warnings": warnings,
        "recommendation": recommendation
    }
