import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import { CircleX, ListChecks } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { grey } from '@mui/material/colors';
const color = grey[500];
const steps = [
  { label: "Hazard Identification", description: "Function-centric hazard identificatio", path: "/diagram" },
  { label: "Check and Standard Matching", description: "Review results and match requirements with safety standards", path: "/table" },
  { label: "FTA", description: "Build fault trees and analyze hazard causes", path: "/fta" },
];

export default function NonLinearStepper() {
  const [open, setOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<Record<number, boolean>>({});

  const totalSteps = () => steps.length;
  const completedSteps = () => Object.keys(completed).length;
  const isLastStep = () => activeStep === totalSteps() - 1;
  const allStepsCompleted = () => completedSteps() === totalSteps();

  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const i = steps.findIndex((s) => location.pathname.startsWith(s.path));
    setActiveStep(i === -1 ? 0 : i);
  }, [location.pathname]);

  const handleNext = () => {
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? steps.findIndex((_, i) => !completed[i])
        : activeStep + 1;

    const safeIndex = Math.max(0, newActiveStep);
    setActiveStep(safeIndex);
    const target = steps[safeIndex]?.path;
    if (target) navigate(target);
  };

  const handleBack = () => {
    const prev = Math.max(0, activeStep - 1);
    setActiveStep(prev);
    const target = steps[prev]?.path;
    if (target) navigate(target);
  };

  const handleComplete = () => {
    setCompleted((prev) => ({ ...prev, [activeStep]: true }));
    handleNext();
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
  };

  // Sidebar width in pixels
  const SIDEBAR_WIDTH = 240;

  return (
    <>
  {/* Mini floating action button to open the workflow sidebar (only visible when closed) */}
      {!open && (
        <Tooltip title="Workflow Steps">
          <Fab
            size="small"
            color={color}
            onClick={() => setOpen(true)}
            sx={{
              position: "fixed",
              right: 18,
              top: "20vh",// 150px from top
            }}
          >
            <ListChecks />
          </Fab>
        </Tooltip>
      )}

  {/* Fixed, non-modal sidebar for workflow steps */}
      <Paper
        elevation={0}
        role="complementary"
        aria-label="Workflow sidebar"
        sx={{
          position: "fixed",
          top: "20vh",        // start under your header
          right: 0,
          height: "500px",            // match h-150 (150 * 4 = 600px)
          width: "240px",
          overflow: "auto",
          flexDirection: "column",
          zIndex: (t) => t.zIndex.modal + 1, // above almost everything
          transform: open ? "translateX(0)" : `translateX(${SIDEBAR_WIDTH + 16}px)`,
          transition: "transform 220ms ease",
          pointerEvents: open ? "auto" : "none", // when closed, ignore pointer
          backgroundColor: "rgba(255, 255, 255, 0.1)", 
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)", 
          borderRadius: 2,
        }}
      >
  {/* Sidebar header with close button and title */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              right: 200,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <CircleX fontSize="small" />
          </IconButton>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "primary.main" }}>
            Workflow Steps
          </Typography>

        </Box>

  {/* Stepper content: vertical stepper with navigation and completion controls */}
        <Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>
          <Stepper nonLinear activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label} completed={!!completed[index]}>
                <StepButton
                  component={NavLink as any}
                  to={step.path}
                  color="inherit"
                  onClick={() => setActiveStep(index)}
                  className={({ isActive }: { isActive: boolean }) =>
                    isActive ? "font-semibold text-blue-600" : ""
                  }
                >
                  {step.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>

          {allStepsCompleted() ? (
            <Paper square elevation={0} sx={{ p: 2, mt: 2 }}>
              <Typography>All steps completed — you can now export your project data or report from the
                <strong> File </strong> menu above.</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Reset
              </Button>
            </Paper>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ mb: 2 }}>
                {steps[activeStep]?.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="contained" onClick={handleNext}>
                  {isLastStep() ? "Finish" : "Continue"}
                </Button>
                <Button onClick={handleBack} disabled={activeStep === 0}>
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={!!completed[activeStep]}>
                  {completed[activeStep] ? "Completed" : "Mark complete"}
                </Button>
              </Box>
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                {completedSteps()}/{totalSteps()} completed
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
}
