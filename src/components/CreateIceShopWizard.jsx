import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Globe, IceCreamCone, LockKeyhole, MapPin, Search, Store, Utensils, X } from 'lucide-react';
import styled from 'styled-components';
import LocationPicker from './LocationPicker';
import OpeningHoursEditor from './OpeningHoursEditor';
import NewAwards from './NewAwards';
import { formatOpeningHoursLines } from '../utils/openingHours';
import { LevelInfo } from '../styles/SharedStyles';

const PLACE_TYPES = [
  { value: 'ice_shop', title: 'Eisdiele', description: 'Kugel- oder Softeis direkt kaufen.', icon: IceCreamCone, color: '#925900', background: '#fff2cf' },
  { value: 'restaurant', title: 'Restaurant/Café', description: 'Eis als Dessert oder Eisspeise.', icon: Utensils, color: '#7050a0', background: '#f1eafb' },
  { value: 'temporary_stand', title: 'Temporärer Stand', description: 'Eisverkauf für begrenzte Zeit.', icon: Store, color: '#286a96', background: '#e6f3fb' },
];
const STEPS = ['Eis-Ort & Name', 'Standort', 'Prüfen & ergänzen'];

// Presentation and navigation only. SubmitIceShopModal owns the draft and API calls.
export default function CreateIceShopWizard({
  values, changes, position, selectedExternalSource, temporaryEnd, formatLocalDate,
  message, clearMessage, isSubmitting, submitted, awards, levelUpInfo, onSubmit, onClose,
}) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [draftStarted, setDraftStarted] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const heading = useRef(null);
  const content = useRef(null);
  const nameInput = useRef(null);
  const dateInput = useRef(null);
  const positionEditButton = useRef(null);
  const restorePositionFocus = useRef(false);
  const [viewport, setViewport] = useState(null);
  const selectedType = PLACE_TYPES.find(type => type.value === values.placeType) || PLACE_TYPES[0];
  const openingHoursLines = formatOpeningHoursLines(values.openingHoursData);
  const busy = position.busy;

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;
    const resize = () => setViewport({ height: visualViewport.height, top: visualViewport.offsetTop });
    resize();
    visualViewport.addEventListener('resize', resize);
    visualViewport.addEventListener('scroll', resize);
    return () => {
      visualViewport.removeEventListener('resize', resize);
      visualViewport.removeEventListener('scroll', resize);
    };
  }, []);
  const viewportStyle = viewport ? {
    '--wizard-viewport-height': `${viewport.height}px`,
    '--wizard-viewport-top': `${viewport.top}px`,
  } : undefined;

  useEffect(() => {
    content.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [step, submitted]);

  useEffect(() => {
    if (step !== 0) return;
    if (errors.name) nameInput.current?.focus();
    else if (errors.duration) dateInput.current?.focus();
  }, [errors, step]);

  useEffect(() => {
    if (!position.isPositionEditing && restorePositionFocus.current) {
      positionEditButton.current?.focus({ preventScroll: true });
      restorePositionFocus.current = false;
    }
  }, [position.isPositionEditing]);

  const navigate = next => {
    setDraftStarted(true);
    setErrors({});
    clearMessage();
    setStep(next);
  };
  const requestClose = () => {
    if (isSubmitting) return;
    if (!submitted && draftStarted) setConfirmDiscard(true);
    else onClose();
  };
  const validateIdentity = () => {
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Bitte gib dem Eis-Ort einen Namen.';
    if (values.placeType === 'temporary_stand' && (!temporaryEnd ||
      !Number.isFinite(new Date(temporaryEnd.replace(' ', 'T')).getTime()) ||
      new Date(temporaryEnd.replace(' ', 'T')).getTime() <= Date.now())) {
      nextErrors.duration = 'Bitte wähle heute oder ein Datum in der Zukunft.';
    }
    setErrors(nextErrors);
    return nextErrors;
  };
  const advance = event => {
    event.preventDefault();
    if (busy) return;
    if (step === 0 || step === 2) {
      const nextErrors = validateIdentity();
      if (Object.keys(nextErrors).length) {
        setStep(0);
        return;
      }
    }
    if (step === 0) navigate(1);
    else if (step === 1) {
      if (!position.hasValidPosition) {
        setErrors({ position: 'Bitte suche eine Adresse oder setze den Standort auf der Karte.' });
        return;
      }
      position.confirmPosition();
      navigate(2);
    } else onSubmit();
  };
  const update = (key, value) => {
    setDraftStarted(true);
    changes[key](value);
    setErrors({});
  };

  return (
    <WizardDialog open onClose={requestClose} initialFocus={heading}>
      <Backdrop />
      <DialogPosition style={viewportStyle}>
        <Panel data-testid="create-shop-dialog">
          <Header>
            <Eyebrow>Ein neuer Ort für Eis</Eyebrow>
            <DialogTitle as="h2">Eis-Ort eintragen</DialogTitle>
            <Close type="button" aria-label="Dialog schließen" onClick={requestClose} disabled={isSubmitting}><X size={22} /></Close>
            {!submitted && <Progress aria-label="Fortschritt">
              {STEPS.map((title, index) => <li key={title} aria-current={index === step ? 'step' : undefined} data-complete={index < step}>
                <StepNumber>{index < step ? <Check size={15} aria-hidden="true" /> : index + 1}</StepNumber>
                <span>{title}</span>
              </li>)}
            </Progress>}
          </Header>

          {submitted ? <>
            <Content ref={content}>
              <Success ref={heading} tabIndex={-1}>
                <SuccessIcon><Check size={28} aria-hidden="true" /></SuccessIcon>
                <h3>Dein Eis-Ort ist eingetragen!</h3>
                <p role="status">{message}</p>
              </Success>
              {levelUpInfo && <LevelInfo><h3>🎉 Level-Up!</h3><p>Du hast <strong>Level {levelUpInfo.level}</strong> erreicht!</p><p>{levelUpInfo.level_name}</p></LevelInfo>}
              <NewAwards awards={awards} />
            </Content>
            <Footer><Primary type="button" onClick={onClose}>Fertig <Check size={18} /></Primary></Footer>
          </> : <WizardForm onSubmit={advance} noValidate onChange={() => setDraftStarted(true)}>
            <Content ref={content}>
              <Fields disabled={isSubmitting}>
                <StepHeading ref={heading} tabIndex={-1}>{STEPS[step]}</StepHeading>
                {step === 0 && <>
                  <Hint>Was für einen Eis-Ort möchtest du eintragen?</Hint>
                  <TypeChoices aria-label="Art des Eis-Orts">
                    <legend>Art des Eis-Orts</legend>
                    {PLACE_TYPES.map(({ value, title, description, icon: Icon, color, background }) => <TypeCard
                      key={value} $selected={values.placeType === value} $color={color} $background={background}>
                      <input type="radio" name="new-shop-place-type" value={value} checked={values.placeType === value}
                        onChange={() => update('setPlaceType', value)} />
                      <TypeIcon><Icon size={26} aria-hidden="true" /></TypeIcon>
                      <TypeText><strong>{title}</strong><span>{description}</span></TypeText>
                      <SelectionMark aria-hidden="true">{values.placeType === value && <Check size={14} />}</SelectionMark>
                    </TypeCard>)}
                  </TypeChoices>
                  <Field>
                    <label htmlFor="new-shop-name">Name des Eis-Orts <Required>*</Required></label>
                    <TextInput ref={nameInput} id="new-shop-name" value={values.name} maxLength={255} required
                      placeholder="Zum Beispiel: Eiscafé Sonnenschein" autoComplete="off"
                      aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'new-shop-name-error' : undefined}
                      onChange={event => update('setName', event.target.value)} />
                    {errors.name && <FieldError id="new-shop-name-error" role="alert">{errors.name}</FieldError>}
                  </Field>
                  {values.placeType === 'temporary_stand' && <Card>
                    <CardTitle><Clock3 size={18} aria-hidden="true" />Wie lange ist der Stand vor Ort?</CardTitle>
                    <Hint>Danach wird er automatisch auf der Karte ausgeblendet.</Hint>
                    <DurationChoices aria-label="Sichtbarkeitsdauer">
                      {[[ 'today', 'Heute' ], [ 'tomorrow', 'Bis morgen' ], [ 'date', 'Datum wählen' ]].map(([value, title]) =>
                        <DurationChoice key={value} $selected={values.temporaryDuration === value}>
                          <input type="radio" name="new-shop-duration" value={value} checked={values.temporaryDuration === value}
                            onChange={() => update('setTemporaryDuration', value)} />{title}
                        </DurationChoice>)}
                    </DurationChoices>
                    {values.temporaryDuration === 'date' && <Field>
                      <label htmlFor="new-shop-end-date">Sichtbar bis einschließlich</label>
                      <TextInput ref={dateInput} id="new-shop-end-date" type="date" min={formatLocalDate(new Date())}
                        value={values.temporaryEndDate} required aria-invalid={Boolean(errors.duration)}
                        aria-describedby={errors.duration ? 'new-shop-duration-error' : undefined}
                        onChange={event => update('setTemporaryEndDate', event.target.value)} />
                    </Field>}
                    {errors.duration && <FieldError id="new-shop-duration-error" role="alert">{errors.duration}</FieldError>}
                  </Card>}
                  {selectedExternalSource && <ImportNote><Search size={18} aria-hidden="true" /><div>
                    <strong>Aus der Karten-Discovery übernommen</strong><p>Bitte prüfe die Angaben zu {selectedExternalSource.name || values.name}.</p>
                  </div></ImportNote>}
                </>}

                {step === 1 && <>
                  <Hint>Prüfe den Marker: Er soll genau dort liegen, wo man das Eis bekommt.</Hint>
                  <LocationLayout>
                    <AddressTools>
                      <Field><label htmlFor="new-shop-address">Adresse suchen</label>
                        <TextInput id="new-shop-address" value={values.adresse} placeholder="Straße, Hausnummer, Ort"
                          autoComplete="street-address" disabled={busy}
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              position.handleGeocode();
                            }
                          }}
                          onChange={event => update('setAdresse', event.target.value)} />
                      </Field>
                      <Secondary type="button" onClick={position.handleGeocode} disabled={busy || !values.adresse.trim()}>
                        <Search size={18} aria-hidden="true" />{position.isGeocoding === 'forward' ? 'Adresse wird gesucht…' : 'Adresse auf Karte suchen'}
                      </Secondary>
                    </AddressTools>
                    <MapSection aria-label="Standort auf der Karte">
                      <MapToolbar><span><MapPin size={17} aria-hidden="true" />Position</span>
                        {position.isPositionEditing
                          ? <PositionActions>
                            <Secondary type="button" disabled={busy} onClick={() => {
                              restorePositionFocus.current = true;
                              position.cancelPositionEdit();
                            }}>Abbrechen</Secondary>
                            <PositionConfirm type="button" disabled={busy || !position.hasValidPosition} onClick={() => {
                              restorePositionFocus.current = true;
                              position.confirmPosition();
                              setErrors({});
                              clearMessage();
                            }}><Check size={18} aria-hidden="true" />Bestätigen</PositionConfirm>
                          </PositionActions>
                          : <Secondary ref={positionEditButton} type="button" disabled={busy} onClick={() => { setDraftStarted(true); position.startPositionEdit(); }}>
                            {position.hasValidPosition ? 'Position ändern' : 'Position auf Karte setzen'}
                          </Secondary>}
                      </MapToolbar>
                      <MapFrame>
                        <LocationPicker latitude={position.mapLatitude} longitude={position.mapLongitude}
                          setLatitude={position.changeLatitude} setLongitude={position.changeLongitude}
                          readOnly={!position.isPositionEditing || busy} showMarker={position.hasValidPosition} />
                      </MapFrame>
                      <MapNotice role="status">{position.isPositionEditing
                        ? <><MapPin size={16} aria-hidden="true" />Position wird bearbeitet</>
                        : <><LockKeyhole size={16} aria-hidden="true" />{position.hasValidPosition ? 'Marker gesperrt · Karte frei bewegen' : 'Noch kein Standort gewählt'}</>}</MapNotice>
                      {position.hasValidPosition && <CoordinateHint>{Number(position.latitude).toFixed(6)}, {Number(position.longitude).toFixed(6)}</CoordinateHint>}
                      {position.isPositionEditing && <EditingNotice>Tippe auf den Standort oder ziehe den Marker. Mit „Bestätigen“ übernimmst du die Position und kannst danach die Adresse ermitteln. Mit „Standort bestätigen & weiter“ kommst du direkt zur Zusammenfassung.</EditingNotice>}
                    </MapSection>
                    <PositionTools>
                      <TextAction type="button" onClick={position.handleReverseGeocode}
                        disabled={busy || !position.hasValidPosition || position.isPositionEditing}>
                        {position.isGeocoding === 'reverse' ? 'Adresse wird gesucht…' : 'Adresse aus Position übernehmen'}
                      </TextAction>
                      <ManualDetails>
                        <summary>Manuell eingeben <ChevronDown size={16} aria-hidden="true" /></summary>
                        <Field><label htmlFor="shop-latitude">Breitengrad</label>
                          <TextInput id="shop-latitude" type="number" inputMode="decimal" min="-90" max="90" step="0.000001"
                            value={position.latitude} disabled={busy} onChange={event => position.changeLatitude(event.target.value)} />
                        </Field>
                        <Field><label htmlFor="shop-longitude">Längengrad</label>
                          <TextInput id="shop-longitude" type="number" inputMode="decimal" min="-180" max="180" step="0.000001"
                            value={position.longitude} disabled={busy} onChange={event => position.changeLongitude(event.target.value)} />
                        </Field>
                      </ManualDetails>
                    </PositionTools>
                  </LocationLayout>
                  {errors.position && <FieldError role="alert">{errors.position}</FieldError>}
                </>}

                {step === 2 && <>
                  <Hint>Alles richtig? Du kannst noch Details ergänzen und dann deinen Eis-Ort eintragen.</Hint>
                  <Summary aria-label="Zusammenfassung">
                    <SummaryRow><SummaryIcon $color={selectedType.color} $background={selectedType.background}>
                      <selectedType.icon size={23} aria-hidden="true" /></SummaryIcon>
                      <div><small>{selectedType.title}</small><strong>{values.name}</strong></div>
                      <TextAction type="button" aria-label="Art und Name ändern" onClick={() => navigate(0)}>Ändern</TextAction>
                    </SummaryRow>
                    <SummaryRow><SummaryIcon><MapPin size={23} aria-hidden="true" /></SummaryIcon>
                      <div><small>Standort bestätigt</small><strong>{values.adresse || 'Position auf der Karte gewählt'}</strong>
                        <CoordinateHint>{Number(position.latitude).toFixed(6)}, {Number(position.longitude).toFixed(6)}</CoordinateHint></div>
                      <TextAction type="button" aria-label="Standort ändern" onClick={() => navigate(1)}>Ändern</TextAction>
                    </SummaryRow>
                    {values.placeType === 'temporary_stand' && <SummaryRow><SummaryIcon><Clock3 size={23} aria-hidden="true" /></SummaryIcon>
                      <div><small>Auf der Karte sichtbar</small><strong>Bis {new Date(temporaryEnd.replace(' ', 'T')).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · Tagesende</strong></div>
                      <TextAction type="button" aria-label="Sichtbarkeitsdauer ändern" onClick={() => navigate(0)}>Ändern</TextAction>
                    </SummaryRow>}
                  </Summary>
                  <OptionalDetails>
                    <summary><Globe size={20} aria-hidden="true" /><div><strong>Website <Optional>optional</Optional></strong>
                      <span>{values.website || 'Link zur Website ergänzen'}</span></div><ChevronDown size={18} aria-hidden="true" /></summary>
                    <DetailsContent><Field><label htmlFor="new-shop-website">Website des Eis-Orts</label>
                      <TextInput id="new-shop-website" type="text" inputMode="url" autoComplete="url" placeholder="https://…"
                        value={values.website} onChange={event => update('setWebsite', event.target.value)} />
                    </Field></DetailsContent>
                  </OptionalDetails>
                  <OptionalDetails>
                    <summary><Clock3 size={20} aria-hidden="true" /><div><strong>Öffnungszeiten <Optional>optional</Optional></strong>
                      <span>{openingHoursLines.length ? openingHoursLines.join(' · ') : 'Zeiten oder einen Hinweis ergänzen'}</span></div><ChevronDown size={18} aria-hidden="true" /></summary>
                    <DetailsContent><OpeningHoursEditor touchFriendly value={values.openingHoursData} onChange={value => update('setOpeningHoursData', value)} /></DetailsContent>
                  </OptionalDetails>
                  <CorrectionNote><Clock3 size={18} aria-hidden="true" /><span>Du kannst die Position nach dem Eintragen noch <strong>6 Stunden lang korrigieren</strong>.</span></CorrectionNote>
                </>}
              </Fields>
              {message && <ErrorNotice role="alert">{message}</ErrorNotice>}
            </Content>
            <Footer>
              {step > 0 && <Back type="button" onClick={() => navigate(step - 1)} disabled={busy}><ArrowLeft size={18} aria-hidden="true" />Zurück</Back>}
              <Primary type="submit" disabled={busy || (step === 1 && !position.hasValidPosition)}>
                {isSubmitting ? 'Wird eingetragen…' : step === 0 ? 'Weiter' : step === 1 ? 'Standort bestätigen & weiter' : 'Eis-Ort eintragen'}
                {step === 2 ? <Check size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
              </Primary>
            </Footer>
          </WizardForm>}
        </Panel>
      </DialogPosition>
      <DiscardDialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)}>
        <Backdrop />
        <DialogPosition style={viewportStyle}>
          <DiscardPanel>
            <DialogTitle as="h2">Entwurf verwerfen?</DialogTitle>
            <Description>Deine Angaben werden beim Schließen verworfen.</Description>
            <DiscardActions>
              <Primary type="button" data-autofocus onClick={() => setConfirmDiscard(false)}>Weiter ausfüllen</Primary>
              <Secondary type="button" onClick={() => { setConfirmDiscard(false); onClose(); }}>Entwurf verwerfen</Secondary>
            </DiscardActions>
          </DiscardPanel>
        </DialogPosition>
      </DiscardDialog>
    </WizardDialog>
  );
}

