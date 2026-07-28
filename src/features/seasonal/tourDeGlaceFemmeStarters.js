export const TOUR_DE_GLACE_FEMME_STARTERS = [
  ['Demi Vollering', 'FDJ United-SUEZ'], ['Pauline Ferrand-Prevot', 'Team Visma | Lease a Bike'], ['Katarzyna Niewiadoma-Phinney', 'Canyon//SRAM zondacrypto'], ['Lotte Kopecky', 'SD Worx-Protime'], ['Elisa Longo Borghini', 'UAE Team ADQ'], ['Sarah Gigante', 'AG Insurance-Soudal Team'], ['Niamh Fisher-Black', 'Lidl-Trek'], ['Juliette Labous', 'FDJ United-SUEZ'], ['Evita Muzic', 'FDJ United-SUEZ'], ['Cecilie Uttrup Ludwig', 'Canyon//SRAM zondacrypto'], ['Puck Pieterse', 'Fenix-Deceuninck'], ['Marianne Vos', 'Team Visma | Lease a Bike'], ['Lorena Wiebes', 'SD Worx-Protime'], ['Elisa Balsamo', 'Lidl-Trek'], ['Charlotte Kool', 'Picnic PostNL'], ['Lara Gillespie', 'UAE Team ADQ'], ['Kim Le Court-Pienaar', 'AG Insurance-Soudal Team'], ['Pauliena Rooijakkers', 'Fenix-Deceuninck'], ['Celine Kerbaol', 'EF Education-Oatly'], ['Silvia Persico', 'UAE Team ADQ'], ['Neve Bradbury', 'Canyon//SRAM zondacrypto'], ['Antonia Niedermaier', 'Canyon//SRAM zondacrypto'], ['Shirin van Anrooij', 'Lidl-Trek'], ['Riejanne Markus', 'Lidl-Trek'], ['Liane Lippert', 'Movistar Team'], ['Marlen Reusser', 'Movistar Team'], ['Mavi Garcia', 'Liv AlUla Jayco'], ['Ruby Roseman-Gannon', 'Liv AlUla Jayco'], ['Justine Ghekiere', 'AG Insurance-Soudal Team'], ['Anna van der Breggen', 'SD Worx-Protime'], ['Mischa Bredewold', 'SD Worx-Protime'], ['Yara Kastelijn', 'Fenix-Deceuninck'], ['Ally Wollaston', 'FDJ United-SUEZ'], ['Maike van der Duin', 'Canyon//SRAM zondacrypto'],
].map(([name, team]) => ({ name, team, status: 'provisional' }));

const normalize = (value) => String(value || '').trim().toLocaleLowerCase('de-DE');

export const getTourDeGlaceFemmeStarterSuggestions = (value, limit = 8) => {
  const query = normalize(value);
  if (query.length < 2) return [];
  return TOUR_DE_GLACE_FEMME_STARTERS
    .filter((starter) => normalize(starter.name).includes(query) || normalize(starter.team).includes(query))
    .slice(0, limit);
};
