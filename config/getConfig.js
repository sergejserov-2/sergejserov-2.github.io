export function getConfig() {
  let raw = null;

  try {
    const saved = localStorage.getItem("gameConfig");
    raw = saved ? JSON.parse(saved) : null;
  } catch (e) {
    raw = null;
  }

  const config = {
    mode: raw?.mode ?? "solo",
    area: raw?.area ?? "europe",
    players: raw?.players ?? ["p1"],

    rules: {
      rounds: normalize(raw?.rules?.rounds, 5),
      time: normalize(raw?.rules?.time, -1),
      moves: normalize(raw?.rules?.moves, -1)
    }
  };

  validate(config);

  return config;
}

// =========================
// HELPERS
// =========================

function normalize(v, def) {
  return typeof v === "number" && !isNaN(v) ? v : def;
}

function validate(cfg) {
  if (cfg.rules.rounds <= 0 || cfg.rules.rounds > 20) {
    cfg.rules.rounds = 5;
  }

  if (cfg.rules.time < -1) {
    cfg.rules.time = -1;
  }

  if (cfg.rules.moves < -1) {
    cfg.rules.moves = -1;
  }
}
