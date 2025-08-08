import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { initialTasks } from "@/common/initialTasks"

// const tasks = [
//   {
//     taskName: "switch between the autonomous mode and the manual mode",
//     functions: [
//       {
//         functionName: "Function 1",
//         realizations: [
//           { realizationName: "Realization 1" },
//           { realizationName: "Realization 2" },
//         ],
//       },
//       {
//         functionName: "Function 2",
//         realizations: [
//           { realizationName: "Realization 3" },
//           { realizationName: "Realization 4" },
//         ],
//       },
//     ],
//   },
//   {
//     taskName: "autonomous navigate on the field",
//     functions: [
//       {
//         functionName: "Function 3",
//         realizations: [
//           { realizationName: "Realization 5" },
//           { realizationName: "Realization 6" },
//         ],
//       },
//       {
//         functionName: "Function 4",
//         realizations: [
//           { realizationName: "Realization 7" },
//           { realizationName: "Realization 8" },
//         ],
//       },
//     ],
//   },
//   {
//     taskName: "control the tractor mobile base in the manual mode",
//     functions: [],
//   }
// ]

export default function TableDemo() {
  const tasks = initialTasks;
  return (
    <Table className="w-3/4 mx-auto my-20">
      <TableCaption>Task</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Task</TableHead>
          <TableHead>Function</TableHead>
          <TableHead>Realizations</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const taskRowCount = task.functions.reduce(
            (sum, fn) => sum + fn.realizations.length,
            0
          );

          let taskRowRendered = false; // to control when to render task cell

          return task.functions.map((fn) => {
            const functionRowCount = fn.realizations.length;

            let functionRowRendered = false; // to control when to render function cell

            return fn.realizations.map((realization) => (
              <TableRow key={`${task.taskName}-${fn.functionName}-${realization.realizationName}`}>
                {/* Task cell */}
                {!taskRowRendered && (
                  <TableCell rowSpan={taskRowCount} className="font-medium align-top">
                    {task.taskName}
                  </TableCell>
                )}
                {/* Function cell */}
                {!functionRowRendered && (
                  <TableCell rowSpan={functionRowCount} className="align-top">
                    {fn.functionName}
                  </TableCell>
                )}
                {/* Realization cell */}
                <TableCell>{realization.realizationName}</TableCell>

                {(() => {
                  taskRowRendered = true;
                  functionRowRendered = true;
                })()}
              </TableRow>
            ));
          });
        })}
      </TableBody>
      {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
    </Table>
  )
}
