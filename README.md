# artemis.fyi

Real-time mission tracker for NASA's Artemis program. Currently tracking **Artemis II**, the first crewed mission to the Moon since Apollo 17.

**Live at [artemis.fyi](https://artemis.fyi)**

## Features

- **Interactive trajectory visualization** - 2D plot of the spacecraft's path with Earth, Moon, and phase-colored segments
- **Mission timeline** - Draggable scrubber with phase labels, milestone markers, playback controls
- **Mission status panel** - MET, current phase, next milestone, crew activity, live telemetry
- **Telemetry charts** - Distance, velocity, and range rate over time
- **Crew activity schedule** - Transcribed from NASA's published flight plan
- **Milestone tracking** - Mission milestones with completion status and countdown timers
- **Deep Space Network status** - Live ground station connections, signal strength, measured range (updates every 10s)
- **Unit toggle** - km/mi switching
- **Live stream** - Embedded NASA broadcast

## Data Sources

- [JPL Horizons API](https://ssd.jpl.nasa.gov/horizons/) - spacecraft and Moon ephemeris data
- [NASA DSN Now](https://eyes.nasa.gov/dsn/dsn.html) - live Deep Space Network ground station status ([XML feed](https://eyes.nasa.gov/dsn/data/dsn.xml))
- [NASA flight plan](https://www.nasa.gov/missions/artemis/nasas-artemis-ii-moon-mission-daily-agenda/) - crew activity schedule and milestones

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**
- **Recharts** for telemetry charts
- **SQLite** (better-sqlite3) for trajectory data caching

## Getting Started

```bash
npm install
npm run dev
```

On first load, the app fetches the full mission trajectory from JPL Horizons and caches it in a local SQLite database. Subsequent loads are instant.

## Deploy

This repo includes a `render.yaml` blueprint for Render.com. Connect the repo and it will auto-deploy with a persistent disk for the SQLite database.

## How It Works

1. **Startup**: Fetches spacecraft + Moon ephemeris from JPL Horizons for the full mission at 5-minute intervals
2. **Caching**: Stores all data points in SQLite with WAL mode for concurrent reads
3. **Live updates**: Every 5 minutes, checks for new data points from Horizons and backfills gaps
4. **DSN**: Polls NASA's DSN XML feed every 10 seconds for live ground station status
5. **Frontend**: Polls `/api/telemetry` every 60 seconds; MET clock ticks client-side every second
6. **Playback**: Timeline scrubber and play controls are fully client-side, using cached trajectory data

## Future Missions

This project is designed to support future Artemis missions. The mission-specific configuration (launch time, milestones, crew, activities) is isolated in `lib/milestones.ts`, `lib/activities.ts`, and component data. The trajectory fetching and visualization infrastructure is reusable across missions.
