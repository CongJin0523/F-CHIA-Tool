# F-CHIA Tool — How to Use
## Overall Layout

The general layout of the tool is shown below:
<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/overall-layout.png?raw=1" />
</p>

## Create a New Project

Users can create a new project through **File → New Project**, which will open the following dialog:

<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/create-new-project.png?raw=1" width="200"/>
</p>

Enter the desired project name to create it.
**Warning**: This action will clear all existing data. If you want to preserve your work, export it first via **File → Export JSON**.
The project name can be modified at any time in the header.

## Analysis on the F-CHIA Diagram
A new project comes with a default base zone.
Users may modify the zone, create new zones, or switch zones using the Zone Selector.

Follow the workflow in the diagram below to perform the F-CHIA analysis:

<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/flow-chart.png?raw=1" width="400"/>
</p>
Each step in this workflow is represented as a node in the tool.
A typical node structure looks like this:
When hovering over a node, a tooltip appears showing the node type, description, and examples—helping users understand what content should be filled in:
<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/hover.gif?raw=1" width="400"/>
</p>

The **Add Node** button below a node automatically generates the next node type connected to it.
For example, a *Zone Node* will automatically create a Task Node, reducing the need for users to manually select node types:

<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/add_node.gif?raw=1" width="400"/>
</p>

Users can also create edges by dragging to connect related nodes:

<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/add_edge.gif?raw=1" width="400"/>
</p>

If an invalid connection is attempted, the tool will block it and display an error message:

<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/error-edge.gif?raw=1" width="200"/>
</p>

## Table
After completing the analysis for a zone, users can navigate to the Table Workspace via the **stepper** or **Go To → Table**.
<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/table.png?raw=1" width="400"/>
</p>

Here, the results of the analysis are displayed clearly, and the Function–Requirement DMM helps users quickly understand the relationships between functions and requirements, making it easy to verify whether they are reasonable.
The tool can also utilize the OpenAI API to perform an initial filtering of safety standards relevant to each requirement, helping users quickly identify which standards may apply.

## FTA
The tool also provides integration with Fault Tree Analysis (FTA).

Users can create an FTA directly from the table by clicking Create FTA for a corresponding task.
Then, users may navigate to the FTA workspace via **Go To → FTA** or the stepper.

- The Top Event is extracted from the Task.
- Basic Events are derived from the Causes.
- A checklist ensures that every cause is considered.

The interaction logic in the FTA workspace is similar to that of the F-CHIA diagram editor:

<p align="center">
  <img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/fta.png?raw=1" width="400"/>
</p>
