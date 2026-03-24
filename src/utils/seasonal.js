import { getResolvedSeasonalCampaigns, getSpecialTime } from '../features/seasonal/campaigns';

export const isSpecialTime = (now = new Date()) => getSpecialTime(now);

export const getSeasonalCampaignState = (now = new Date()) => getResolvedSeasonalCampaigns(now);
