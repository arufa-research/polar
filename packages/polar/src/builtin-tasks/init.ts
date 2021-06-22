import { initProject } from "../internal/contract_init/createApp";
import { task } from "../internal/core/config/config-env";
import { TASK_INIT } from "./task-names";

export default function (): void {
  task(TASK_INIT, "Initializes a new project in the given directory")
    .addPositionalParam<string>("newProjectName", "Name of the new project")
    .setAction(async ({ newProjectName }: { newProjectName: string }, _) => {
      initProject(newProjectName);
    });
}
