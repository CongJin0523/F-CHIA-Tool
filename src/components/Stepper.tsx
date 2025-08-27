import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { NavLink, useLocation, useNavigate } from "react-router";
const steps = [
  {
    label: "Hazard Identification",
    description:
      "For each ad campaign that you create, you can control how much you're willing to spend...",
    path: "/diagram"
  },
  {
    label: "Check and Standard Matching",
    description:
      "An ad group contains one or more ads which target a shared set of keywords.",
    path: "/table"
  },
  {
    label: "FTA",
    description:
      "Try out different ad text to see what brings in the most customers...",
    path: "/fta",
  },
];

export default function NonLinearStepper() {


  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<Record<number, boolean>>({});

  const totalSteps = () => steps.length;
  const completedSteps = () => Object.keys(completed).length;
  const isLastStep = () => activeStep === totalSteps() - 1;
  const allStepsCompleted = () => completedSteps() === totalSteps();

  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    const i = steps.findIndex(s => location.pathname.startsWith(s.path));
    setActiveStep(i === -1 ? 0 : i);
  }, [location.pathname]);

  const handleNext = () => {
    // If last step but not all completed, go to first incomplete
    const newActiveStep =
      isLastStep() && !allStepsCompleted()
        ? steps.findIndex((_, i) => !completed[i])
        : activeStep + 1;

    const safeIndex = newActiveStep < 0 ? 0 : newActiveStep;
    setActiveStep(safeIndex);

    // navigate to the corresponding route
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

  return (
    <div className="fixed top-50 right-0 h-150 w-60 overflow-y-auto p-4 z-50">
      <Box sx={{ maxWidth: 300 }}>
        {/* nonLinear 允许直接点击任意步骤 */}
        <Stepper nonLinear activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} completed={!!completed[index]}>
              <StepButton
                component={NavLink as any}
                to={step.path}
                color="inherit"
                // 用 NavLink 的 isActive 来控制样式（也可以用 sx）
                className={({ isActive }) =>
                  isActive ? "font-semibold text-blue-600" : ""
                }
              >
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        {/* 内容区域：显示当前 activeStep 的描述和操作按钮 */}
        {allStepsCompleted() ? (
          <Paper square elevation={0} sx={{ p: 3, mt: 2 }}>
            <Typography>All steps completed — you&apos;re finished</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Reset
            </Button>
          </Paper>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ mb: 2 }}>
              {steps[activeStep]?.description}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
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
    </div>
  );
}