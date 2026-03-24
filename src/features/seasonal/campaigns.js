import headerWideChristmas from '../../header_wide_christmas.png';
import headerWideEaster from '../../header_wide_easter.png';
import headerWide from '../../header_wide.png';

const isWithinRange = (now, start, endExclusive) => now >= start && now < endExclusive;

const EASTER_WINDOWS = {
  2026: {
    start: new Date('2026-04-03T00:00:00+02:00'),
    endExclusive: new Date('2026-04-14T00:00:00+02:00'),
  },
  2027: {
    start: new Date('2027-03-26T00:00:00+01:00'),
    endExclusive: new Date('2027-04-06T00:00:00+02:00'),
  },
  2028: {
    start: new Date('2028-04-14T00:00:00+02:00'),
    endExclusive: new Date('2028-04-25T00:00:00+02:00'),
  },
  2029: {
    start: new Date('2029-03-29T00:00:00+01:00'),
    endExclusive: new Date('2029-04-10T00:00:00+02:00'),
  },
};

export const CAMPAIGN_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  RESULTS: 'results',
  ARCHIVED: 'archived',
  INACTIVE: 'inactive',
};

export const seasonalCampaignDefinitions = [
  {
    id: 'christmas_legacy',
    title: 'Weihnachtsaktion',
    kind: 'archive',
    visualTheme: 'christmas',
    headerLogo: headerWideChristmas,
    teaserIcon: '/assets/christmas_elf.png',
    getStatus(now = new Date()) {
      const month = now.getMonth();
      const day = now.getDate();
      const isChristmasSeason = (month === 11 && day >= 1) || (month === 0 && day <= 6);
      return isChristmasSeason ? CAMPAIGN_STATUS.ACTIVE : CAMPAIGN_STATUS.ARCHIVED;
    },
  },
  {
    id: 'olympics_2026',
    title: 'Eis-Winterolympiade 2026',
    kind: 'results',
    teaserIcon: '/assets/olympia.png',
    schedule: {
      start: new Date('2026-02-06T00:00:00+01:00'),
      endExclusive: new Date('2026-02-23T00:00:00+01:00'),
    },
    getStatus() {
      return CAMPAIGN_STATUS.RESULTS;
    },
  },
  {
    id: 'birthday_2026',
    title: 'Ice-App Geburtstagschallenge 2026',
    kind: 'results',
    teaserIcon: '/assets/first-birthay-action.png',
    schedule: {
      start: new Date('2026-03-06T00:00:00+01:00'),
      endExclusive: new Date('2026-03-23T00:00:00+01:00'),
    },
    getStatus() {
      return CAMPAIGN_STATUS.RESULTS;
    },
  },
  {
    id: 'easter_2026',
    title: 'Osteraktion 2026',
    kind: 'campaign',
    teaserIcon: '/assets/easter-bunny.png',
    headerLogo: headerWideEaster,
    schedule: EASTER_WINDOWS[2026],
    api: {
      progress: '/api/easter_bunny_progress.php',
      hop: '/api/easter_bunny_hop.php',
      dailyHint: '/api/easter_bunny_daily_hint.php',
    },
    getStatus(now = new Date()) {
      const yearWindow = EASTER_WINDOWS[now.getFullYear()];
      if (!yearWindow) {
        return CAMPAIGN_STATUS.INACTIVE;
      }
      if (now < yearWindow.start) {
        return CAMPAIGN_STATUS.UPCOMING;
      }
      if (isWithinRange(now, yearWindow.start, yearWindow.endExclusive)) {
        return CAMPAIGN_STATUS.ACTIVE;
      }
      return CAMPAIGN_STATUS.RESULTS;
    },
  },
];

export const getCampaignDefinition = (campaignId) =>
  seasonalCampaignDefinitions.find((campaign) => campaign.id === campaignId) || null;

export const getCampaignStatus = (campaignId, now = new Date()) =>
  getCampaignDefinition(campaignId)?.getStatus(now) || CAMPAIGN_STATUS.INACTIVE;

export const getResolvedSeasonalCampaigns = (now = new Date()) => {
  const campaigns = seasonalCampaignDefinitions.map((campaign) => ({
    ...campaign,
    status: campaign.getStatus(now),
  }));
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === CAMPAIGN_STATUS.ACTIVE);
  const featuredCampaign = activeCampaigns[0] || null;
  const visualCampaign = campaigns.find(
    (campaign) => campaign.status === CAMPAIGN_STATUS.ACTIVE && campaign.headerLogo
  ) || null;

  return {
    campaigns,
    featuredCampaign,
    activeCampaigns,
    visualTheme: visualCampaign?.visualTheme || null,
    headerLogo: visualCampaign?.headerLogo || headerWide,
  };
};

export const getSpecialTime = (now = new Date()) => getResolvedSeasonalCampaigns(now).visualTheme;

export const getActionsOverviewCampaigns = (now = new Date()) =>
  getResolvedSeasonalCampaigns(now).campaigns.filter((campaign) => (
    campaign.status === CAMPAIGN_STATUS.ACTIVE
    || campaign.status === CAMPAIGN_STATUS.UPCOMING
    || campaign.status === CAMPAIGN_STATUS.RESULTS
  ));
