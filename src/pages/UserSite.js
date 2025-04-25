import Header from './../Header';
import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function UserSite() {
    const { userId: userIdFromUrl } = useParams();
    const { userId: userIdFromContext } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const finalUserId = userIdFromUrl || userIdFromContext;

    useEffect(() => {
        if (!finalUserId) return;

        fetch(`https://ice-app.4lima.de/backend/get_user_stats.php?nutzer_id=${finalUserId}`)
            .then((res) => res.json())
            .then((json) => {
                console.log(json);
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fehler beim Laden der Dashboard-Daten:", err);
                setError(err);
                setLoading(false);
            });
    }, [finalUserId]);


    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
            <Header />
            <div style={{ width: '100vw', backgroundColor: 'white', height: '100vh' }}>
                <DashboardWrapper>
                    <HeaderDiv>
                        <h1>Nutzerseite</h1>
                        <p>Lade Dashboard Daten...</p>
                    </HeaderDiv>
                </DashboardWrapper>
            </div >
        </div >
    );
    if (error !== null) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
            <Header />
            <div style={{ width: '100vw', backgroundColor: 'white' }}>
                <DashboardWrapper>
                    <HeaderDiv>
                        <h1>Nutzerseite</h1>
                        <p>Fehler beim Abruf der Daten</p>
                    </HeaderDiv>
                </DashboardWrapper>
            </div >
        </div >
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#ffb522' }}>
            <Header />
            <div style={{ width: '100vw', backgroundColor: 'white' }}>
                <DashboardWrapper>
                    <HeaderDiv>
                        <h1>Nutzerseite von {data.nutzername}</h1>
                        <p>Mitglied seit: {new Date(data.erstellungsdatum).toLocaleDateString()}</p>
                    </HeaderDiv>

                    <IceCreamStatsWrapper>
                        <IceCreamSection>
                            <h3>Eisarten gegessen</h3>
                            <List>
                                <li>Kugeleis: {data.eisarten.Kugel ? data.eisarten.Kugel : '0'}</li>
                                <li>Softeis: {data.eisarten.Softeis ? data.eisarten.Softeis : '0'}</li>
                                <li>Eisbecher: {data.eisarten.Eisbecher ? data.eisarten.Eisbecher : '0'}</li>
                            </List>
                        </IceCreamSection>
                        <IceCreamSection>
                            <h3>Top 5 Geschmacksrichtungen</h3>
                            <List>
                                {data.top_5_geschmacksrichtung.map((sorte, i) => (
                                    <li key={i}>{sorte.sortenname} ({sorte.anzahl}x)</li>
                                ))}
                            </List>
                        </IceCreamSection>
                    </IceCreamStatsWrapper>

                    <StatsSection>
                        <StatBox>
                            <h2>{data.eisdielen_besucht}</h2>
                            <p>verschiedene Eisdielen besucht</p>
                        </StatBox>
                        <StatBox>
                            <h2>{data.anzahl_checkins}</h2>
                            <p>Check-ins</p>
                        </StatBox>
                        <StatBox>
                            <h2>{(data.eisarten.Kugel + data.eisarten.Softeis) ? (data.eisarten.Kugel + data.eisarten.Softeis) : '0'}</h2>
                            <p>Portionen Eis gegessen</p>
                        </StatBox>
                    </StatsSection>

                    <h3>Awards</h3>
                    <AwardsGrid>
                        {data.user_awards.map((award, index) => (
                            <AwardCard key={index}>
                                <AwardImage src={`https://ice-app.4lima.de/${award.icon_path}`} alt={award.title_de} />
                                <AwardTitle>{award.title_de}</AwardTitle>
                                <AwardDescription>{award.description_de}</AwardDescription>
                                <AwardDate>Vergeben am {new Date(award.awarded_at).toLocaleDateString()}</AwardDate>
                            </AwardCard>
                        ))}
                    </AwardsGrid>

                    <Section>
                        <h3>Verschiedene Eisdielen pro Landkreise</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.eisdielen_pro_landkreis} layout="vertical" margin={{ left: 50 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="landkreis" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="anzahl" fill="#4bc0c0" radius={[0, 5, 5, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Section>
                </DashboardWrapper>
            </div>
        </div >
    );
}

export default UserSite;

const DashboardWrapper = styled.div`
  width: 90%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  height: 100%;
`;

const HeaderDiv = styled.div`
  margin-bottom: 2rem;
  h1 {
    font-size: 2rem;
    margin-bottom: 0.25rem;
  }
`;

const StatsSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const StatBox = styled.div`
  flex: 1;
  background: #f0f8ff;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  min-width: 150px;

  h2 {
    margin: 0;
    font-size: 2rem;
    color: #0077b6;
  }

  p {
    margin: 0.5rem 0 0;
    color: #555;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Section = styled.section`
  margin-top: 2rem;
`;

const List = styled.ul`
  padding-left: 1.25rem;
  li {
    margin-bottom: 0.25rem;
  }
`;

const AwardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const AwardCard = styled.div`
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const AwardImage = styled.img`
  height: 150px;

  @media (max-width: 768px) {
    height: 100px;
  }
`;

const AwardTitle = styled.h3`
  font-weight: 600;
`;

const AwardDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin-top: 4px;
`;

const AwardDate = styled.span`
  font-size: 0.75rem;
  color: #999;
  margin-top: 8px;
`;

const IceCreamStatsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const IceCreamSection = styled.div`
  flex: 1;
  min-width: 200px;
`;