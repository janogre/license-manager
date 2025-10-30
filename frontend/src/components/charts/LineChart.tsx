import React from 'react'

interface DataPoint {
  label: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  height?: number
  title?: string
  valueFormatter?: (value: number) => string
  color?: string
}

export default function LineChart({ 
  data, 
  height = 300, 
  title,
  valueFormatter = (value) => value.toLocaleString(),
  color = '#3b82f6'
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  // Calculate SVG path points
  const chartWidth = 100 - 10 // Account for padding
  const chartHeight = height - 80 // Account for margins
  
  const points = data.map((item, index) => {
    const x = 50 + (index / (data.length - 1)) * chartWidth
    const y = 40 + ((maxValue - item.value) / range) * chartHeight
    return { x, y, value: item.value, label: item.label }
  })

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

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
              const y = 40 + (ratio * chartHeight)
              const value = maxValue - (ratio * range)
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

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="transition-opacity hover:opacity-80"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={color}
                className="transition-all hover:r-6"
              />
              
              {/* Tooltip on hover */}
              <g className="opacity-0 hover:opacity-100 transition-opacity">
                <rect
                  x={point.x - 30}
                  y={point.y - 35}
                  width="60"
                  height="25"
                  fill="rgba(0,0,0,0.8)"
                  rx="4"
                />
                <text
                  x={point.x}
                  y={point.y - 18}
                  textAnchor="middle"
                  className="fill-white text-xs font-medium"
                >
                  {valueFormatter(point.value)}
                </text>
              </g>
              
              {/* X-axis label */}
              <text
                x={point.x}
                y={height - 15}
                textAnchor="middle"
                className="fill-gray-600 text-xs"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}