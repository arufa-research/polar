import { createProject } from "../internal/cli/project-creation";
import { task } from "../internal/core/config/config-env";
import { TASK_INIT } from "./task-names";

export default function (): void {
  task(TASK_INIT, "Initializes a new project in the given directory")
    .addPositionalParam<string>("projectName", "Name of project")
    .setAction(async ({ projectName }:
    { projectName: string }, _) => {
      await createProject(projectName);
    });
}
