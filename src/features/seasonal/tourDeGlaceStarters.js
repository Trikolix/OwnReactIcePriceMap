// Fahrer koennen hier manuell ergaenzt werden, sobald sie offiziell bestaetigt sind.
// Statuswerte: official, provisional, manual.
export const TOUR_DE_GLACE_STARTERS = [
  { name: 'Jasper Philipsen', team: 'Alpecin-Premier Tech', status: 'provisional' },
  { name: 'Mathieu van der Poel', team: 'Alpecin-Premier Tech', status: 'provisional' },
  { name: 'Emiel Verstrynge', team: 'Alpecin-Premier Tech', status: 'provisional' },
  { name: 'Jonas Rickaert', team: 'Alpecin-Premier Tech', status: 'provisional' },

  { name: 'Antonio Tiberi', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Phil Bauhaus', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Damiano Caruso', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Kamil Gradek', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Lenny Martinez', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Matej Mohoric', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Robert Stannard', team: 'Bahrain Victorious', status: 'official' },
  { name: 'Vlad Van Mechelen', team: 'Bahrain Victorious', status: 'official' },

  { name: 'Abel Balderstone', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Sebastian Berwick', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Fernando Gaviria', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Alex Molenaar', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Joel Nicolau', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Stefano Oldani', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Jakub Otruba', team: 'Caja Rural-Seguros RGA', status: 'official' },
  { name: 'Jose Felix Parra', team: 'Caja Rural-Seguros RGA', status: 'official' },

  { name: 'Piet Allegaert', team: 'Cofidis', status: 'official' },
  { name: 'Alex Aranburu', team: 'Cofidis', status: 'official' },
  { name: 'Jenthe Biermans', team: 'Cofidis', status: 'official' },
  { name: 'Ion Izagirre', team: 'Cofidis', status: 'official' },
  { name: 'Milan Fretin', team: 'Cofidis', status: 'official' },
  { name: 'Alex Kirsch', team: 'Cofidis', status: 'official' },
  { name: 'Hugo Page', team: 'Cofidis', status: 'official' },
  { name: 'Benjamin Thomas', team: 'Cofidis', status: 'official' },

  { name: 'Paul Seixas', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Tiesj Benoot', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Cees Bol', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Daan Hoole', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Olav Kooij', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Aurelien Paret-Peintre', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Nicolas Prodhomme', team: 'Decathlon CMA CGM Team', status: 'official' },
  { name: 'Matthew Riccitello', team: 'Decathlon CMA CGM Team', status: 'official' },

  { name: 'Ben Healy', team: 'EF Education-EasyPost', status: 'provisional' },
  { name: 'Kasper Asgreen', team: 'EF Education-EasyPost', status: 'provisional' },
  { name: 'Richard Carapaz', team: 'EF Education-EasyPost', status: 'provisional' },
  { name: 'Alex Baudin', team: 'EF Education-EasyPost', status: 'provisional' },

  { name: 'Guillaume Martin', team: 'Groupama-FDJ United', status: 'provisional' },
  { name: 'Romain Gregoire', team: 'Groupama-FDJ United', status: 'provisional' },

  { name: 'Huub Artz', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Jenno Berckmoes', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Lars Craps', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Arnaud De Lie', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Liam Slock', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Lennert Van Eetvelt', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Baptiste Veistroffer', team: 'Lotto Intermarche', status: 'official' },
  { name: 'Georg Zimmermann', team: 'Lotto Intermarche', status: 'official' },

  { name: 'Juan Ayuso', team: 'Lidl-Trek', status: 'official' },
  { name: 'Derek Gee-West', team: 'Lidl-Trek', status: 'official' },
  { name: 'Mads Pedersen', team: 'Lidl-Trek', status: 'official' },
  { name: 'Quinn Simmons', team: 'Lidl-Trek', status: 'official' },
  { name: 'Mattias Skjelmose', team: 'Lidl-Trek', status: 'official' },
  { name: 'Toms Skujins', team: 'Lidl-Trek', status: 'official' },
  { name: 'Mathias Vacek', team: 'Lidl-Trek', status: 'official' },
  { name: 'Carlos Verona', team: 'Lidl-Trek', status: 'official' },

  { name: 'Cian Uijtdebroeks', team: 'Movistar Team', status: 'provisional' },
  { name: 'Einer Rubio', team: 'Movistar Team', status: 'provisional' },
  { name: 'Pablo Castrillo', team: 'Movistar Team', status: 'provisional' },
  { name: 'Roger Adria', team: 'Movistar Team', status: 'provisional' },

  { name: 'Filippo Ganna', team: 'Netcompany Ineos', status: 'provisional' },
  { name: 'Carlos Rodriguez', team: 'Netcompany Ineos', status: 'provisional' },
  { name: 'Michal Kwiatkowski', team: 'Netcompany Ineos', status: 'provisional' },
  { name: 'Kevin Vauquelin', team: 'Netcompany Ineos', status: 'provisional' },
  { name: 'Dorian Godon', team: 'Netcompany Ineos', status: 'provisional' },
  { name: 'Thymen Arensman', team: 'Netcompany Ineos', status: 'provisional' },

  { name: 'Biniam Girmay', team: 'NSN Cycling Team', status: 'official' },
  { name: 'Lewis Askey', team: 'NSN Cycling Team', status: 'official' },
  { name: 'George Bennett', team: 'NSN Cycling Team', status: 'official' },
  { name: 'Marco Frigo', team: 'NSN Cycling Team', status: 'official' },
  { name: 'Matis Louvel', team: 'NSN Cycling Team', status: 'official' },
  { name: 'Krists Neilands', team: 'NSN Cycling Team', status: 'official' },
  { name: 'Jake Stewart', team: 'NSN Cycling Team', status: 'official' },
  { name: 'Tom Van Asbroeck', team: 'NSN Cycling Team', status: 'official' },

  { name: 'Tom Pidcock', team: 'Pinarello-Q.36.5 Pro Cycling Team', status: 'provisional' },
  { name: 'Fred Wright', team: 'Pinarello-Q.36.5 Pro Cycling Team', status: 'provisional' },
  { name: 'Quinten Hermans', team: 'Pinarello-Q.36.5 Pro Cycling Team', status: 'provisional' },

  { name: 'Warren Barguil', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'Frits Biesterbos', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'Pavel Bittner', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'John Degenkolb', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'Robbe Dhondt', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'Niklas Markl', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'Julius van den Berg', team: 'Team Picnic PostNL', status: 'official' },
  { name: 'Frank van den Broek', team: 'Team Picnic PostNL', status: 'official' },

  { name: 'Remco Evenepoel', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Florian Lipowitz', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Mattia Cattaneo', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Maxim Van Gils', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Nico Denz', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Jai Hindley', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Jan Tratnik', team: 'Red Bull-BORA-hansgrohe', status: 'official' },
  { name: 'Tim van Dijke', team: 'Red Bull-BORA-hansgrohe', status: 'official' },

  { name: 'Valentin Paret-Peintre', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Mikel Landa', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Tim Merlier', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Jasper Stuyven', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Ilan Van Wilder', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Louis Vervaeke', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Dylan van Baarle', team: 'Soudal Quick-Step', status: 'official' },
  { name: 'Bert Van Lerberghe', team: 'Soudal Quick-Step', status: 'official' },

  { name: 'Pascal Ackermann', team: 'Team Jayco AlUla', status: 'official' },
  { name: 'Luke Durbridge', team: 'Team Jayco AlUla', status: 'official' },
  { name: 'Felix Engelhardt', team: 'Team Jayco AlUla', status: 'official' },
  { name: "Kelland O'Brien", team: 'Team Jayco AlUla', status: 'official' },
  { name: "Ben O'Connor", team: 'Team Jayco AlUla', status: 'official' },
  { name: 'Michael Matthews', team: 'Team Jayco AlUla', status: 'official' },
  { name: 'Luke Plapp', team: 'Team Jayco AlUla', status: 'official' },
  { name: 'Mauro Schmid', team: 'Team Jayco AlUla', status: 'official' },

  { name: 'Julian Alaphilippe', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Marco Haller', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Marc Hirschi', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Arvid de Kleijn', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Rick Pluimers', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Michael Storer', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Matteo Trentin', team: 'Tudor Pro Cycling Team', status: 'official' },
  { name: 'Yannis Voisard', team: 'Tudor Pro Cycling Team', status: 'official' },

  { name: 'Nicolas Breuillard', team: 'TotalEnergies', status: 'official' },
  { name: 'Joris Delbove', team: 'TotalEnergies', status: 'official' },
  { name: 'Alexandre Delettre', team: 'TotalEnergies', status: 'official' },
  { name: 'Thibault Guernalec', team: 'TotalEnergies', status: 'official' },
  { name: 'Jordan Jegat', team: 'TotalEnergies', status: 'official' },
  { name: 'Mathis Le Berre', team: 'TotalEnergies', status: 'official' },
  { name: 'Anthony Turgis', team: 'TotalEnergies', status: 'official' },
  { name: 'Matteo Vercher', team: 'TotalEnergies', status: 'official' },

  { name: 'Tadej Pogacar', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Isaac del Toro', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Adam Yates', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Florian Vermeersch', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Nils Politt', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Brandon McNulty', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Tim Wellens', team: 'UAE Team Emirates-XRG', status: 'official' },
  { name: 'Felix Grossschartner', team: 'UAE Team Emirates-XRG', status: 'official' },

  { name: 'Tobias Halland Johannessen', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Anders Halland Johannessen', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Soren Waerenskjold', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Magnus Cort', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Jonas Abrahamsen', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Anthon Charmig', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Anders Skaarseth', team: 'Uno-X Mobility', status: 'official' },
  { name: 'Torstein Traeen', team: 'Uno-X Mobility', status: 'official' },

  { name: 'Jonas Vingegaard', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Victor Campenaerts', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Edoardo Affini', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Per Strand Hagenes', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Matteo Jorgenson', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Sepp Kuss', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Bruno Armirail', team: 'Team Visma | Lease a Bike', status: 'official' },
  { name: 'Davide Piganzoli', team: 'Team Visma | Lease a Bike', status: 'official' },

  { name: 'Davide Ballerini', team: 'XDS Astana Team', status: 'official' },
  { name: 'Aaron Gate', team: 'XDS Astana Team', status: 'official' },
  { name: 'Sergio Higuita', team: 'XDS Astana Team', status: 'official' },
  { name: 'Max Kanter', team: 'XDS Astana Team', status: 'official' },
  { name: 'Harold Tejada', team: 'XDS Astana Team', status: 'official' },
  { name: 'Mike Teunissen', team: 'XDS Astana Team', status: 'official' },
  { name: 'Simone Velasco', team: 'XDS Astana Team', status: 'official' },
  { name: 'Nicolas Vinokurov', team: 'XDS Astana Team', status: 'official' }
];

export const normalizeTourDeGlaceStarterSearch = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('de-DE');

const starterMatchRank = (starter, query) => {
  const name = normalizeTourDeGlaceStarterSearch(starter.name);
  const team = normalizeTourDeGlaceStarterSearch(starter.team);
  const nameWords = name.split(' ');

  if (name.startsWith(query)) return 0;
  if (nameWords.some((word) => word.startsWith(query))) return 1;
  if (name.includes(query)) return 2;
  if (team.startsWith(query)) return 3;
  if (team.split(' ').some((word) => word.startsWith(query))) return 4;
  if (team.includes(query)) return 5;
  return 99;
};

export const getTourDeGlaceStarterSuggestions = (value, limit = 8) => {
  const query = normalizeTourDeGlaceStarterSearch(value);
  if (query.length < 2) {
    return [];
  }

  return TOUR_DE_GLACE_STARTERS
    .map((starter, index) => ({
      starter,
      index,
      rank: starterMatchRank(starter, query),
    }))
    .filter((entry) => entry.rank < 99)
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      return left.index - right.index;
    })
    .slice(0, limit)
    .map((entry) => entry.starter);
};
