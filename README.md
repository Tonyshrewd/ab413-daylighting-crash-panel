# Does Enforcing Daylighting Make Intersections Safer? Evidence from the Staggered Rollout of California's AB 413

## Research question

Did the start of citation enforcement under California's daylighting law (AB 413) reduce pedestrian and cyclist injury crashes at intersections in the cities that adopted it?

## Hypotheses

**H1:** After a city begins issuing daylighting citations, its monthly count of pedestrian and cyclist injury crashes at intersections falls, relative to cities that have not begun issuing citations.

**H0:** The start of citation enforcement has no effect on pedestrian and cyclist injury crashes at intersections, relative to cities that have not begun issuing citations.

Daylighting removes parked cars that block sightlines at crosswalks, so drivers see pedestrians and cyclists sooner and they see drivers sooner. Citations are what make drivers comply, so the citation start date is when crashes should begin to fall.

Two secondary predictions test the mechanism:

- **Location:** pedestrian/cyclist crashes far from intersections (more than 250 ft from the cross street) should change little, because the law does not target those locations.
- **Visibility:** the drop should be at least as large in dark conditions as in daylight, since sightlines matter most when visibility is already low.

## Background: AB 413 and daylighting

**Daylighting** means keeping the curb space just before a crosswalk clear of parked cars, so people crossing and drivers approaching can see each other.

- AB 413 was signed on October 10, 2023, and created California Vehicle Code section 22500(n).
- It bans stopping, standing or parking within 20 ft of the vehicle approach side of any marked or unmarked crosswalk (15 ft where there is a curb extension). On one-way streets both curbs are covered.
- It applies whether or not the curb is painted red.
- Before January 1, 2025, cities could only issue warnings except where the zone was marked with paint or a sign. From January 1, 2025, they could issue citations everywhere.
- Each city then chose its own warning period and citation start date. The study uses that variation.

## Study design

Staggered difference-in-differences. Each city's change in crashes after its citation start date is compared with the change in cities that had not yet started over the same months, and with Citrus Heights, which never set a fine.

| City | Warnings began | Citations began | Role |
| --- | --- | --- | --- |
| Oxnard | Sept 2024 | Jan 1, 2025 | Treated |
| San Diego | Jan 1, 2025 | Mar 1, 2025 | Treated |
| Sacramento | Before Jul 1, 2025 | Jul 1, 2025 | Treated |
| Pomona | Not published | Sept 12, 2025 | Treated |
| Oakland | Jan 2025 | Oct 1, 2025 | Treated (last to start) |
| Citrus Heights | Not published | None: City Council rejected a fine on Sept 24, 2025 | Never treated (comparison) |

Six other jurisdictions were reviewed and excluded: Lodi, Gilroy and Pacifica (too few crashes to measure), LA County unincorporated (sources give conflicting start dates), and San Francisco and Los Angeles city (partly treated through enforced red curbs; Los Angeles crash reporting also changed in 2021). Each reason and source is in the spreadsheet, sheet `treatment_dates`.

**Analysis window:** Jan 2019 – Mar 2026: 522 city-months and 9,718 pedestrian/cyclist injury crashes at intersections. Apr – Oct 2026 are included but flagged as provisional because crash reports are still arriving.

## Data

**Source:** California Crash Reporting System (CCRS), California Highway Patrol, <https://data.ca.gov/dataset/ccrs>. Files `Crashes_2019` – `Crashes_2026` and `Parties_2019` – `Parties_2026`, CHP update of Oct 5, 2026. Only injury and fatal crashes are kept.

| File | Contents |
| --- | --- |
| `data/daylighting_panel.xlsx` | **Start here.** The panel plus documentation: README, data dictionary, treatment dates with sources, annual summary, file statistics |
| `data/daylighting_panel.csv` | The panel only: 6 cities × 94 months (Jan 2019 – Oct 2026), 26 columns |
| `data/daylighting_panel_all12_cities.csv` | All 12 reviewed jurisdictions, for robustness checks |
| `data/panel_raw.csv` | City-month crash counts aggregated from CCRS |
| `R/01_build_panel.R` | Rebuilds both panel CSVs from `panel_raw.csv` (`Rscript R/01_build_panel.R`, base R) |
| `tools/ccrs_filter_browser.js` | The filter that produced `panel_raw.csv` from the CCRS files |

**Main outcome (`pb_inj_intersection`):** pedestrian and cyclist injury crashes at the intersection, meaning a cross street is recorded and the crash is 0–20 ft from it. Definitions of every column are in the spreadsheet, sheet `data_dictionary`.

## Limitations

- Citrus Heights' never-treated status is documented through the Sept 24, 2025 council vote; comparisons after Sept 2025 assume it remained without a fine.
- Citrus Heights is small (about 1.7 pedestrian/cyclist intersection injury crashes a month), so after Sept 2025, when it is the only untreated city, comparisons are imprecise.
- CCRS records distance from the cross street, not from the crosswalk or by direction of approach, so "at intersection" approximates the area AB 413 covers.

## Status

Data assembled for review. Analysis has not started.
