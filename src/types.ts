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
  IdStadium?: string;
  Name?: FifaLocalizedText[];
  IdCity?: string;
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
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
  AggregateHomeTeamScore?: number | null;
  AggregateAwayTeamScore?: number | null;
  HomeTeamPenaltyScore?: number | null;
  AwayTeamPenaltyScore?: number | null;
  Stadium?: FifaStadium | null;
  Winner?: string | null;
  MatchStatus?: number | null;
  ResultType?: number | null;
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
  fifaStadiumId?: string;
  fifaCityId?: string;
  timeZone: string;
}

export interface Score {
  home: number;
  away: number;
  homePenalties?: number;
  awayPenalties?: number;
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
  score?: Score;
  winner?: "home" | "away";
  matchStatus?: number;
  resultType?: number;
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
