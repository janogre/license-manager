import { Server } from 'lucide-react'

interface RackUnit {
  id: number
  position: number
  name: string
  occupied: boolean
  device?: {
    id: number
    name: string
    display: string
  }
}

interface RackElevationProps {
  rackName: string
  height: number
  units: RackUnit[]
}

export function RackElevation({ rackName, height, units }: RackElevationProps) {
  // Create a map of position to unit for quick lookup
  const unitMap = new Map<number, RackUnit>()
  units.forEach((unit) => {
    unitMap.set(unit.position, unit)
  })

  // Generate all rack positions from 1 to height
  const allPositions = Array.from({ length: height }, (_, i) => height - i)

  // Group consecutive occupied units by device
  const deviceGroups: Array<{ startPos: number; endPos: number; device: any }> = []
  let currentDevice: any = null
  let startPos = 0

  allPositions.forEach((pos) => {
    const unit = unitMap.get(pos)
    if (unit?.occupied && unit.device) {
      if (currentDevice?.id === unit.device.id) {
        // Continue current device group
      } else {
        // Start new device group
        if (currentDevice) {
          deviceGroups.push({ startPos, endPos: pos + 1, device: currentDevice })
        }
        currentDevice = unit.device
        startPos = pos
      }
    } else {
      if (currentDevice) {
        deviceGroups.push({ startPos, endPos: pos + 1, device: currentDevice })
        currentDevice = null
      }
    }
  })
  if (currentDevice) {
    deviceGroups.push({ startPos, endPos: 1, device: currentDevice })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{rackName}</h3>
        <p className="text-sm text-gray-600">{height}U Rack Elevation</p>
      </div>

      <div className="flex gap-6">
        {/* Rack visualization */}
        <div className="flex-1 max-w-md">
          <div className="border-4 border-gray-700 bg-gray-100 rounded">
            {allPositions.map((position) => {
              const unit = unitMap.get(position)
              const isOccupied = unit?.occupied || false
              const device = unit?.device

              // Check if this position is part of a multi-unit device
              const deviceGroup = deviceGroups.find(
                (g) => position <= g.startPos && position >= g.endPos
              )
              const isFirstInGroup =
                deviceGroup && position === deviceGroup.startPos
              const isMiddleInGroup =
                deviceGroup &&
                position < deviceGroup.startPos &&
                position > deviceGroup.endPos

              return (
                <div
                  key={position}
                  className="flex items-center border-b border-gray-300 h-8 relative"
                >
                  {/* Position label */}
                  <div className="w-12 bg-gray-700 text-white text-xs text-center py-1 font-mono">
                    U{position}
                  </div>

                  {/* Unit content */}
                  <div
                    className={`flex-1 px-2 h-full flex items-center ${
                      isOccupied
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {isOccupied && (
                      <>
                        <Server className="h-3 w-3 mr-1 flex-shrink-0" />
                        {isFirstInGroup && device && (
                          <span className="text-xs truncate font-medium">
                            {device.display}
                          </span>
                        )}
                        {isMiddleInGroup && (
                          <span className="text-xs text-blue-200">
                            ↕ {deviceGroup?.device.display}
                          </span>
                        )}
                        {!isFirstInGroup && !isMiddleInGroup && device && (
                          <span className="text-xs truncate font-medium">
                            {device.display}
                          </span>
                        )}
                      </>
                    )}
                    {!isOccupied && (
                      <span className="text-xs">Available</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend and device list */}
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Legend
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded border border-gray-300"></div>
                <span className="text-gray-700">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-50 rounded border border-gray-300"></div>
                <span className="text-gray-700">Available</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Devices in Rack
            </h4>
            <div className="space-y-2">
              {deviceGroups.length === 0 && (
                <p className="text-sm text-gray-500">No devices installed</p>
              )}
              {deviceGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {group.device.display}
                      </div>
                      <div className="text-xs text-gray-500">
                        {group.device.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        U{group.endPos}
                        {group.startPos !== group.endPos &&
                          ` - U${group.startPos}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Units</div>
                <div className="text-lg font-semibold text-gray-900">
                  {height}U
                </div>
              </div>
              <div>
                <div className="text-gray-600">Occupied</div>
                <div className="text-lg font-semibold text-blue-600">
                  {units.filter((u) => u.occupied).length}U
                </div>
              </div>
              <div>
                <div className="text-gray-600">Available</div>
                <div className="text-lg font-semibold text-green-600">
                  {height - units.filter((u) => u.occupied).length}U
                </div>
              </div>
              <div>
                <div className="text-gray-600">Utilization</div>
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(
                    (units.filter((u) => u.occupied).length / height) * 100
                  )}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
