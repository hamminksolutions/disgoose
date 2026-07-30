# No manual album entry without a MusicBrainz match

If an album isn't in MusicBrainz (obscure or very new), a user cannot add it in v1 — there is no parallel "add manually without an MBID" flow. Knowingly accepted gap, to avoid building a second, cover-less entry path through the entire data layer (nullable `mb_release_group_id`, separate UI state) for an edge case. Easy to add in a later version if this turns out to happen often in practice.
