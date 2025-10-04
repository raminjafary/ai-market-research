import { z } from "zod/v4";

export const modelChartSchema = z.object({
  chartConfigurations: z
    .array(
      z.object({
        type: z
          .enum(["bar", "line"])
          .describe('The type of chart to generate. Either "bar" or "line"'),
        labels: z.array(z.string()).describe("A list of chart labels"),
        data: z.array(z.number()).describe("A list of the chart data"),
        label: z.string().describe("A label for the chart"),
        colors: z
          .array(z.string())
          .describe(
            'A list of colors to use for the chart, e.g. "rgba(255, 99, 132, 0.8)"'
          ),
      })
    )
    .describe("A list of chart configurations"),
});
