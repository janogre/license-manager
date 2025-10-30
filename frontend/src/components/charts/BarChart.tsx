import React from 'react'

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: DataPoint[]
  height?: number
  showValues?: boolean
  title?: string
  valueFormatter?: (value: number) => string
}

export default function BarChart({ 
  data, 
  height = 300, 
  showValues = true, 
  title,
  valueFormatter = (value) => value.toLocaleString()
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const barWidth = Math.max(40, (100 - data.length * 5) / data.length)

  return (
    <div className="bg-white p-4 rounded-lg border">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Y-axis labels */}
          <g className="text-xs text-gray-600">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = height - 40 - (ratio * (height - 60))
              const value = maxValue * ratio
              return (
                <g key={i}>
                  <line
                    x1="40"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="35"
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-500 text-xs"
                  >
                    {valueFormatter(value)}
                  </text>
                </g>
              )
            })}
          </g>

          {/* Bars */}
          <g>
            {data.map((item, index) => {
              const barHeight = ((item.value / maxValue) * (height - 60))
              const x = 50 + (index * (barWidth + 10))
              const y = height - 40 - barHeight
              const color = item.color || '#3b82f6'

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    className="transition-opacity hover:opacity-80"
                    rx="2"
                  />
                  
                  {showValues && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      className="fill-gray-700 text-xs font-medium"
                    >
                      {valueFormatter(item.value)}
                    </text>
                  )}
                  
                  {/* X-axis label */}
                  <text
                    x={x + barWidth / 2}
                    y={height - 20}
                    textAnchor="middle"
                    className="fill-gray-600 text-xs"
                  >
                    {item.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}