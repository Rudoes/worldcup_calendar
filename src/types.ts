export interface FifaLocalizedText {
  Locale: string;
  Description: string;
}

export interface FifaTeam {
  IdTeam?: string;
  IdCountry?: string;
  PictureUrl?: string;
  TeamName?: FifaLocalizedText[];
  Abbreviation?: string;
  ShortClubName?: string;
}

export interface FifaStadium {
  Name?: FifaLocalizedText[];
  CityName?: FifaLocalizedText[];
  IdCountry?: string;
}

export interface FifaMatch {
  IdCompetition: string;
  IdSeason: string;
  IdStage: string;
  IdGroup: string | null;
  IdMatch: string;
  StageName?: FifaLocalizedText[];
  GroupName?: FifaLocalizedText[];
  CompetitionName?: FifaLocalizedText[];
  SeasonName?: FifaLocalizedText[];
  Date: string;
  LocalDate: string;
  Home?: FifaTeam | null;
  Away?: FifaTeam | null;
  Stadium?: FifaStadium | null;
  MatchNumber: number;
  TimeDefined: boolean;
  PlaceHolderA?: string | null;
  PlaceHolderB?: string | null;
}

export interface FifaCalendarResponse {
  Results?: FifaMatch[];
}

export interface Participant {
  name: string;
  abbreviation?: string;
  placeholder?: string;
  fifaTeamId?: string;
  countryCode?: string;
  logoUrl?: string;
  flagUrl?: string;
}

export interface Venue {
  name: string;
  city: string;
  countryCode?: string;
  timeZone: string;
}

export interface NormalizedMatch {
  matchNumber: number;
  fifaMatchId: string;
  stage: string;
  group?: string;
  utcKickoff: string;
  localKickoff: string;
  durationMinutes: number;
  home: Participant;
  away: Participant;
  venue: Venue;
  sourceUrl: string;
}

export interface NormalizedDataFile {
  generatedAt: string;
  source: {
    apiUrl: string;
    schedulePage: string;
    schedulePdf: string;
  };
  expectedMatchCount: number;
  matches: NormalizedMatch[];
}
