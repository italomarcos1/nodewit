import { ChatOpenAI } from "@langchain/openai";
import { env } from "../../env/index.js";

const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.5,
  openAIApiKey: env.OPENAI_API_KEY
});

export class CreateSubTask {
  async execute(query) {
    const prompt =
      `YOUR JOB:
      You are a project manager for a frontend (React) and backend (NodeJS) team. Your task is to creatively divide a given task into up to 3 subtasks, ordered as follows:

      Left-side subtask: Easier, superficial
      Center subtask: Main, crucial, next step
      Right-side subtask: Harder, not crucial, can be done later

      Please draw the task distribution as a binary tree, where nodes represent the tasks and have from 1 to 3 children, depending on complexity.

      Follow this structure to understand, but create your unique distribution:

      Task: [INSERT TASK HERE]

      Tree:
                          [INSERT TASK HERE]
                                /           |           \\
          (Easier subtask) (Crucial next step) (Harder subtask)

      Detailed breakdown:

      Easier subtask (Left-side subtask: Easier, superficial). 'left.description' as follows:
      - [Insert simpler steps]
      - ...
      - ...

      Crucial next step (Center subtask: Main, crucial, next step). 'center.description' as follows:
      - [Insert crucial steps]
      - ...
      - ...

      Harder subtask (Right-side subtask: Harder, not crucial, can be done later). 'right.description' as follows:
      - [Insert harder steps]
      - ...
      - ...

      Remember, the tree should have 3 children (left, center, and right) only if necessary due to complexity. If not, create just the center subtask (next step of the task).

      ---

      INSTRUCTIONS: "Respond with a valid JSON object, containing up to 3 fields/objects: 'left', 'center', 'right', where each one has two fields: 'title' and 'description' (steps, as an array of strings)"

      ---

      YOUR TASK (user input): ${query}
      `;

    const structuredLlm = model.withStructuredOutput({
      name: "treeOfSubTasks",
      description: "Respond with a valid JSON object, containing up to 3 fields/objects: 'left', 'center', 'right', where each one has two fields: 'title' and 'description' (steps, as an array of strings)",
      parameters: {
        title: "subTasks",
        type: "object",
        properties: {
          left: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the subtask" },
              description: { type: "string", description: "The steps to achieve the subtask" }
            }
          },
          center: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the subtask" },
              description: { type: "string", description: "The steps to achieve the subtask" }
            }
          },
          right: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the subtask" },
              description: { type: "string", description: "The steps to achieve the subtask" }
            }
          },
        },
      },
    });
    
    const response = await structuredLlm.invoke(prompt, { name: "treeOfSubTasks" });

    return response;
  }
}
