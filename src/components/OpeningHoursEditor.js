import styled from "styled-components";
import { createEmptyOpeningHours, hydrateOpeningHours, mergeOpeningHoursChanges, WEEKDAYS } from "../utils/openingHours";

const MAX_RANGES_PER_DAY = 3;

const OpeningHoursEditor = ({ value, onChange }) => {
  const hydrated = hydrateOpeningHours(value);

  const updateHours = (nextValue) => {
    onChange?.(nextValue);
  };

  const handleAddRange = (weekday) => {
    const currentDay = hydrated.days.find((day) => day.weekday === weekday);
    if (!currentDay || currentDay.ranges.length >= MAX_RANGES_PER_DAY) {
      return;
    }
    const updated = mergeOpeningHoursChanges(hydrated, weekday, (day) => ({
      ...day,
      ranges: [...day.ranges, { open: "12:00", close: "18:00", overnight: false }],
    }));
    updateHours(updated);
  };

  const handleRangeChange = (weekday, index, key, newValue) => {
    const updated = mergeOpeningHoursChanges(hydrated, weekday, (day) => {
      const nextRanges = day.ranges.map((range, idx) =>
        idx === index ? { ...range, [key]: key === "overnight" ? newValue : newValue || "" } : range
      );
      return { ...day, ranges: nextRanges };
    });
    updateHours(updated);
  };

  const handleRemoveRange = (weekday, index) => {
    const updated = mergeOpeningHoursChanges(hydrated, weekday, (day) => ({
      ...day,
      ranges: day.ranges.filter((_, idx) => idx !== index),
    }));
    updateHours(updated);
  };

  const handleNoteChange = (event) => {
    updateHours({ ...hydrated, note: event.target.value });
  };

  const handleReset = () => {
    updateHours(createEmptyOpeningHours());
  };

  return (
    <Wrapper>
      <HeaderRow>
        <strong>Wöchentliche Zeiten</strong>
        <ResetButton type="button" onClick={handleReset}>
          Alles zurücksetzen
        </ResetButton>
      </HeaderRow>
      {WEEKDAYS.map((day) => {
        const dayData = hydrated.days.find((entry) => entry.weekday === day.weekday) ?? {
          ...day,
          ranges: [],
        };
        return (
          <DayRow key={day.weekday}>
            <DayLabel>{day.label}</DayLabel>
            <RangeColumn>
              {dayData.ranges.length === 0 && (
                <HintText>Keine Zeiten hinterlegt</HintText>
              )}
              {dayData.ranges.map((range, index) => (
                <RangeRow key={`${day.weekday}-${index}`}>
                  <TimeInput
                    type="time"
                    value={range.open}
                    onChange={(e) => handleRangeChange(day.weekday, index, "open", e.target.value)}
                    aria-label={`${day.label} Öffnet`}
                  />
                  <span>bis</span>
                  <TimeInput
                    type="time"
                    value={range.close}
                    onChange={(e) => handleRangeChange(day.weekday, index, "close", e.target.value)}
                    aria-label={`${day.label} Schließt`}
                  />
                  <OvernightToggle>
                    <input
                      type="checkbox"
                      checked={Boolean(range.overnight)}
                      onChange={(e) => handleRangeChange(day.weekday, index, "overnight", e.target.checked)}
                    />
                    <span>geht nach 24 Uhr weiter</span>
                  </OvernightToggle>
                  <RemoveButton type="button" onClick={() => handleRemoveRange(day.weekday, index)}>
                    ×
                  </RemoveButton>
                </RangeRow>
              ))}
              <AddRangeButton
                type="button"
                onClick={() => handleAddRange(day.weekday)}
                disabled={dayData.ranges.length >= MAX_RANGES_PER_DAY}
              >
                + Zeitspanne hinzufügen
              </AddRangeButton>
            </RangeColumn>
          </DayRow>
        );
      })}
      <NoteGroup>
        <label htmlFor="opening-hours-note">Hinweis (optional)</label>
        <NoteTextarea
          id="opening-hours-note"
          rows={2}
          value={hydrated.note || ""}
          onChange={handleNoteChange}
          placeholder="z.B. Nur bei gutem Wetter geöffnet"
        />
      </NoteGroup>
    </Wrapper>
  );
};

export default OpeningHoursEditor;

const Wrapper = styled.div`
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 0.75rem;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ResetButton = styled.button`
  border: none;
  background: transparent;
  color: #c62828;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
`;

const DayRow = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 0.5rem;
  align-items: flex-start;
`;

const DayLabel = styled.div`
  font-weight: 600;
  margin-top: 0.35rem;
`;

const RangeColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const RangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
`;

const TimeInput = styled.input`
  padding: 0.2rem 0.35rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.85rem;
`;

const AddRangeButton = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #1f6f43;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  &:disabled {
    color: #bbb;
    cursor: not-allowed;
  }
`;

const RemoveButton = styled.button`
  border: none;
  background: transparent;
  color: #c62828;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: auto;
`;

const HintText = styled.span`
  font-size: 0.85rem;
  color: #888;
`;

const OvernightToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #555;
`;

const NoteGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
`;

const NoteTextarea = styled.textarea`
  resize: vertical;
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 0.4rem;
  font-family: inherit;
`;
