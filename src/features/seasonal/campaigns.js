import headerWideChristmas from '../../header_wide_christmas.png';
import headerWideEaster from '../../header_wide_easter.png';
import headerWide from '../../header_wide.png';

const isWithinRange = (now, start, endExclusive) => now >= start && now < endExclusive;
const TOUR_DE_GLACE_ADMIN_PREVIEW_START = new Date('2026-06-27T00:00:00+02:00');
const isTourDeGlaceAdminPreview = (now, campaign, context = {}) =>
  Boolean(context.isAdmin) && isWithinRange(now, TOUR_DE_GLACE_ADMIN_PREVIEW_START, campaign.schedule.preStart);

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
    mapRules: {
      bunnyMinZoom: 11,
      workshopMinZoom: 6,
    },
    api: {
      progress: '/api/easter_bunny_progress.php',
      hop: '/api/easter_bunny_hop.php',
      dailyHint: '/api/easter_bunny_daily_hint.php',
      workshopDiscover: '/api/easter_workshop_discover.php',
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
  {
    id: 'summer_2026',
    title: 'Sommer-Sammelaktion 2026',
    kind: 'campaign',
    teaserIcon: '/assets/summer_action_logo2.png',
    schedule: {
      start: new Date('2026-05-01T00:00:00+02:00'),
      endExclusive: new Date('2026-10-01T00:00:00+02:00'),
    },
    api: {
      progress: '/api/summer_campaign_progress.php',
    },
    getStatus(now = new Date()) {
      if (now < this.schedule.start) {
        return CAMPAIGN_STATUS.UPCOMING;
      }
      if (isWithinRange(now, this.schedule.start, this.schedule.endExclusive)) {
        return CAMPAIGN_STATUS.ACTIVE;
      }
      return CAMPAIGN_STATUS.RESULTS;
    },
  },
  {
    id: 'tour_de_glace_2026',
    title: 'Tour de Glace 2026',
    kind: 'campaign',
    promoPriority: 20,
    teaserIcon(now = new Date(), { isAdmin = false } = {}) {
      return isWithinRange(now, this.schedule.preStart, this.schedule.endExclusive)
        ? '/assets/tour-de-glace/tour_egg.png'
        : '/assets/summer_action_logo2.png';
    },
    schedule: {
      preStart: new Date('2026-06-28T00:00:00+02:00'),
      start: new Date('2026-07-04T00:00:00+02:00'),
      endExclusive: new Date('2026-07-27T00:00:00+02:00'),
      resultsHighlightEnd: new Date('2026-08-03T00:00:00+02:00'),
    },
    api: {
      progress: '/api/tour_de_glace_progress.php',
    },
    getStatus(now = new Date(), context = {}) {
      if (isTourDeGlaceAdminPreview(now, this, context)) {
        return CAMPAIGN_STATUS.ACTIVE;
      }
      if (now < this.schedule.preStart) {
        return CAMPAIGN_STATUS.UPCOMING;
      }
      if (isWithinRange(now, this.schedule.preStart, this.schedule.endExclusive)) {
        return CAMPAIGN_STATUS.ACTIVE;
      }
      return CAMPAIGN_STATUS.RESULTS;
    },
  },
  {
    id: 'tour_de_glace_femme_2026',
    title: 'Tour de Glace Femme 2026',
    kind: 'campaign',
    promoPriority: 19,
    teaserIcon: '/assets/tour-de-glace/TourDeGlaceFemmes.png',
    schedule: {
      preStart: new Date('2026-07-28T00:00:00+02:00'),
      start: new Date('2026-08-01T00:00:00+02:00'),
      endExclusive: new Date('2026-08-10T00:00:00+02:00'),
      resultsHighlightEnd: new Date('2026-08-17T00:00:00+02:00'),
    },
    api: { progress: '/api/tour_de_glace_femme_progress.php' },
    getStatus(now = new Date()) {
      if (now < this.schedule.preStart) return CAMPAIGN_STATUS.UPCOMING;
      if (isWithinRange(now, this.schedule.preStart, this.schedule.endExclusive)) return CAMPAIGN_STATUS.ACTIVE;
      return CAMPAIGN_STATUS.RESULTS;
    },
  },
];

export const getCampaignDefinition = (campaignId) =>
  seasonalCampaignDefinitions.find((campaign) => campaign.id === campaignId) || null;

export const isTourDeGlaceResultsHighlight = (now = new Date(), campaign = getCampaignDefinition('tour_de_glace_2026')) =>
  Boolean(campaign?.schedule?.endExclusive && campaign?.schedule?.resultsHighlightEnd)
  && isWithinRange(now, campaign.schedule.endExclusive, campaign.schedule.resultsHighlightEnd);

export const getCampaignStatus = (campaignId, now = new Date(), context = {}) =>
  getCampaignDefinition(campaignId)?.getStatus(now, context) || CAMPAIGN_STATUS.INACTIVE;

export const getResolvedSeasonalCampaigns = (now = new Date(), context = {}) => {
  const campaigns = seasonalCampaignDefinitions.map((campaign) => ({
    ...campaign,
    status: campaign.getStatus(now, context),
    resolvedTeaserIcon: typeof campaign.teaserIcon === 'function'
      ? campaign.teaserIcon(now, context)
      : campaign.teaserIcon,
    resolvedHeaderLogo: typeof campaign.headerLogo === 'function'
      ? campaign.headerLogo(now)
      : campaign.headerLogo,
  }));
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === CAMPAIGN_STATUS.ACTIVE);
  const featuredCampaign = [...activeCampaigns]
    .filter((campaign) => campaign.resolvedTeaserIcon)
    .sort((left, right) => (right.promoPriority || 0) - (left.promoPriority || 0))[0]
    || activeCampaigns[0]
    || null;
  const visualCampaign = campaigns.find(
    (campaign) => campaign.status === CAMPAIGN_STATUS.ACTIVE && campaign.resolvedHeaderLogo
  ) || null;

  return {
    campaigns,
    featuredCampaign,
    activeCampaigns,
    visualTheme: visualCampaign?.visualTheme || null,
    headerLogo: visualCampaign?.resolvedHeaderLogo || headerWide,
  };
};

export const getSpecialTime = (now = new Date()) => getResolvedSeasonalCampaigns(now).visualTheme;

export const getActionsOverviewCampaigns = (now = new Date(), context = {}) =>
  getResolvedSeasonalCampaigns(now, context).campaigns.filter((campaign) => (
    campaign.status === CAMPAIGN_STATUS.ACTIVE
    || campaign.status === CAMPAIGN_STATUS.UPCOMING
    || campaign.status === CAMPAIGN_STATUS.RESULTS
  ));
