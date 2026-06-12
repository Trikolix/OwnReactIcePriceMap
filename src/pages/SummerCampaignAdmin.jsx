import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import Header from "../Header";
import { useUser } from "../context/UserContext";
import {
  fetchSummerAdminState,
  postSummerAdminAction,
  searchSummerAdminShops,
} from "../features/seasonal/summerApi";
import { getAwardIconSources, handleAwardIconFallback } from "../utils/awardIcons";

const defaultRule = {
  rule_type: "scan_count",
  target_value: "3",
  category: "",
  award_id: "",
  award_level: "",
  award_title: "",
  award_description: "",
  award_ep: "100",
  award_icon_file: null,
  is_active: true,
};

export default function SummerCampaignAdmin() {
  const { userId, authToken, isLoggedIn } = useUser();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [shopQuery, setShopQuery] = useState("");
  const [shopResults, setShopResults] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [newCategory, setNewCategory] = useState("Sommerroute");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [config, setConfig] = useState({
    title: "Sommer-Sammelaktion 2026",
    starts_at: "",
    ends_at: "",
    is_active: true,
  });
  const [rule, setRule] = useState(defaultRule);

  const isAdmin = Number(userId) === 1;
  const categories = useMemo(() => {
    const values = new Set();
    (state?.shops || []).forEach((shop) => {
      const shopCategories = Array.isArray(shop.categories) ? shop.categories : String(shop.category || "").split(",");
      shopCategories.forEach((category) => {
        const normalized = String(category).trim();
        if (normalized) values.add(normalized);
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "de"));
  }, [state]);

  const load = async () => {
    if (!authToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchSummerAdminState(authToken);
      setState(data);
      setConfig({
        title: data.config?.title || "Sommer-Sammelaktion 2026",
        starts_at: data.config?.starts_at || "",
        ends_at: data.config?.ends_at || "",
        is_active: Number(data.config?.is_active) === 1,
      });
    } catch (err) {
      setError(err.message || "Sommeraktion konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [authToken]);

  const runAction = async (payload, successMessage) => {
    setError("");
    setInfo("");
    try {
      const data = await postSummerAdminAction(authToken, payload);
      setState(data);
      setInfo(successMessage);
    } catch (err) {
      setError(err.message || "Aktion fehlgeschlagen.");
    }
  };

  const runFormAction = async (payload, successMessage) => {
    setError("");
    setInfo("");
    try {
      const data = await postSummerAdminAction(authToken, payload);
      setState(data);
      setInfo(successMessage);
    } catch (err) {
      setError(err.message || "Aktion fehlgeschlagen.");
    }
  };

  const handleSearch = async () => {
    if (!shopQuery.trim()) return;
    setError("");
    try {
      const data = await searchSummerAdminShops(authToken, shopQuery.trim());
      setShopResults(Array.isArray(data.shops) ? data.shops : []);
    } catch (err) {
      setError(err.message || "Suche fehlgeschlagen.");
    }
  };

  const addShop = async (event) => {
    event.preventDefault();
    await runAction({
      action: "add_shop",
      eisdiele_id: Number(selectedShopId),
      category: newCategory,
      sort_order: Number(newSortOrder || 0),
    }, "Eisdiele hinzugefügt und QR-Code generiert.");
    setSelectedShopId("");
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setInfo("Link kopiert.");
    } catch {
      setError("Link konnte nicht kopiert werden.");
    }
  };

  if (!isLoggedIn) {
    return (
      <Page>
        <Header />
        <Container><Card>Bitte einloggen.</Card></Container>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <Page>
        <Header />
        <Container><Card>Kein Zugriff. Diese Seite ist nur für Admins.</Card></Container>
      </Page>
    );
  }

  return (
    <Page>
      <Header />
      <Container>
        <Card>
          <Title>Sommer-Sammelaktion 2026</Title>
          <Muted>Teilnehmende Eisdielen konfigurieren, random QR-Codes erzeugen und Bonusregeln verknüpfen.</Muted>
        </Card>

        {loading && <Card>Lade...</Card>}
        {error && <Notice $tone="error">{error}</Notice>}
        {info && <Notice $tone="success">{info}</Notice>}

        <Card>
          <h2>Aktion</h2>
          <Grid>
            <Label>
              Titel
              <Input value={config.title} onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))} />
            </Label>
            <Label>
              Start
              <Input value={config.starts_at} onChange={(e) => setConfig((prev) => ({ ...prev, starts_at: e.target.value }))} placeholder="2026-05-01 00:00:00" />
            </Label>
            <Label>
              Ende
              <Input value={config.ends_at} onChange={(e) => setConfig((prev) => ({ ...prev, ends_at: e.target.value }))} placeholder="2026-09-30 23:59:59" />
            </Label>
            <CheckboxLabel>
              <input type="checkbox" checked={config.is_active} onChange={(e) => setConfig((prev) => ({ ...prev, is_active: e.target.checked }))} />
              Aktiv
            </CheckboxLabel>
          </Grid>
          <ButtonRow>
            <Button type="button" onClick={() => runAction({ action: "save_config", ...config }, "Konfiguration gespeichert.")}>
              Speichern
            </Button>
          </ButtonRow>
        </Card>

        <Card>
          <h2>Eisdiele hinzufügen</h2>
          <SearchRow>
            <Input value={shopQuery} onChange={(e) => setShopQuery(e.target.value)} placeholder="Name, Adresse oder ID" />
            <Button type="button" onClick={handleSearch}>Suchen</Button>
          </SearchRow>
          {shopResults.length > 0 && (
            <ResultList>
              {shopResults.map((shop) => (
                <ResultButton
                  type="button"
                  key={shop.id}
                  $active={String(selectedShopId) === String(shop.id)}
                  onClick={() => setSelectedShopId(String(shop.id))}
                >
                  <strong>#{shop.id} {shop.name}</strong>
                  <span>{shop.adresse}</span>
                </ResultButton>
              ))}
            </ResultList>
          )}
          <form onSubmit={addShop}>
            <Grid>
              <Label>
                Eisdielen-ID
                <Input required type="number" value={selectedShopId} onChange={(e) => setSelectedShopId(e.target.value)} />
              </Label>
              <Label>
                Kategorien
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} list="summer-categories" />
              </Label>
              <Label>
                Sortierung
                <Input type="number" value={newSortOrder} onChange={(e) => setNewSortOrder(e.target.value)} />
              </Label>
            </Grid>
            <datalist id="summer-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
            <ButtonRow><Button type="submit">QR-Code generieren</Button></ButtonRow>
          </form>
        </Card>

        <Card>
          <h2>Teilnehmende Eisdielen</h2>
          <TableWrap>
            <Table>
              <colgroup>
                <col />
                <col className="category-col" />
                <col className="award-col" />
                <col className="sort-col" />
                <col className="status-col" />
                <col className="flyer-col" />
                <col className="actions-col" />
              </colgroup>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Kategorien</th>
                  <th>Award</th>
                  <th>Sortierung</th>
                  <th>Status</th>
                  <th>Flyer-Link</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {(state?.shops || []).map((shop) => (
                  <EditableShopRow
                    key={shop.id}
                    shop={shop}
                    onSave={(next) => runAction({ action: "update_shop", ...next }, "Eisdiele gespeichert.")}
                    onSaveAward={(formData) => runFormAction(formData, "Sammel-Award gespeichert.")}
                    onDelete={() => runAction({ action: "delete_shop", id: shop.id }, "Eisdiele entfernt.")}
                    onCopy={copyText}
                  />
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>

        <Card>
          <h2>Bonusregeln</h2>
          <Grid>
            <Label>
              Regeltyp
              <Select value={rule.rule_type} onChange={(e) => setRule((prev) => ({ ...prev, rule_type: e.target.value }))}>
                <option value="scan_count">Anzahl gesammelter Karten</option>
                <option value="checkin_count">Anzahl Karten mit Check-in</option>
                <option value="category_complete">Kategorie komplett</option>
              </Select>
            </Label>
            <Label>
              Schwelle
              <Input value={rule.target_value} onChange={(e) => setRule((prev) => ({ ...prev, target_value: e.target.value }))} disabled={rule.rule_type === "category_complete"} />
            </Label>
            <Label>
              Kategorie
              <Input value={rule.category} onChange={(e) => setRule((prev) => ({ ...prev, category: e.target.value }))} list="summer-categories" disabled={rule.rule_type !== "category_complete"} />
            </Label>
            <Label>
              Award ID
              <Input type="number" value={rule.award_id} onChange={(e) => setRule((prev) => ({ ...prev, award_id: e.target.value }))} placeholder="leer = automatisch" />
            </Label>
            <Label>
              Award Level
              <Input type="number" value={rule.award_level} onChange={(e) => setRule((prev) => ({ ...prev, award_level: e.target.value }))} placeholder="1" />
            </Label>
            <Label>
              Award-Titel
              <Input value={rule.award_title} onChange={(e) => setRule((prev) => ({ ...prev, award_title: e.target.value }))} />
            </Label>
            <Label>
              Award-EP
              <Input type="number" value={rule.award_ep} onChange={(e) => setRule((prev) => ({ ...prev, award_ep: e.target.value }))} />
            </Label>
            <Label>
              Award-Icon
              <Input type="file" accept="image/*" onChange={(e) => setRule((prev) => ({ ...prev, award_icon_file: e.target.files?.[0] || null }))} />
            </Label>
            <CheckboxLabel>
              <input type="checkbox" checked={rule.is_active} onChange={(e) => setRule((prev) => ({ ...prev, is_active: e.target.checked }))} />
              Aktiv
            </CheckboxLabel>
          </Grid>
          <Label style={{ marginTop: "0.9rem" }}>
            Award-Beschreibung
            <Textarea rows={3} value={rule.award_description} onChange={(e) => setRule((prev) => ({ ...prev, award_description: e.target.value }))} />
          </Label>
          <ButtonRow>
            <Button type="button" onClick={() => {
              const formData = new FormData();
              formData.append("action", "save_rule");
              formData.append("rule_type", rule.rule_type);
              formData.append("target_value", rule.rule_type === "category_complete" ? "" : rule.target_value);
              formData.append("category", rule.rule_type === "category_complete" ? rule.category : "");
              formData.append("award_id", rule.award_id);
              formData.append("award_level", rule.award_level || "1");
              formData.append("award_title", rule.award_title);
              formData.append("award_description", rule.award_description);
              formData.append("award_ep", rule.award_ep || "0");
              formData.append("is_active", rule.is_active ? "1" : "0");
              if (rule.award_icon_file) formData.append("award_icon_file", rule.award_icon_file);
              runFormAction(formData, "Bonusregel gespeichert.");
            }}>
              Regel speichern
            </Button>
          </ButtonRow>

          <RuleList>
            {(state?.rules || []).map((item) => (
              <RuleItem key={item.id}>
                <span>{item.rule_type} {item.target_value || item.category || ""} {"->"} {item.title_de || `Award ${item.award_id}/${item.award_level}`} {Number(item.is_active) === 1 ? "" : "(inaktiv)"}</span>
                <SmallButton type="button" onClick={() => runAction({ action: "delete_rule", id: item.id }, "Bonusregel entfernt.")}>Löschen</SmallButton>
              </RuleItem>
            ))}
          </RuleList>
        </Card>
      </Container>
    </Page>
  );
}

function EditableShopRow({ shop, onSave, onSaveAward, onDelete, onCopy }) {
  const [category, setCategory] = useState(shop.category || "");
  const [sortOrder, setSortOrder] = useState(String(shop.sort_order || 0));
  const [isActive, setIsActive] = useState(Boolean(shop.is_active));
  const [awardTitle, setAwardTitle] = useState(shop.award_title || `Sammelkarte: ${shop.shop_name}`);
  const [awardDescription, setAwardDescription] = useState(shop.award_description || "Du hast diese Sommer-Sammelkarte freigeschaltet.");
  const [awardEp, setAwardEp] = useState(String(shop.award_ep || 25));
  const [awardIconFile, setAwardIconFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setCategory(shop.category || "");
    setSortOrder(String(shop.sort_order || 0));
    setIsActive(Boolean(shop.is_active));
    setAwardTitle(shop.award_title || `Sammelkarte: ${shop.shop_name}`);
    setAwardDescription(shop.award_description || "Du hast diese Sommer-Sammelkarte freigeschaltet.");
    setAwardEp(String(shop.award_ep || 25));
    setAwardIconFile(null);
  }, [shop]);

  const saveAward = () => {
    const formData = new FormData();
    formData.append("action", "save_shop_award");
    formData.append("id", String(shop.id));
    formData.append("award_title", awardTitle);
    formData.append("award_description", awardDescription);
    formData.append("award_ep", awardEp || "0");
    if (awardIconFile) formData.append("award_icon_file", awardIconFile);
    onSaveAward(formData);
  };
  const awardIconSources = shop.award_icon ? getAwardIconSources(shop.award_icon, 128) : null;
  const largeAwardIconSources = shop.award_icon ? getAwardIconSources(shop.award_icon, 512) : null;

  return (
    <>
      <tr>
        <td>
          <strong>#{shop.eisdiele_id} {shop.shop_name}</strong>
          <Small>{shop.shop_address}</Small>
          {shop.award_id && <Small>Award {shop.award_id}/{shop.award_level}</Small>}
        </td>
        <td>
          <CategoryTextarea rows={2} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Ausflug, Stadt, Softeis" />
        </td>
        <td>
          {awardIconSources?.src ? (
            <AwardPreviewButton type="button" onClick={() => setPreviewOpen(true)} aria-label={`Award-Bild ${shop.award_title || shop.shop_name} groß anzeigen`}>
              <AwardPreview
                src={awardIconSources.src}
                data-fallback-src={awardIconSources.fallbackSrc || ""}
                onError={handleAwardIconFallback}
                alt={shop.award_title || `Award ${shop.shop_name}`}
              />
            </AwardPreviewButton>
          ) : (
            <AwardPlaceholder>kein Bild</AwardPlaceholder>
          )}
        </td>
        <td><SortInput type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></td>
        <td>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </td>
        <td>
          <FlyerCopyButton type="button" title={shop.flyer_url} onClick={() => onCopy(shop.flyer_url)}>
            {shop.flyer_url}
          </FlyerCopyButton>
          <Small>klicken kopiert komplett</Small>
        </td>
        <td>
          <InlineActions>
            <SmallButton type="button" onClick={() => onSave({ id: shop.id, category, sort_order: Number(sortOrder || 0), is_active: isActive })}>Speichern</SmallButton>
            <DangerButton type="button" onClick={onDelete}>Entfernen</DangerButton>
          </InlineActions>
          <AwardEditor>
            <Small>Award-Bildchen</Small>
            <SmallInput value={awardTitle} onChange={(e) => setAwardTitle(e.target.value)} placeholder="Award-Titel" />
            <SmallTextarea rows={2} value={awardDescription} onChange={(e) => setAwardDescription(e.target.value)} placeholder="Beschreibung" />
            <SmallInput type="number" value={awardEp} onChange={(e) => setAwardEp(e.target.value)} placeholder="EP" />
            <SmallInput type="file" accept="image/*" onChange={(e) => setAwardIconFile(e.target.files?.[0] || null)} />
            <SmallButton type="button" onClick={saveAward}>Award speichern</SmallButton>
          </AwardEditor>
        </td>
      </tr>
      {previewOpen && typeof document !== "undefined" && createPortal(
        <AwardOverlay onClick={() => setPreviewOpen(false)}>
          <AwardOverlayCard onClick={(event) => event.stopPropagation()}>
            <AwardOverlayClose type="button" onClick={() => setPreviewOpen(false)} aria-label="Award-Vorschau schließen">×</AwardOverlayClose>
            <AwardOverlayImage
              src={largeAwardIconSources?.src || awardIconSources?.src || ""}
              data-fallback-src={largeAwardIconSources?.fallbackSrc || awardIconSources?.fallbackSrc || ""}
              onError={handleAwardIconFallback}
              alt={shop.award_title || `Award ${shop.shop_name}`}
            />
            <AwardOverlayTitle>{shop.award_title || shop.shop_name}</AwardOverlayTitle>
          </AwardOverlayCard>
        </AwardOverlay>,
        document.body
      )}
    </>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #f6f7fb;
`;

const Container = styled.div`
  width: min(1180px, 96vw);
  margin: 0 auto;
  padding: 1rem 0 2rem;
`;

const Card = styled.section`
  background: #ffffff;
  border: 1px solid #e7eaf3;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;

  h2 {
    margin: 0 0 0.8rem;
    font-size: 1.1rem;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const Muted = styled.p`
  margin: 0.35rem 0 0;
  color: #536179;
`;

const Notice = styled(Card)`
  color: ${({ $tone }) => ($tone === "error" ? "#9f1239" : "#166534")};
  border-color: ${({ $tone }) => ($tone === "error" ? "#fecaca" : "#bbf7d0")};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.9rem;
`;

const Label = styled.label`
  display: grid;
  gap: 0.35rem;
  color: #334155;
  font-weight: 700;
  font-size: 0.9rem;
`;

const CheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
  font-weight: 700;
  margin-top: 1.55rem;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  background: #fcfdff;
`;

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  background: #fcfdff;
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.62rem 0.72rem;
  background: #fcfdff;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
`;

const Button = styled.button`
  border: none;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  background: #14532d;
  color: white;
  font-weight: 800;
  cursor: pointer;
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
`;

const ResultList = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0.9rem;
`;

const ResultButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? "#14532d" : "#e5e7eb")};
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
  background: ${({ $active }) => ($active ? "#ecfdf3" : "#fff")};
  text-align: left;
  cursor: pointer;

  span {
    display: block;
    color: #64748b;
    font-size: 0.85rem;
    margin-top: 0.15rem;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  .category-col {
    width: 168px;
  }

  .award-col {
    width: 74px;
  }

  .sort-col {
    width: 82px;
  }

  .status-col {
    width: 66px;
  }

  .flyer-col {
    width: 230px;
  }

  .actions-col {
    width: 260px;
  }

  th,
  td {
    border-bottom: 1px solid #e5e7eb;
    padding: 0.48rem;
    text-align: left;
    vertical-align: top;
  }
`;

const Small = styled.span`
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.15rem;
`;

const Code = styled.code`
  display: block;
  font-size: 0.72rem;
  word-break: break-all;
  max-height: 2.8em;
  overflow: hidden;
`;

const SmallInput = styled(Input)`
  min-width: 110px;
  padding: 0.45rem 0.55rem;
`;

const CategoryTextarea = styled(Textarea)`
  min-width: 0;
  width: 100%;
  min-height: 56px;
  resize: vertical;
  padding: 0.45rem 0.55rem;
  font-size: 0.82rem;
`;

const SortInput = styled(SmallInput)`
  width: 58px;
  min-width: 0;
`;

const AwardPreview = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  background: #eef2f7;
`;

const AwardPreviewButton = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  cursor: zoom-in;
  display: block;
`;

const AwardPlaceholder = styled.span`
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.68rem;
  text-align: center;
`;

const FlyerCopyButton = styled.button`
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: #14532d;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: left;
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: copy;
`;

const SmallTextarea = styled(Textarea)`
  min-width: 220px;
  padding: 0.45rem 0.55rem;
`;

const AwardEditor = styled.div`
  display: grid;
  gap: 0.4rem;
  margin-top: 0.55rem;
  padding-top: 0.55rem;
  border-top: 1px dashed #e5e7eb;
`;

const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const SmallButton = styled.button`
  border: 1px solid #cdd6ea;
  border-radius: 8px;
  padding: 0.42rem 0.58rem;
  background: white;
  cursor: pointer;
`;

const DangerButton = styled(SmallButton)`
  border-color: #fecaca;
  color: #9f1239;
`;

const AwardOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.68);
`;

const AwardOverlayCard = styled.div`
  position: relative;
  width: min(520px, 94vw);
  border-radius: 12px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 24px 72px rgba(15, 23, 42, 0.32);
`;

const AwardOverlayClose = styled.button`
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
`;

const AwardOverlayImage = styled.img`
  width: min(420px, 82vw);
  aspect-ratio: 1 / 1;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  border-radius: 10px;
  background: #f8fafc;
`;

const AwardOverlayTitle = styled.div`
  margin-top: 0.75rem;
  padding: 0 2rem;
  color: #0f172a;
  font-weight: 800;
  text-align: center;
`;

const RuleList = styled.div`
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
`;

const RuleItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
`;
