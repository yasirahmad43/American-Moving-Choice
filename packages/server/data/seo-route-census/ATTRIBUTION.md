# Route comparison Census snapshot

`places-2023.json` contains aggregate U.S. Census Bureau **2019–2023 ACS 5-year estimates** for 3,160 Census places with at least 10,000 residents in the existing place dataset. It was retrieved on 2026-10-29 from the Bureau's documented [table-based Summary File](https://www.census.gov/programs-surveys/acs/data/summary-file.html). The JSON records each original download URL, complete-file SHA-256, byte count and matched-place count.

| Table | Measures retained |
| --- | --- |
| B25064 | Median gross rent and margin of error |
| B25077 | Median owner-occupied home value and margin of error |
| B19013 | Median household income and margin of error |
| B25018 | Median rooms and margin of error |
| B25035 | Median year built and margin of error |
| B25003 | Occupied, owner-occupied and renter-occupied housing counts/MOEs |
| B25024 | Housing-unit counts/MOEs by structure size |
| B25002 | Occupancy counts/MOEs, retained in the snapshot; not currently rendered |

The primary files are under `https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/acsdt5y2023-{table}.dat`. [Official variable definitions](https://api.census.gov/data/2023/acs/acs5/groups.html) identify each table's universe and fields. B25024 lines 004–005 are combined for 2–4-unit structures; lines 007–009 for 10+-unit structures. Tenure uses occupied homes as its denominator; structure shares use all housing units.

Currency figures are historical estimates in 2023 dollars, not current asking prices or moving charges. Published median MOEs are displayed as 90% margins. Derived shares and differences are point-estimate arithmetic; no uncertainty interval or statistical-significance finding is asserted for them. Empty, negative-sentinel, nonfinite or nonordinary-MOE observations are withheld from exact comparisons, including capped/suppressed medians. City-wide structure shares do not predict an address's stairs, elevators, parking or moving charges.

Reproduce from the repository root:

```text
node tools/build-route-census.mjs
```

The builder streams the eight public files, uses two downloads at a time, checks required estimate/MOE fields and refuses any changed pinned source checksum before replacing the snapshot. It requires no Census API key. Production builds use the bundled snapshot and make no Census download. Census source material is attributed to the U.S. Census Bureau; no third-party housing-price model or listing feed is implied.
