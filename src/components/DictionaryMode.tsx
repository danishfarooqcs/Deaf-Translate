import { useMemo, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { VOCABULARY, CATEGORIES } from "../utils/vocabulary";

export default function DictionaryMode() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    return VOCABULARY.filter((v) => {
      const matchesQuery = v.word.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || v.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="section-wrap">
      <div className="section-title-row">
        <div>
          <div className="section-title">Dictionary Mode</div>
          <div className="section-subtitle">
            {VOCABULARY.length} words · {VOCABULARY.filter((v) => v.liveDetectable).length} recognized live by the
            camera, the rest shown as reference
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{ position: "absolute", left: 10, top: 10, color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search words…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 32, width: 200 }}
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen />
          <div>No signs match "{query}". Try another search term.</div>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((entry) => (
            <div className="card" key={entry.word}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 15 }}>{entry.word}</strong>
                <span className={`badge ${entry.liveDetectable ? "live" : "reference"}`}>
                  {entry.liveDetectable ? "Live" : "Reference"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                {entry.category}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {entry.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
