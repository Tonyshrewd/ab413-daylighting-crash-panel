# 01_build_panel.R
# Builds the city x month panel for the AB 413 daylighting study
# (staggered difference-in-differences) from the CCRS aggregate in data/panel_raw.csv.
#
# Run from the repository root:   Rscript R/01_build_panel.R
# Output: data/daylighting_panel.csv            (6 study cities, the analysis panel)
#         data/daylighting_panel_all12_cities.csv (all 12 reviewed jurisdictions, robustness only)
# Base R only; no packages needed.

raw <- read.csv("data/panel_raw.csv", stringsAsFactors = FALSE)
outcomes <- setdiff(names(raw), c("city", "month"))
stopifnot(sum(raw$all_inj_crashes) == 299990)          # total injury + fatal crashes, 12 jurisdictions

# ---- citation start dates at unpainted curbs (sources in the xlsx, sheet treatment_dates) ----
treat <- data.frame(
  city = c("Oxnard", "Lodi", "San Diego", "Gilroy", "LA County unincorporated", "Sacramento",
           "Pacifica", "Pomona", "Oakland", "San Francisco", "Citrus Heights", "Los Angeles (city)"),
  citation_start_date = c("2025-01-01", "2025-01-31", "2025-03-01", "2025-04-01", NA, "2025-07-01",
                          "2025-08-01", "2025-09-12", "2025-10-01", NA, NA, NA),
  role = c("Treated", "Excluded", "Treated", "Excluded", "Excluded", "Treated",
           "Excluded", "Treated", "Treated (last to start)", "Excluded",
           "Never treated (comparison)", "Excluded"),
  stringsAsFactors = FALSE)
stopifnot(setequal(treat$city, raw$city))
study <- c("Oxnard", "San Diego", "Sacramento", "Pomona", "Oakland", "Citrus Heights")

# ---- balanced grid: every jurisdiction x every month, Jan 2019 - Oct 2026 ----
months <- format(seq(as.Date("2019-01-01"), as.Date("2026-10-01"), by = "month"), "%Y-%m")
grid <- expand.grid(month = months, city = treat$city, stringsAsFactors = FALSE)[, c("city", "month")]
p <- merge(grid, raw, by = c("city", "month"), all.x = TRUE)
filled <- rowSums(is.na(p[, outcomes])) == length(outcomes)
p[, outcomes][is.na(p[, outcomes])] <- 0
p$no_records_this_month <- as.integer(filled)
stopifnot(sum(p$all_inj_crashes) == 299990)

# ---- time variables ----
p$year      <- as.integer(substr(p$month, 1, 4))
p$month_num <- as.integer(substr(p$month, 6, 7))
p$t         <- (p$year - 2019L) * 12L + p$month_num        # Jan 2019 = 1 ... Oct 2026 = 94
p <- merge(p, treat, by = "city")

# ---- treatment timing ----
# g_first_treated = t of the first month in which citations applied for most of the month:
# start on day 1-15 -> that month; day 16 or later -> next month. 0 = never treated (did / csdid convention).
d   <- as.Date(p$citation_start_date)
gy  <- as.integer(format(d, "%Y")); gm <- as.integer(format(d, "%m"))
late <- as.integer(format(d, "%d")) > 15
gm  <- gm + late; gy <- gy + (gm > 12); gm <- ifelse(gm > 12, gm - 12L, gm)
p$g_first_treated <- ifelse(is.na(d), 0L, (gy - 2019L) * 12L + gm)
p$post       <- as.integer(p$g_first_treated > 0 & p$t >= p$g_first_treated)
p$event_time <- ifelse(p$g_first_treated > 0, p$t - p$g_first_treated, NA)
la <- p$city == "LA County unincorporated"                    # sources give conflicting start dates
p$g_first_treated[la] <- NA; p$post[la] <- NA; p$event_time[la] <- NA

p$in_analysis_window <- as.integer(p$month >= "2019-01" & p$month <= "2026-03")
p$provisional_month  <- as.integer(p$month >= "2026-04")      # reports still arriving
p$covid_2020         <- as.integer(p$year == 2020)

front <- c("city", "month", "year", "month_num", "t", "role", "citation_start_date", "g_first_treated",
           "post", "event_time", "in_analysis_window", "provisional_month", "covid_2020", "no_records_this_month")
p <- p[order(p$city, p$t), c(front, outcomes)]
rownames(p) <- NULL

write.csv(p, "data/daylighting_panel_all12_cities.csv", row.names = FALSE, na = "")
panel <- p[p$city %in% study, ]
write.csv(panel, "data/daylighting_panel.csv", row.names = FALSE, na = "")

# ---- checks ----
aw <- panel[panel$in_analysis_window == 1, ]
stopifnot(nrow(panel) == 6 * 94, nrow(aw) == 522,
          sum(aw$pb_inj_intersection) == 9718, sum(aw$all_inj_crashes) == 98141,
          all(panel$pb_inj_intersection <= panel$pb_inj_within_100ft),
          all(panel$pb_inj_within_100ft <= panel$pb_inj_all_locations))
g <- unique(panel[, c("city", "g_first_treated")])
print(g[order(g$g_first_treated), ], row.names = FALSE)
cat("Wrote data/daylighting_panel.csv:", nrow(panel), "rows;",
    "analysis window:", nrow(aw), "city-months,", sum(aw$pb_inj_intersection),
    "pedestrian/cyclist intersection injury crashes\n")
