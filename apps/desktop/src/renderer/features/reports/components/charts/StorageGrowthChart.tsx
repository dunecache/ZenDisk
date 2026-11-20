import { formatBytes, formatDate } from "@/lib/formatters";
import { EmptyState } from "@/components/data-display";
import type { StoragePoint } from "@/types";

export interface StorageGrowthChartProps {
  points: StoragePoint[];
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 14;
const PAD_BOTTOM = 30;

/** Accessible line chart with SVG tooltips and a screen-reader data table. */
export function StorageGrowthChart({ points }: StorageGrowthChartProps) {
  if (points.length === 0) {
    return (
      <EmptyState
        heading="No storage history"
        description="Storage readings will appear here after the first scan."
      />
    );
  }

  const max = Math.max(...points.map((point) => point.usedBytes + point.freeBytes), 1);
  const x = (index: number) =>
    PAD_LEFT + (index / Math.max(points.length - 1, 1)) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const y = (value: number) =>
    PAD_TOP + (1 - value / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const usedPoints = points.map((point, index) => `${x(index)},${y(point.usedBytes)}`).join(" ");
  const lastIndex = points.length - 1;
  const labelIndexes = [0, Math.floor(lastIndex / 2), lastIndex];

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div className="flex flex-wrap items-center gap-[var(--space-4)] text-[length:var(--text-small)] text-muted">
        <span className="flex items-center gap-[var(--space-2)]">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          Used space
        </span>
        <span className="flex items-center gap-[var(--space-2)]">
          <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
          Free space
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-56 w-full"
        role="img"
        aria-label="Storage used and free over the selected period"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = max * fraction;
          const lineY = y(value);
          return (
            <g key={fraction}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={lineY}
                y2={lineY}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={lineY + 3}
                textAnchor="end"
                fontSize={10}
                fill="var(--muted)"
              >
                {formatBytes(value, { unit: "GB", precision: 0 })}
              </text>
            </g>
          );
        })}

        <polyline
          points={usedPoints}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polyline
          points={points.map((point, index) => `${x(index)},${y(point.freeBytes)}`).join(" ")}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <circle key={point.date} cx={x(index)} cy={y(point.usedBytes)} r={4} fill="transparent">
            <title>
              {formatDate(point.date)} — used {formatBytes(point.usedBytes)}, free{" "}
              {formatBytes(point.freeBytes)}
            </title>
          </circle>
        ))}

        {labelIndexes.map((index) => (
          <text
            key={index}
            x={x(index)}
            y={HEIGHT - 8}
            textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
            fontSize={10}
            fill="var(--muted)"
          >
            {formatDate(points[index].date)}
          </text>
        ))}
      </svg>

      <table className="sr-only">
        <caption>Storage readings for the selected period</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Used</th>
            <th scope="col">Free</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{formatDate(point.date)}</th>
              <td>{formatBytes(point.usedBytes)}</td>
              <td>{formatBytes(point.freeBytes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
