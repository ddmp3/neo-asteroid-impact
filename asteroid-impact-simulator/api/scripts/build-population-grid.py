#!/usr/bin/env python3
"""
Build src/data/population/worldpop2020_{2p5min,30min}.bin from the WorldPop 2020 global
1 km mosaic (v2.1.1).

Source (CC BY 4.0):
  WorldPop (www.worldpop.org), Global High Resolution Population Denominators,
  2020, 30 arc-second (~1 km) unconstrained mosaic, people per pixel:
  https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/0_Mosaicked/ppp_2020_1km_Aggregated.tif
  (870 MB, 43200 x 18720 cells, lat 84N to 72S)

Processing:
  1. nodata / negative values -> 0
  2. sum 5 x 5 cells -> 2.5 arc-minute cells (~4.6 km at the equator), the
     resolution of NASA SEDAC GPW. Population counts are preserved exactly.
  3. round to integer people (uint32)
  4. split into bands of BAND_ROWS rows, each zlib-compressed, so the API only
     decompresses the bands an impact touches.

File layout (little-endian):
  magic 'WPOP' | u32 version=1 | u32 nrows | u32 ncols | f64 cellDeg |
  f64 lat0 (north edge) | f64 lon0 (west edge) | u32 bandRows | u32 nbands |
  u32[nbands+1] byte offsets of the bands from the start of the file | bands

Usage:
  pip install rasterio numpy
  python3 scripts/build-population-grid.py ppp_2020_1km_Aggregated.tif
"""
import struct
import sys
import zlib

import numpy as np
import rasterio

# (aggregation factor from 30", band rows, output file)
GRIDS = [
    (5, 32, 'src/data/population/worldpop2020_2p5min.bin'),   # 2.5' (~4.6 km), radii < 300 km
    (60, 360, 'src/data/population/worldpop2020_30min.bin'),  # 30'  (~55 km), radii >= 300 km
]


def build(a, cell, lat0, lon0, K, BAND_ROWS, OUT):
    H, W = a.shape
    h, w = H // K * K, W // K * K
    g = a[:h, :w].reshape(h // K, K, w // K, K).sum(axis=(1, 3))
    g = np.rint(g).astype('<u4')
    nrows, ncols = g.shape
    nbands = (nrows + BAND_ROWS - 1) // BAND_ROWS
    blocks = [zlib.compress(g[i * BAND_ROWS:(i + 1) * BAND_ROWS].tobytes(), 9) for i in range(nbands)]
    header = struct.pack('<4sIIIdddII', b'WPOP', 1, nrows, ncols, cell * K, lat0, lon0, BAND_ROWS, nbands)
    offsets = []
    pos = len(header) + 4 * (nbands + 1)
    for b in blocks:
        offsets.append(pos)
        pos += len(b)
    offsets.append(pos)
    with open(OUT, 'wb') as f:
        f.write(header)
        f.write(struct.pack('<%dI' % (nbands + 1), *offsets))
        for b in blocks:
            f.write(b)
    print(f'{OUT}: {nrows}x{ncols} cells of {cell * K * 60:.2f} arcmin, '
          f'{nbands} bands, {pos / 1e6:.1f} MB, total population {g.sum() / 1e9:.3f} bn')


def main(path):
    src = rasterio.open(path)
    a = src.read(1, out_dtype='float32')
    nd = src.nodata
    a[(a == nd) | (a < 0) | ~np.isfinite(a)] = 0
    t = src.transform
    for K, band_rows, out in GRIDS:
        build(a, t.a, t.f, t.c, K, band_rows, out)


if __name__ == '__main__':
    main(sys.argv[1])
