# API Endpoint Inventory

Generated: 2026-03-05 14:46:43 CET

- Frontend-referenced endpoints: 90
- Backend candidate endpoints: 120
- Backend candidate endpoints not referenced by frontend: 30
- Missing endpoint files in repo (but referenced by frontend): 0

## Frontend to Backend Mapping

| Endpoint | Domain | Callers | v2 Target | Status |
|---|---|---|---|---|
| /activity_feed.php | Community/User | src/pages/DashBoard.jsx | /api/v2/users/* | Legacy active |
| /admin/get_shop_change_requests.php | Admin | src/pages/ShopChangeRequestsAdmin.jsx | /api/v2/admin/* | Legacy active |
| /admin/handle_shop_change_request.php | Admin | src/pages/ShopChangeRequestsAdmin.jsx | /api/v2/admin/* | Legacy active |
| /api/birthday_easter_egg_click.php | Challenges/Event | src/archive/seasonal/legacy/BirthdayPresentMarkers.jsx | /api/v2/challenges/* | Archived legacy |
| /api/birthday_leaderboard.php | Challenges/Event | src/pages/ActionsOverview.jsx | /api/v2/challenges/* | Legacy active |
| /api/birthday_progress.php | Challenges/Event | src/pages/ActionsOverview.jsx | /api/v2/challenges/* | Legacy active |
| /api/birthday_track_event_page.php | Challenges/Event | src/pages/Event/RadEvent.jsx | /api/v2/challenges/* | Legacy active |
| /api/challenge_generate.php | Challenges/Event | src/pages/Challenges.jsx | /api/v2/challenges/* | Legacy active |
| /api/challenge_list.php | Challenges/Event | src/pages/Challenges.jsx | /api/v2/challenges/* | Legacy active |
| /api/checkin_mentions.php | Community/User | src/components/MentionInviteModal.jsx | TBD | Legacy active |
| /api/easter_bunny_daily_hint.php | Challenges/Event | src/features/seasonal/EasterCampaignPanel.jsx | /api/v2/challenges/* | New seasonal |
| /api/easter_bunny_hop.php | Challenges/Event | src/features/seasonal/EasterMapEncounter.jsx | /api/v2/challenges/* | New seasonal |
| /api/easter_bunny_progress.php | Challenges/Event | src/features/seasonal/EasterCampaignPanel.jsx<br>src/features/seasonal/EasterMapEncounter.jsx | /api/v2/challenges/* | New seasonal |
| /api/get_preise_hierarchisch.php | Statistics | src/pages/Statistics.jsx | /api/v2/statistics/* | Legacy active |
| /api/get_preset_avatars.php | User API | src/pages/UserSettings.jsx | /api/v2/users/* | Legacy active |
| /api/get_user_notification_settings.php | User API | src/pages/UserSettings.jsx | /api/v2/users/* | Legacy active |
| /api/olympics_leaderboard.php | Challenges/Event | src/pages/ActionsOverview.jsx | /api/v2/challenges/* | Legacy active |
| /api/qr_scan.php | User API | src/Header.jsx | /api/v2/users/* | Legacy active |
| /api/search_user.php | User API | src/components/UserMentionField.jsx | /api/v2/users/* | Legacy active |
| /api/update_user_notification_settings.php | User API | src/pages/UserSettings.jsx | /api/v2/users/* | Legacy active |
| /api/seasonal_award_grant.php | Community/User | TBD | /api/v2/users/* | New seasonal helper |
| /benachrichtigungen.php | Community/User | src/components/NotificationBell.jsx | /api/v2/users/* | Legacy active |
| /checkin/checkin_upload.php | Checkins | src/CheckinForm.jsx | /api/v2/checkins | Legacy active |
| /checkin/delete_checkin.php | Checkins | src/CheckinForm.jsx | /api/v2/checkins | Legacy active |
| /checkin/get_checkin.php | Checkins | src/components/MentionInviteModal.jsx<br>src/CheckinForm.jsx | /api/v2/checkins | Legacy active |
| /checkin/sorten.php | Checkins | src/CheckinForm.jsx | /api/v2/checkins | Legacy active |
| /checkin/update_checkin.php | Checkins | src/CheckinForm.jsx | /api/v2/checkins | Legacy active |
| /event2026/invite_claim.php | Event2026 | src/pages/Event/EventInviteClaim.jsx | /api/v2/event/* | Legacy active |
| /event2026/invite_reissue.php | Event2026 | src/pages/Event/EventMyRegistration.jsx | /api/v2/event/* | Legacy active |
| /event2026/live_checkpoint_checkins.php | Event2026 | src/pages/Event/EventLiveMap.jsx | /api/v2/event/* | Legacy active |
| /event2026/live_checkpoints.php | Event2026 | src/pages/Event/EventLiveMap.jsx | /api/v2/event/* | Legacy active |
| /event2026/me.php | Event2026 | src/pages/Event/EventMyRegistration.jsx | /api/v2/event/* | Legacy active |
| /event2026/registration_summary.php | Event2026 | src/pages/Event/EventRegistrationSummary.jsx | /api/v2/event/* | Legacy active |
| /event2026/registrations.php | Event2026 | src/pages/Event/EventRegistration.jsx | /api/v2/event/* | Legacy active |
| /favoriten_liste.php | Favorites | src/pages/FavoritenListe.jsx | /api/v2/favorites | Legacy active |
| /favoriten_toggle.php | Favorites | src/pages/FavoritenListe.jsx<br>src/components/FavoritButton.jsx | /api/v2/favorites | Legacy active |
| /getBestShopsByFlavour.php | Shops | src/pages/Statistics.jsx | /api/v2/shops/* | Legacy active |
| /get_all_eisdielen.php | Shops | src/IceCreamRadar.jsx | /api/v2/shops/* | Legacy active |
| /get_eisbecher_rating.php | Misc | src/pages/Ranking.jsx | TBD | Legacy active |
| /get_eisdiele.php | Shops | src/Sidebar.jsx<br>src/IceCreamRadar.jsx<br>src/ShopDetailsView.jsx | /api/v2/shops/* | Legacy active |
| /get_eisdiele_details.php | Shops | src/pages/IceShopDetailPage.jsx | /api/v2/shops/* | Legacy active |
| /get_eisdielen_list.php | Shops | src/SubmitRouteModal.jsx | /api/v2/shops/* | Legacy active |
| /get_kugeleis_rating.php | Misc | src/pages/Ranking.jsx | TBD | Legacy active |
| /get_softeis_rating.php | Misc | src/pages/Ranking.jsx | TBD | Legacy active |
| /get_user_flavour_details.php | Community/User | src/pages/UserSite.jsx | /api/v2/users/* | Legacy active |
| /get_user_of_the_month.php | Community/User | src/Header.jsx<br>src/pages/ActionsOverview.jsx | /api/v2/users/* | Legacy active |
| /get_user_stats.php | Community/User | src/Header.jsx<br>src/pages/UserSite.jsx<br>src/pages/Event/Header.jsx | /api/v2/users/* | Legacy active |
| /grant_secret_award.php | Community/User | src/archive/seasonal/legacy/ChristmasElf.jsx<br>src/archive/seasonal/legacy/EasterBunny.jsx<br>src/archive/seasonal/legacy/OlympicsVenues.jsx | /api/v2/users/* | Archived legacy wrapper |
| /is_favorit.php | Favorites | src/components/FavoritButton.jsx | /api/v2/favorites | Legacy active |
| /kommentare.php | Community/User | src/components/CommentSection.jsx | /api/v2/users/* | Legacy active |
| /photo_challenge/add_images.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/advance_ko_round.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/close_submission_phase.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/create_challenge.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/delete_submission.php | PhotoChallenge | src/pages/PhotoChallengeVoting/index.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/get_challenge_overview.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx<br>src/pages/PhotoChallengeVoting/index.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/list_challenge_images.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/list_challenges.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/list_public_challenges.php | PhotoChallenge | src/pages/PhotoChallengeList.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/list_submissions.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/list_user_images.php | PhotoChallenge | src/pages/PhotoChallengeVoting/index.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/remove_image.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/review_submission.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/search_images.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/start_group_phase.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/start_ko_phase.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/submit_image.php | PhotoChallenge | src/pages/PhotoChallengeVoting/index.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/update_challenge.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/update_group_times.php | PhotoChallenge | src/pages/PhotoChallengeAdmin.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/update_submission.php | PhotoChallenge | src/pages/PhotoChallengeVoting/index.jsx | /api/v2/photo-challenges | Legacy active |
| /photo_challenge/vote.php | PhotoChallenge | src/pages/PhotoChallengeVoting/index.jsx | /api/v2/photo-challenges | Legacy active |
| /review/getReview.php | Reviews | src/SubmitReviewModal.jsx | /api/v2/reviews | Legacy active |
| /review/submitReview.php | Reviews | src/SubmitReviewModal.jsx | /api/v2/reviews | Legacy active |
| /routen/deleteRoute.php | Routes | src/SubmitRouteModal.jsx | /api/v2/routes | Legacy active |
| /routen/getRoutes.php | Routes | src/ShopDetailsView.jsx | /api/v2/routes | Legacy active |
| /routen/listRoutes.php | Routes | src/pages/Routes.jsx | /api/v2/routes | Legacy active |
| /routen/submitRoute.php | Routes | src/SubmitRouteModal.jsx | /api/v2/routes | Legacy active |
| /routen/updateRoute.php | Routes | src/SubmitRouteModal.jsx | /api/v2/routes | Legacy active |
| /statistics.php | Shops | src/pages/Statistics.jsx | /api/v2/statistics/* | Legacy active |
| /submitIceShop.php | Shops | src/SubmitIceShopModal.jsx | /api/v2/shops/* | Legacy active |
| /submitPrice.php | Shops | src/SubmitReviewModal.jsx<br>src/SubmitPriceModal.jsx<br>src/CheckinForm.jsx | /api/v2/shops/* | Legacy active |
| /submitWebsiteForShop.php | Shops | src/components/ShopWebsite.jsx | /api/v2/shops/* | Legacy active |
| /systemmeldung.php | Community/User | src/components/SystemmeldungForm.jsx<br>src/components/NotificationBell.jsx | /api/v2/users/* | Legacy active |
| /updateIceShop.php | Shops | src/SubmitIceShopModal.jsx | /api/v2/shops/* | Legacy active |
| /userManagement/login.php | Auth/User | src/LoginModal.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/logout.php | Auth/User | src/context/UserContext.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/register.php | Auth/User | src/LoginModal.jsx<br>src/components/RegisterForm.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/reset_password.php | Auth/User | src/components/ResetPasswordModal.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/reset_password_request.php | Auth/User | src/LoginModal.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/session.php | Auth/User | src/context/UserContext.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/update_activity_and_awards.php | Auth/User | src/Header.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/update_avatar.php | Auth/User | src/pages/UserSettings.jsx | /api/v2/auth/* | Legacy active |
| /userManagement/validate_reset_token.php | Auth/User | src/components/ResetPasswordModal.jsx | /api/v2/auth/* | Legacy active |
| /verify.php | Auth/User | src/pages/VerifyAccount.jsx | /api/v2/auth/* | Legacy active |

## Backend Candidate Endpoints Not Referenced by Frontend

These are potential legacy/external-consumer endpoints. Deprecate behind wrappers before deletion.

| Endpoint | Suggested Action |
|---|---|
| /add_preis.php | deprecate + monitor |
| /api/olympics_progress.php | deprecate + monitor |
| /api/sachsendreier_activity.php | deprecate + monitor |
| /awards/add_award.php | deprecate + monitor |
| /awards/add_award_level.php | deprecate + monitor |
| /awards/award_icon_variants.php | deprecate + monitor |
| /awards/awards_cache.php | deprecate + monitor |
| /awards/get_awards.php | deprecate + monitor |
| /awards/index.php | deprecate + monitor |
| /awards/save_award_level.php | deprecate + monitor |
| /create_invitation.php | deprecate + monitor |
| /db_connect.php | internal helper, no direct HTTP use |
| /event/submit_registration.php | deprecate + monitor |
| /event2026/bootstrap.php | internal helper, no direct HTTP use |
| /event2026/checkpoints_pass.php | deprecate + monitor |
| /get_attribute.php | deprecate + monitor |
| /get_eisdiele_nahe.php | deprecate + monitor |
| /get_eisdielen_boundingbox.php | deprecate + monitor |
| /get_eisdielen_boundingbox_simple.php | keep wrapper (already legacy->v2) |
| /get_eisdielen_preisleistung.php | deprecate + monitor |
| /get_shop_details.php | keep wrapper (already legacy->v2) |
| /get_user_checkins.php | deprecate + monitor |
| /get_user_reviews.php | deprecate + monitor |
| /grant_secret_workshop_award.php | deprecate + monitor |
| /index.php | legacy entrypoint; keep temporarily |
| /photo_challenge/helpers.php | internal helper, no direct HTTP use |
| /routen/routes_api.php | deprecate + monitor |
| /submitNewOpeningHours.php | deprecate + monitor |
| /submit_price_and_rating.php | keep wrapper (already legacy->v2) |
| /userManagement/cleanup_expired_tokens.php | deprecate + monitor |

## Immediate Migration Wave (Recommended)

1. Shops: get_eisdiele.php, get_all_eisdielen.php, submitPrice.php, submitIceShop.php, updateIceShop.php
2. Checkins: /checkin/* + api/checkin_mentions.php
3. Favorites + Reviews + Routes
4. Event2026: add missing invite_claim.php, invite_reissue.php, registration_summary.php or reroute frontend
