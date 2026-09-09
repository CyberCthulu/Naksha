import { Circle, G } from 'react-native-svg'

import { PROJECTED_CONSTELLATIONS } from './constellations'
import { theme } from './theme'

/** Fixed groups of stars without connecting lines, below app content. */
export function ConstellationField({
  width,
  height,
}: {
  width: number
  height: number
}) {
  return (
    <>
      {PROJECTED_CONSTELLATIONS.map((constellation) => {
        const upper = constellation.id === 'cassiopeia'
        // Uniform scaling preserves sky geometry on phones, tablets and sheets.
        const size = Math.min(width * (upper ? 0.43 : 0.36), height * 0.24, 180)
        const x = upper ? width - size - width * 0.05 : width * 0.02
        const y = height * (upper ? 0.14 : 0.65)
        const points = Object.fromEntries(
          Object.entries(constellation.stars).map(([id, point]) => [
            id,
            {
              x: x + point.x * size,
              y: y + point.y * size,
            },
          ])
        )

        return (
          <G
            key={constellation.id}
            testID={`background-constellation-${constellation.id}`}
          >
            {Object.entries(points).map(([id, point]) => (
              <G key={id}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  fill={theme.atmosphere.star}
                  opacity={0.055}
                />
                <Circle
                  testID={`constellation-star-${id}`}
                  cx={point.x}
                  cy={point.y}
                  r={1.15}
                  fill={theme.atmosphere.star}
                  opacity={0.62}
                />
              </G>
            ))}
          </G>
        )
      })}
    </>
  )
}
