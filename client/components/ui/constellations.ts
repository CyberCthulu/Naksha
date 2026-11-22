type CatalogStar = {
  /** J2000 right ascension and declination, in degrees. */
  ra: number
  dec: number
}

type Constellation = {
  id: string
  stars: Readonly<Record<string, CatalogStar>>
}

/**
 * Main-star coordinates rounded to 0.01 degrees from SIMBAD (CDS):
 * https://simbad.cds.unistra.fr/simbad/sim-id?Ident=alf+Ori
 * https://simbad.cds.unistra.fr/simbad/sim-id?Ident=bet+Cas
 * Figure references: IAU / Sky & Telescope constellation charts:
 * https://iauarchive.eso.org/static/public/constellations/pdf/CAS.pdf
 * https://www.eso.org/public/images/eso1121b/
 *
 * Rendered as separate decorative star groups, without connecting lines.
 * Their placements are not a map of the current or the user's birth sky.
 */
export const CONSTELLATIONS: readonly Constellation[] = [
  {
    id: 'cassiopeia',
    stars: {
      caph: { ra: 2.29, dec: 59.15 },
      schedar: { ra: 10.13, dec: 56.54 },
      gammaCas: { ra: 14.18, dec: 60.72 },
      ruchbah: { ra: 21.45, dec: 60.24 },
      segin: { ra: 28.6, dec: 63.67 },
    },
  },
  {
    id: 'orion',
    stars: {
      betelgeuse: { ra: 88.79, dec: 7.41 },
      bellatrix: { ra: 81.28, dec: 6.35 },
      meissa: { ra: 83.78, dec: 9.93 },
      mintaka: { ra: 83.0, dec: -0.3 },
      alnilam: { ra: 84.05, dec: -1.2 },
      alnitak: { ra: 85.19, dec: -1.94 },
      etaOri: { ra: 81.12, dec: -2.4 },
      tauOri: { ra: 79.4, dec: -6.84 },
      rigel: { ra: 78.63, dec: -8.2 },
      saiph: { ra: 86.94, dec: -9.67 },
    },
  },
]

/** Local gnomonic projection, north up and east left, with one uniform scale. */
export function projectConstellation(constellation: Constellation) {
  const entries = Object.entries(constellation.stars)
  const radians = Math.PI / 180
  const ra0 =
    (entries.reduce((sum, [, star]) => sum + star.ra, 0) / entries.length) *
    radians
  const dec0 =
    (entries.reduce((sum, [, star]) => sum + star.dec, 0) / entries.length) *
    radians
  const points = entries.map(([id, star]) => {
    const ra = star.ra * radians - ra0
    const dec = star.dec * radians
    const denominator =
      Math.sin(dec0) * Math.sin(dec) +
      Math.cos(dec0) * Math.cos(dec) * Math.cos(ra)

    return {
      id,
      x: (-Math.cos(dec) * Math.sin(ra)) / denominator,
      y:
        -(
          Math.cos(dec0) * Math.sin(dec) -
          Math.sin(dec0) * Math.cos(dec) * Math.cos(ra)
        ) / denominator,
    }
  })
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const extent = Math.max(maxX - minX, maxY - minY)

  return {
    id: constellation.id,
    stars: Object.fromEntries(
      points.map(({ id, x, y }) => [
        id,
        {
          x: 0.5 + (x - (minX + maxX) / 2) / extent,
          y: 0.5 + (y - (minY + maxY) / 2) / extent,
        },
      ])
    ),
  }
}

// Catalog projection happens once, never during an animation or route change.
export const PROJECTED_CONSTELLATIONS = CONSTELLATIONS.map(projectConstellation)
