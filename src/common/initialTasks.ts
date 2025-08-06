import { type FormValues } from '@/common/types';

export const initialTasks: FormValues = {
  tasks: [
    {
      taskName: "task 1",
      rowSpan: 2,
      functions: [
        {
          functionName: "Switch between the autonomous mode and the manual mode",
          rowSpan: 2,
          realizations: [
            {
              realizationName: "Manually select the option",
              rowSpan: 2,
              properties: [
                {
                  properties: ["Machine status "],
                  rowSpan: 2,
                  interpretations: [
                    {
                      guideWord: "Other than",
                      deviations: ["Autonomous mode fails to start"],
                      causes: ["Software error"],
                      consequences: ["The tractor cannot move. Time loss."],
                      requirements: [
                        "1.Set up at least two distinct accesses (for redundancy and safety, e.g., a mechanical button reachable when the operator is outside the tractor and an access on the control panel) to the mode switch while also minimizing the effect of complexity from multiple systemic accesses.",
                        "2.Provide 100% knowable instructions on how to switch the mode (for good decision support in the situation of autonomous mode failing to start to reduce possible human errors) in the user manual, considering the diverse educational level of the intended users. Two necessary formats of instructions can be diagram instructions showing appearances and positions of accesses and language instructions to describe operations in detail. Note that multiple languages and definitions of terminologies are expected to be provided to meet the needs of people from different educational backgrounds."
                      ],
                    },
                    {
                      guideWord: "Other than",
                      deviations: ["The autonomous mode starts before the operator leaves the tractor."],
                      causes: ["Software error"],
                      consequences: ["Extra injury to the operator when the collision happens"],
                      requirements: [
                        "3.Set up at least two distinct accesses (for redundancy and safety, e.g., a mechanical button reachable when the operator is outside the tractor and an access on the control panel) to the mode switch while also minimizing the effect of complexity from multiple systemic accesses.",
                        "4.Provide 100% knowable instructions on how to switch the mode (for good decision support in the situation of autonomous mode failing to start to reduce possible human errors) in the user manual, considering the diverse educational level of the intended users. Two necessary formats of instructions can be diagram instructions showing appearances and positions of accesses and language instructions to describe operations in detail. Note that multiple languages and definitions of terminologies are expected to be provided to meet the needs of people from different educational backgrounds."
                      ],
                    },
                  ],
                },
              ]
            },
          ],
        },
      ],
    },
    {
      taskName: "task 2",
      rowSpan: 2,
      functions: [
        {

          functionName: "Perceive surroundings among dynamic objects, static obstacles, and drivable paths.",
          rowSpan: 2,
          realizations: [
            {
              realizationName: "Camera detection with image processing algorithms and learning approach",
              rowSpan: 2,
              properties: [
                {
                  properties: ["1. Object type", "2. Distance"],
                  rowSpan: 2,
                  interpretations: [
                    {
                      guideWord: "No",
                      deviations: ["The tractor fails to detect its surroundings, especially the road"],
                      causes: ["Blurry image due to the instability of the tractor", "Weak brightness", "Severe weather conditions"],
                      consequences: ["The tractor cannot move. Time loss."],
                      requirements: [
                        "5.Set up at least two distinct accesses (for redundancy and safety, e.g., a mechanical button reachable when the operator is outside the tractor and an access on the control panel) to the mode switch while also minimizing the effect of complexity from multiple systemic accesses.",
                        "6.Provide 100% knowable instructions on how to switch the mode (for good decision support in the situation of autonomous mode failing to start to reduce possible human errors) in the user manual, considering the diverse educational level of the intended users. Two necessary formats of instructions can be diagram instructions showing appearances and positions of accesses and language instructions to describe operations in detail. Note that multiple languages and definitions of terminologies are expected to be provided to meet the needs of people from different educational backgrounds."
                      ],
                    },
                    {
                      guideWord: "Part of",
                      deviations: ["Not all obstacles in the scene are detected", "Distance between the tractor and the object is not available"],
                      causes: ["low-quality camera", "unreliable detection algorithm", "limited camera angle"],
                      consequences: ["Extra injury to the operator when the collision happens"],
                      requirements: [
                        "7.(for redundancy and safety, e.g., a mechanical button reachable when the operator is outside the tractor and an access on the control panel) to the mode switch while also minimizing the effect of complexity from multiple systemic accesses.",
                        "8.on how to switch the mode (for good decision support in the situation of autonomous mode failing to start to reduce possible human errors) in the user manual, considering the diverse educational level of the intended users. Two necessary formats of instructions can be diagram instructions showing appearances and positions of accesses and language instructions to describe operations in detail. Note that multiple languages and definitions of terminologies are expected to be provided to meet the needs of people from different educational backgrounds"
                      ],
                    },
                  ],
                },
              ]
            },
          ],
        },
      ],
    },
  ]
};