const WizardDialog = styled(Dialog)`position: relative; z-index: 3100;`;
const DiscardDialog = styled(Dialog)`position: relative; z-index: 3200;`;
const Backdrop = styled.div`position: fixed; inset: 0; background: rgba(39, 29, 15, .48);`;
const DialogPosition = styled.div`
  position: fixed; inset: 0; bottom: auto; top: var(--wizard-viewport-top, 0px);
  height: var(--wizard-viewport-height, 100dvh); display: flex; align-items: center; justify-content: center;
  padding: 24px;
  @media (max-width: 640px) { padding: 0; }
  @media (max-height: 600px) and (min-width: 641px) { padding: 12px; }
`;
const Panel = styled(DialogPanel)`
  box-sizing: border-box; width: 100%; max-width: 880px; height: min(780px, calc(var(--wizard-viewport-height, 100dvh) - 48px));
  display: flex; flex-direction: column; overflow: hidden; color: #3f2d12;
  border: 1px solid #e9deca; border-radius: 24px; background: #fffaf0;
  box-shadow: 0 24px 80px rgba(40, 28, 7, .25);
  *, *::before, *::after { box-sizing: border-box; }
  button, input, textarea { font: inherit; }
  button, summary, input[type=radio] { -webkit-tap-highlight-color: transparent; }
  button:focus-visible, summary:focus-visible, input:focus-visible, textarea:focus-visible {
    outline: 3px solid #926000; outline-offset: 3px;
  }
  button:disabled { opacity: .5; cursor: not-allowed; }
  @media (max-width: 640px) { height: var(--wizard-viewport-height, 100dvh); max-width: none; border: 0; border-radius: 0; }
  @media (max-height: 600px) and (min-width: 641px) { height: calc(var(--wizard-viewport-height, 100dvh) - 24px); }
`;
const Header = styled.header`
  position: relative; flex-shrink: 0; padding: 24px 28px 20px; background: #fffdf7; border-bottom: 1px solid #ece3d2;
  h2 { margin: 5px 48px 20px 0; font-size: 26px; letter-spacing: -.6px; }
  @media (max-width: 640px) { padding: calc(16px + env(safe-area-inset-top)) 20px 14px; h2 { font-size: 23px; margin-bottom: 16px; } }
  @media (max-height: 600px) { padding-top: calc(10px + env(safe-area-inset-top)); padding-bottom: 10px; h2 { font-size: 21px; margin: 3px 48px 10px 0; } }
`;
const Eyebrow = styled.div`color: #8c632a; font-size: 12px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase;`;
const Close = styled.button`
  position: absolute; right: 16px; top: calc(16px + env(safe-area-inset-top)); display: grid; place-items: center;
  width: 44px; height: 44px; border: 1px solid #eadfc9; border-radius: 50%; background: #fffaf0; color: #5f4726; cursor: pointer;
`;
const Progress = styled.ol`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; list-style: none; margin: 0; padding: 0;
  li { display: flex; align-items: center; gap: 8px; color: #776b58; font-size: 13px; line-height: 1.3; }
  li[aria-current=step] { color: #4a3308; font-weight: 750; }
  li[aria-current=step] > span:first-child { background: #ffcb57; border-color: #e8b53b; color: #4a3308; }
  li[data-complete=true] > span:first-child { background: #f4e3b9; border-color: #e6d4a8; color: #6b4b0d; }
  @media (max-width: 640px) { gap: 8px; li { font-size: 11px; gap: 6px; } }
`;
const StepNumber = styled.span`display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 1px solid #e2d7c2; background: #fff; font-size: 13px; font-weight: 700;`;
const WizardForm = styled.form`display: flex; flex-direction: column; flex: 1; min-height: 0;`;
const Content = styled.div`
  flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 26px 28px;
  scroll-padding-block: 16px; overflow-wrap: anywhere;
  @media (max-width: 640px) { padding: 22px 20px; padding-left: max(20px, env(safe-area-inset-left)); padding-right: max(20px, env(safe-area-inset-right)); }
`;
const Fields = styled.fieldset`border: 0; padding: 0; margin: 0; min-width: 0;`;
const StepHeading = styled.h3`font-size: 21px; margin: 0 0 8px; letter-spacing: -.3px; &:focus { outline: none; }`;
const Hint = styled.p`color: #78694f; font-size: 14px; line-height: 1.55; margin: 0 0 20px;`;
const TypeChoices = styled.fieldset`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 0; border: 0; margin: 0 0 24px;
  legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 10px; }
`;
const TypeCard = styled.label`
  position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 16px;
  padding: 18px 16px; min-width: 0; border: 2px solid ${p => p.$selected ? p.$color : '#e9dfce'};
  border-radius: 16px; cursor: pointer; background: ${p => p.$selected ? p.$background : '#fffdf9'};
  color: ${p => p.$color}; transition: background .15s, border-color .15s;
  &:hover { border-color: ${p => p.$color}; }
  &:has(input:focus-visible) { outline: 3px solid ${p => p.$color}; outline-offset: 3px; }
  input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  @media (max-width: 640px) { flex-direction: row; align-items: center; gap: 14px; padding: 14px; }
`;
const TypeIcon = styled.span`display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0; border-radius: 14px; background: rgba(255,255,255,.8);`;
const TypeText = styled.div`
  display: grid; gap: 6px; padding-right: 14px;
  strong { font-size: 16px; line-height: 1.3; color: #45341c; }
  span { font-size: 13px; line-height: 1.45; color: #78694f; }
  @media (max-width: 640px) { gap: 3px; padding-right: 20px; }
`;
const SelectionMark = styled.span`position: absolute; right: 12px; top: 14px; display: grid; place-items: center; width: 20px; height: 20px; border: 1px solid currentColor; border-radius: 50%;`;
const Field = styled.div`
  display: grid; gap: 8px; min-width: 0; margin-bottom: 18px;
  label { font-size: 14px; font-weight: 700; }
`;
const Required = styled.span`color: #9a6100;`;
const TextInput = styled.input`
  box-sizing: border-box; display: block; width: 100%; min-width: 0; min-height: 48px; padding: 12px 14px;
  font-size: 16px !important; border: 1px solid #dccfb7; border-radius: 10px; background: #fff; color: #3f2d12;
  &[aria-invalid=true] { border-color: #b3382c; }
  &:disabled { background: #f3efe7; }
`;
const Card = styled.div`padding: 18px; background: #fffdf9; border: 1px solid #e9dfce; border-radius: 16px; margin: 0 0 20px;`;
const CardTitle = styled.h4`display: flex; align-items: center; gap: 8px; font-size: 15px; margin: 0 0 8px;`;
const DurationChoices = styled.div`display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 14px;`;
const DurationChoice = styled.label`
  position: relative; display: grid; place-items: center; min-height: 44px; padding: 10px 14px; border-radius: 10px;
  border: 1px solid ${p => p.$selected ? '#9c7527' : '#e2d7c2'}; background: ${p => p.$selected ? '#fff0c5' : '#fff'}; font-size: 14px; cursor: pointer;
  input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  &:has(input:focus-visible) { outline: 3px solid #926000; outline-offset: 3px; }
`;
const ImportNote = styled.div`
  display: flex; gap: 10px; padding: 14px; background: #f4efdf; border-radius: 12px; color: #736047; font-size: 13px;
  svg { flex-shrink: 0; } p { margin: 4px 0 0; line-height: 1.5; }
`;
const LocationLayout = styled.div`
  display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.4fr);
  grid-template-areas: 'address map' 'tools map'; column-gap: 24px; row-gap: 16px; align-items: start;
  @media (max-width: 640px) { grid-template-columns: 1fr; grid-template-areas: 'address' 'map' 'tools'; gap: 16px; }
`;
const AddressTools = styled.div`grid-area: address;`;
const PositionTools = styled.div`grid-area: tools;`;
const Secondary = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 14px;
  border: 1px solid #dfd1b6; border-radius: 10px; background: #fffdf8; color: #5e451e; font-size: 14px; font-weight: 650; cursor: pointer;
  svg { flex-shrink: 0; } &:hover:enabled { background: #f6ecd7; }
`;
const TextAction = styled.button`
  display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px 4px;
  background: transparent; border: 0; color: #815816; font-size: 13px; font-weight: 650; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
`;
const EditingNotice = styled.p`background: #fff0c5; border-radius: 10px; padding: 12px; font-size: 13px; line-height: 1.5; margin: 0 0 12px;`;
const ManualDetails = styled.details`
  border-top: 1px solid #e9dfce; margin-top: 6px;
  summary { min-height: 44px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 13px; color: #78694f; }
  &[open] summary { margin-bottom: 10px; }
  summary::-webkit-details-marker { display: none; }
`;
const MapSection = styled.div`grid-area: map; min-width: 0;`;
const MapToolbar = styled.div`display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; > span { display: flex; flex: 1; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; }`;
const PositionActions = styled.div`display: flex; flex-shrink: 0; gap: 8px; > button { min-width: 44px; }`;
const PositionConfirm = styled(Secondary)`
  background: linear-gradient(180deg, #ffd570, #ffc044); border-color: #e9b53c; color: #513508;
  &:hover:enabled { background: #ffc044; }
`;
const MapFrame = styled.div`border-radius: 16px; border: 1px solid #e1d7c3; overflow: hidden; isolation: isolate; .leaflet-container { height: clamp(220px, 34dvh, 320px) !important; } .leaflet-control-zoom a { width: 44px; height: 44px; line-height: 44px; }`;
const MapNotice = styled.p`display: flex; align-items: center; gap: 6px; color: #746146; font-size: 12px; line-height: 1.5; margin: 12px 0 4px; svg { flex-shrink: 0; }`;
const CoordinateHint = styled.p`font-size: 12px; color: #897b65; margin: 4px 0 0; font-variant-numeric: tabular-nums;`;
const Summary = styled.div`border: 1px solid #e8ddc8; border-radius: 16px; background: #fffdf9; overflow: hidden; margin: 0 0 22px;`;
const SummaryRow = styled.div`
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 16px;
  & + & { border-top: 1px solid #eee4d2; }
  small { display: block; font-size: 12px; color: #897454; margin-bottom: 4px; }
  strong { display: block; font-size: 15px; line-height: 1.4; }
  @media (max-width: 640px) { gap: 10px; padding: 14px 12px; }
`;
const SummaryIcon = styled.span`display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; color: ${p => p.$color || '#947031'}; background: ${p => p.$background || '#f7eedb'};`;
const OptionalDetails = styled.details`
  border: 1px solid #e8ddc8; border-radius: 14px; background: #fffdf9; margin-bottom: 12px;
  summary { display: flex; align-items: center; gap: 12px; padding: 16px; cursor: pointer; color: #806439; min-height: 64px; }
  summary > div { min-width: 0; flex: 1; display: grid; gap: 5px; }
  summary strong { color: #574222; font-size: 15px; }
  summary span { font-size: 12px; color: #8a795e; line-height: 1.4; }
  summary > svg { flex-shrink: 0; } summary::-webkit-details-marker { display: none; }
  &[open] summary > svg:last-child { transform: rotate(180deg); }
`;
const Optional = styled.em`font-size: 11px; font-style: normal; font-weight: 400; margin-left: 6px; color: #8a795e;`;
const DetailsContent = styled.div`
  padding: 0 16px 16px; min-width: 0;
`;
const CorrectionNote = styled.p`display: flex; gap: 9px; font-size: 13px; color: #806e50; line-height: 1.5; margin: 20px 0 0; svg { flex-shrink: 0; margin-top: 2px; }`;
const FieldError = styled.p`color: #a63025; font-size: 13px; line-height: 1.5; margin: 0;`;
const ErrorNotice = styled.div`padding: 14px; margin-top: 18px; background: #fff0e9; border: 1px solid #edc2b1; color: #923c24; border-radius: 12px; font-size: 14px; line-height: 1.5;`;
const Footer = styled.footer`
  display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-shrink: 0; background: #fffdf7;
  border-top: 1px solid #ece3d2; padding: 16px 28px max(16px, env(safe-area-inset-bottom));
  @media (max-width: 640px) { padding-left: max(16px, env(safe-area-inset-left)); padding-right: max(16px, env(safe-area-inset-right)); gap: 8px; }
`;
const Primary = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 12px 22px;
  border: 1px solid #e9b53c; border-radius: 12px; background: linear-gradient(180deg, #ffd570, #ffc044);
  color: #513508; font-size: 15px; font-weight: 750; cursor: pointer; line-height: 1.35;
  svg { flex-shrink: 0; } &:hover:enabled { background: #ffc044; }
  @media (max-width: 640px) { flex: 1; padding: 12px; gap: 6px; font-size: 14px; }
`;
const Back = styled(Secondary)`margin-right: auto; border: 0; background: transparent; padding-inline: 4px; flex-shrink: 0; @media (max-width: 640px) { font-size: 13px; }`;
const Success = styled.div`text-align: center; padding: 30px 0 20px; h3 { font-size: 23px; } p { line-height: 1.6; color: #78694f; } &:focus { outline: none; }`;
const SuccessIcon = styled.div`display: grid; place-items: center; width: 64px; height: 64px; margin: auto; background: #ebf5dc; color: #477223; border-radius: 50%;`;
const DiscardPanel = styled(DialogPanel)`
  box-sizing: border-box; width: min(420px, calc(100vw - 32px)); padding: 24px; border-radius: 20px; background: #fffaf0; color: #493617; box-shadow: 0 20px 70px rgba(0,0,0,.25);
  h2 { font-size: 22px; margin: 0 0 12px; } p { font-size: 15px; line-height: 1.5; color: #78694f; }
  button:focus-visible { outline: 3px solid #926000; outline-offset: 3px; }
`;
const DiscardActions = styled.div`display: grid; gap: 10px; margin-top: 20px;`;
