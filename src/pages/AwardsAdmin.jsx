import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import { getApiBaseUrl } from "../shared/api/client";
import { getAwardIconSources, handleAwardIconFallback } from "../utils/awardIcons";

const Page = styled.div`
  min-height: 100vh;
  background: #f6f7fb;
`;

const Container = styled.div`
  width: min(1100px, 96vw);
  margin: 0 auto;
  padding: 1rem 0 2rem;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e7eaf3;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const FormSection = styled.div`
  border: 1px solid #edf1fb;
  background: #f9fbff;
  border-radius: 10px;
  padding: 0.9rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem 1.1rem;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    gap: 0.9rem;

    > * {
      grid-column: 1 / -1 !important;
      min-width: 0;
    }
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  margin-top: 0.35rem;
  background: #fcfdff;
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  margin-top: 0.35rem;
  background: #fcfdff;
`;

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  margin-top: 0.35rem;
  background: #fcfdff;
`;

const Button = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.55rem 0.9rem;
  background: #14532d;
  color: white;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  background: white;
  cursor: pointer;
`;

const PagerButton = styled.button`
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.4rem 0.65rem;
  background: ${({ $active }) => ($active ? "#14532d" : "white")};
  color: ${({ $active }) => ($active ? "white" : "#111827")};
  cursor: pointer;
`;

const Badge = styled.span`
  font-size: 0.8rem;
  background: #eef2ff;
  color: #3148a8;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
`;

const IconButton = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
  border-radius: 8px;
`;

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const LightboxCard = styled.div`
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 0.8rem;
  max-width: min(92vw, 820px);
  max-height: 92vh;
`;

const LightboxImage = styled.img`
  display: block;
  max-width: min(88vw, 780px);
  max-height: 82vh;
  width: auto;
  height: auto;
  border-radius: 8px;
`;

const LightboxClose = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  background: #111827;
  color: #fff;
  cursor: pointer;
