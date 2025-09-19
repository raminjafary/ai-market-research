import type { ChartConfiguration } from "chart.js";

export type TChartConfig = ChartConfiguration;

export type ChartConfig = {
  labels: string[];
  data: number[];
  label: string;
  type: "bar" | "line";
  colors: string[];
};

export function createChartConfig({
  labels,
  data,
  label,
  type,
  colors,
}: {
  labels: string[];
  data: number[];
  label: string;
  type: "bar" | "line";
  colors: string[];
}): ChartConfiguration {
  return {
    type: type,
    data: {
      labels: labels,
      datasets: [
        {
          label: label,
          data: data,
          borderWidth: 1,
          ...(type === "bar" && { backgroundColor: colors }),
          ...(type === "line" &&
            colors.length > 0 && { borderColor: colors[0] }),
        },
      ],
    },
    options: {
      animation: { duration: 0 }, 
    },
  };
}
