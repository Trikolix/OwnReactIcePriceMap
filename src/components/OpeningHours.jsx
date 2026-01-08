import styled from "styled-components";
import { formatOpeningHoursLines, hydrateOpeningHours } from '../utils/openingHours';

const OpeningHours = ({ eisdiele }) => {

    const structured = hydrateOpeningHours(eisdiele.openingHoursStructured, eisdiele.opening_hours_note || "");
    let formattedLines = formatOpeningHoursLines(structured);
    if (formattedLines.length === 0 && eisdiele.openingHours) {
        formattedLines = eisdiele.openingHours.split(';').map((line) => line.trim());
    }
    const referenceDate = eisdiele.open_reference ? new Date(eisdiele.open_reference) : null;
    const hasReference = referenceDate && !Number.isNaN(referenceDate.getTime());
    let openBadgeText = null;
    if (hasReference) {
        const dateLabel = referenceDate.toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
        });
        const timeLabel = referenceDate.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        openBadgeText = `Geöffnet am ${dateLabel} ${timeLabel}`;
    } else if (typeof eisdiele.is_open_now === 'boolean') {
        openBadgeText = eisdiele.is_open_now ? 'Jetzt geöffnet' : 'Geschlossen';
    }

    return (
        <Container>
            <strong>Öffnungszeiten:</strong>
            {openBadgeText && (
                <OpenStateBadge $open={hasReference ? true : eisdiele.is_open_now}>
                    {openBadgeText}
                </OpenStateBadge>
            )}
            {eisdiele.status === 'seasonal_closed' && (
                <StatusInfo status="seasonal_closed">
                    🕓 Diese Eisdiele befindet sich aktuell in <strong>Saisonpause</strong>
                    {eisdiele.reopening_date && (
                        <> – voraussichtliche Wiedereröffnung am {new Date(eisdiele.reopening_date).toLocaleDateString('de-DE')}</>
                    )}
                </StatusInfo>
            )}
            {eisdiele.status === 'permanent_closed' && (
                <StatusInfo status="permanent_closed">
                    ❌ Diese Eisdiele hat <strong>dauerhaft geschlossen</strong>.
                </StatusInfo>
            )}
            <OpeningHoursContainer>
                {formattedLines.length > 0 ? (
                    formattedLines.map((part, index) => (
                        <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
                            {part}
                        </div>
                    ))
                ) : (
                    <>Keine Öffnungszeiten eingetragen</>
                )}
            </OpeningHoursContainer>
        </Container>
    );
};

export default OpeningHours;

const Container = styled.div``;

const OpeningHoursContainer = styled.div`
  position: relative;
  width: fit-content;
`;

const StatusInfo = styled.div`
  background-color: ${({ status }) =>
    status === 'permanent_closed'
      ? 'rgba(120, 120, 120, 0.15)'
      : 'rgba(255, 181, 34, 0.15)'};
  color: ${({ status }) =>
    status === 'permanent_closed' ? '#555' : '#b37c00'};
  border-left: 4px solid
    ${({ status }) =>
      status === 'permanent_closed' ? '#999' : '#ffb522'};
  padding: 6px 10px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const OpenStateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $open }) => ($open ? '#0f5132' : '#6c757d')};
  background: ${({ $open }) => ($open ? 'rgba(63, 177, 117, 0.2)' : 'rgba(108, 117, 125, 0.15)')};
  margin-left: 0.35rem;
`;