`;

function authHeaders(authToken) {
  return {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export default function AwardsAdmin() {
  const { userId, authToken, isLoggedIn } = useUser();
  const apiBase = getApiBaseUrl();

  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [awardCode, setAwardCode] = useState("");
  const [awardCategory, setAwardCategory] = useState("");

  const [awardId, setAwardId] = useState("");
  const [level, setLevel] = useState("");
  const [threshold, setThreshold] = useState("");
  const [ep, setEp] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [descriptionDe, setDescriptionDe] = useState("");
  const [iconFile, setIconFile] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [expandedAwardIds, setExpandedAwardIds] = useState([]);

  const [lightboxSrc, setLightboxSrc] = useState("");
  const [lightboxTitle, setLightboxTitle] = useState("");

  const isAdmin = Number(userId) === 1;
  const sortedAwards = useMemo(
    () => [...awards].sort((a, b) => Number(b.id) - Number(a.id)),
    [awards]
  );

  const categories = useMemo(() => {
    const values = new Set();
    sortedAwards.forEach((award) => {
      const category = (award.category || "").trim();
      if (category) values.add(category);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "de"));
  }, [sortedAwards]);

  const filteredAwards = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return sortedAwards.filter((award) => {
      if (categoryFilter !== "all" && (award.category || "") !== categoryFilter) {
        return false;
      }
      if (!query) return true;

      const inAward =
        String(award.id).includes(query)
        || String(award.code || "").toLowerCase().includes(query)
        || String(award.category || "").toLowerCase().includes(query);
      if (inAward) return true;

      return (award.levels || []).some((lvl) =>
        String(lvl.title_de || "").toLowerCase().includes(query)
        || String(lvl.description_de || "").toLowerCase().includes(query)
      );
    });
  }, [sortedAwards, searchTerm, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAwards.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const visibleAwards = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAwards.slice(start, start + pageSize);
  }, [filteredAwards, safePage, pageSize]);

  const loadAwards = async () => {
    if (!apiBase || !authToken) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/awards/get_awards.php`, {
        headers: authHeaders(authToken),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Awards konnten nicht geladen werden.");
      }
      setAwards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAwards();
  }, [apiBase, authToken]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, pageSize]);

  useEffect(() => {
    if (!lightboxSrc) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightboxSrc("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxSrc]);

  const submitAward = async (e) => {
    e.preventDefault();
    setInfo("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("code", awardCode);
      formData.append("category", awardCategory);

      const res = await fetch(`${apiBase}/awards/add_award.php`, {
        method: "POST",
        headers: authHeaders(authToken),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.success !== true) {
        throw new Error(data?.error || "Award konnte nicht angelegt werden.");
      }

      setInfo("Award angelegt.");
      setAwardCode("");
      setAwardCategory("");
      await loadAwards();
    } catch (err) {
      setError(err.message || "Unbekannter Fehler");
    }
  };

  const submitLevel = async (e) => {
    e.preventDefault();
    setInfo("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("award_id", awardId);
      formData.append("level", level);
      formData.append("threshold", threshold);
      formData.append("ep", ep || "0");
      formData.append("title_de", titleDe);
      formData.append("description_de", descriptionDe);
      if (iconFile) formData.append("icon_file", iconFile);

      const res = await fetch(`${apiBase}/awards/save_award_level.php`, {
        method: "POST",
        headers: authHeaders(authToken),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.success !== true) {
        throw new Error(data?.error || "Level konnte nicht gespeichert werden.");
      }

      setInfo("Award-Level gespeichert.");
      setIconFile(null);
      await loadAwards();
    } catch (err) {
      setError(err.message || "Unbekannter Fehler");
    }
  };

  const prefillLevel = (award, levelData) => {
    setAwardId(String(award.id));
    setLevel(String(levelData.level));
    setThreshold(String(levelData.threshold ?? ""));
    setEp(String(levelData.ep ?? "0"));
    setTitleDe(levelData.title_de ?? "");
    setDescriptionDe(levelData.description_de ?? "");
    setIconFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAwardExpanded = (awardIdValue) => {
    setExpandedAwardIds((prev) => (
      prev.includes(awardIdValue)
        ? prev.filter((id) => id !== awardIdValue)
        : [...prev, awardIdValue]
    ));
  };

  const expandAllVisible = () => {
    setExpandedAwardIds((prev) => {
      const next = new Set(prev);
      visibleAwards.forEach((award) => next.add(award.id));
      return Array.from(next);
    });
  };

  const collapseAllVisible = () => {
    const visibleIds = new Set(visibleAwards.map((award) => award.id));
    setExpandedAwardIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  if (!isLoggedIn) {
    return (
      <Page>
        <Header />
        <Container>
          <Card>Bitte einloggen.</Card>
        </Container>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <Page>
        <Header />
        <Container>
          <Card>Kein Zugriff. Diese Seite ist nur für Admins.</Card>
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <h1 style={{ margin: 0 }}>Award-Verwaltung</h1>
          <p style={{ margin: "0.4rem 0 0", color: "#4b5563" }}>
            Suche, Filter und Pagination für große Award-Mengen. Icon-Vorschau nutzt WebP mit Fallback.
          </p>
        </Card>

        {error && <Card style={{ borderColor: "#fecaca", color: "#9f1239" }}>{error}</Card>}
        {info && <Card style={{ borderColor: "#bbf7d0", color: "#166534" }}>{info}</Card>}

        <Card>
          <h3 style={{ marginTop: 0 }}>Neuen Award anlegen</h3>
          <form onSubmit={submitAward}>
            <FormSection>
              <Grid>
                <div style={{ gridColumn: "span 5" }}>
                  <Label>Award-Code</Label>
                  <Input value={awardCode} onChange={(e) => setAwardCode(e.target.value)} required />
                </div>
                <div style={{ gridColumn: "span 5" }}>
                  <Label>Kategorie</Label>
                  <Input value={awardCategory} onChange={(e) => setAwardCategory(e.target.value)} />
                </div>
                <div style={{ gridColumn: "span 2", display: "flex", alignItems: "end" }}>
                  <Button type="submit">Anlegen</Button>
                </div>
              </Grid>
            </FormSection>
          </form>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Award-Level anlegen/bearbeiten</h3>
          <form onSubmit={submitLevel}>
            <FormSection>
              <Grid>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>Award ID</Label>
                  <Input type="number" value={awardId} onChange={(e) => setAwardId(e.target.value)} required />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>Level</Label>
                  <Input type="number" value={level} onChange={(e) => setLevel(e.target.value)} required />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>Schwelle</Label>
                  <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <Label>EP</Label>
                  <Input type="number" value={ep} onChange={(e) => setEp(e.target.value)} />
                </div>
                <div style={{ gridColumn: "span 4" }}>
                  <Label>Icon-Datei (optional)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] ?? null)} />
                </div>
                <div style={{ gridColumn: "span 6" }}>
                  <Label>Titel (DE)</Label>
                  <Input value={titleDe} onChange={(e) => setTitleDe(e.target.value)} />
                </div>
                <div style={{ gridColumn: "span 6" }}>
                  <Label>Beschreibung (DE)</Label>
                  <Textarea rows={3} value={descriptionDe} onChange={(e) => setDescriptionDe(e.target.value)} />
                </div>
                <div style={{ gridColumn: "span 12" }}>
                  <Button type="submit">Speichern</Button>
                </div>
              </Grid>
            </FormSection>
          </form>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Bestehende Awards {loading ? "(lade…)" : ""}</h3>

          <FormSection style={{ marginBottom: 12 }}>
            <Grid>
              <div style={{ gridColumn: "span 7" }}>
                <Label>Suche (ID, Code, Kategorie, Titel, Beschreibung)</Label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="z. B. 43, winter, stammkunde …"
                />
              </div>
              <div style={{ gridColumn: "span 3" }}>
                <Label>Kategorie</Label>
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">Alle Kategorien</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <Label>Einträge pro Seite</Label>
                <Select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value="24">24</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
              <div style={{ gridColumn: "span 12", display: "flex", alignItems: "end", gap: 8, justifyContent: "flex-end" }}>
                <SecondaryButton type="button" onClick={expandAllVisible}>Alle auf</SecondaryButton>
                <SecondaryButton type="button" onClick={collapseAllVisible}>Alle zu</SecondaryButton>
              </div>
            </Grid>
            <div style={{ marginTop: 10, color: "#475569", fontSize: 14 }}>
              Treffer: <strong>{filteredAwards.length}</strong> Awards · Seite <strong>{safePage}</strong> von <strong>{totalPages}</strong>
            </div>
          </FormSection>

          {visibleAwards.map((award) => {
            const expanded = expandedAwardIds.includes(award.id);
            return (
              <div key={award.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <strong>ID {award.id}: {award.code}</strong>
                    {award.category && <Badge>{award.category}</Badge>}
                    <Badge>{(award.levels || []).length} Level</Badge>
                  </div>
                  <SecondaryButton type="button" onClick={() => toggleAwardExpanded(award.id)}>
                    {expanded ? "Einklappen" : "Aufklappen"}
                  </SecondaryButton>
                </div>

                {expanded && (award.levels || []).length === 0 && <div style={{ color: "#6b7280" }}>Keine Levels.</div>}

                {expanded && (award.levels || []).map((lvl) => {
                  const icon = getAwardIconSources(lvl.icon_path, 512);
                  return (
                    <div key={`${award.id}-${lvl.level}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px dashed #e5e7eb" }}>
                      <IconButton
                        type="button"
                        onClick={() => {
                          setLightboxSrc(icon.fallbackSrc || icon.src || "");
                          setLightboxTitle(`${award.code} · Level ${lvl.level}`);
                        }}
                        aria-label={`Icon groß anzeigen für ${award.code} Level ${lvl.level}`}
                      >
                        <img
                          src={icon.src || ""}
                          data-fallback-src={icon.fallbackSrc || ""}
                          onError={handleAwardIconFallback}
                          alt="Award"
                          style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, background: "#f3f4f6" }}
                          loading="lazy"
                          decoding="async"
                        />
                      </IconButton>
                      <div style={{ flex: 1 }}>
                        <div><strong>Level {lvl.level}</strong> · Schwelle {lvl.threshold} · {lvl.ep || 0} EP</div>
                        <div style={{ color: "#374151" }}>{lvl.title_de}</div>
                        <div style={{ color: "#6b7280", fontSize: 14 }}>{lvl.description_de}</div>
                      </div>
                      <SecondaryButton type="button" onClick={() => prefillLevel(award, lvl)}>Bearbeiten</SecondaryButton>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <PagerButton type="button" onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</PagerButton>
            <PagerButton type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>‹</PagerButton>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - safePage) <= 2)
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ padding: "0.4rem 0.2rem" }}>…</span>}
                  <PagerButton
                    type="button"
                    $active={page === safePage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PagerButton>
                </React.Fragment>
              ))}
            <PagerButton type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</PagerButton>
            <PagerButton type="button" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</PagerButton>
          </div>
        </Card>
      </Container>

      {lightboxSrc && (
        <LightboxOverlay onClick={() => setLightboxSrc("")}>
          <LightboxCard onClick={(e) => e.stopPropagation()}>
            <LightboxClose type="button" onClick={() => setLightboxSrc("")}>Schließen</LightboxClose>
            <LightboxImage src={lightboxSrc} alt={lightboxTitle || "Award-Icon"} />
          </LightboxCard>
        </LightboxOverlay>
      )}
    </Page>
  );
}
