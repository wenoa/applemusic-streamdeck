let musicScriptSource = """
on snapshot()
	tell application id "com.apple.Music"
		if player state is stopped then return {"stopped"}
		set stateOfPlayer to "playing"
		if player state is paused then set stateOfPlayer to "paused"
		try
			set trackOfPlayer to current track
			return {stateOfPlayer, persistent ID of trackOfPlayer, favorited of (my libraryVersionOf(trackOfPlayer)), artist of trackOfPlayer, album of trackOfPlayer}
		on error
			return {"stopped"}
		end try
	end tell
end snapshot

-- Music plays the tracks that aren't in the library through a copy that loses their favorite and their cover. Once
-- favorited, a track is added to the library, and Music keeps both in that library track, not in the copy.
on libraryVersionOf(trackOfPlayer)
	tell application id "com.apple.Music"
		set nameOfTrack to name of trackOfPlayer
		set artistOfTrack to artist of trackOfPlayer
		set albumOfTrack to album of trackOfPlayer
		set libraryTracks to (every track of library playlist 1 whose name is nameOfTrack and artist is artistOfTrack and album is albumOfTrack)
		if libraryTracks is {} then return trackOfPlayer
		return item 1 of libraryTracks
	end tell
end libraryVersionOf

on artworkOfCurrentTrack()
	tell application id "com.apple.Music"
		set trackOfPlayer to current track
		return {persistent ID of trackOfPlayer, raw data of artwork 1 of (my libraryVersionOf(trackOfPlayer))}
	end tell
end artworkOfCurrentTrack

on togglePlayback()
	tell application id "com.apple.Music" to playpause
end togglePlayback

on skipToNextTrack()
	tell application id "com.apple.Music" to next track
end skipToNextTrack

on returnToPreviousTrack()
	tell application id "com.apple.Music" to previous track
end returnToPreviousTrack

on toggleFavoriteOfCurrentTrack()
	tell application id "com.apple.Music"
		set favoriteHolder to my libraryVersionOf(current track)
		set favorited of favoriteHolder to not (favorited of favoriteHolder)
	end tell
end toggleFavoriteOfCurrentTrack

on changeVolumeBy(changeOfVolume)
	tell application id "com.apple.Music"
		set newVolume to (sound volume) + changeOfVolume
		if newVolume > 100 then set newVolume to 100
		if newVolume < 0 then set newVolume to 0
		set sound volume to newVolume
	end tell
end changeVolumeBy

on playPlaylist(playlistIdentifier)
	tell application id "com.apple.Music" to play (first playlist whose persistent ID is playlistIdentifier)
end playPlaylist

on listPlaylists()
	tell application id "com.apple.Music"
		return {persistent ID of every user playlist, name of every user playlist}
	end tell
end listPlaylists

on describePlaylist(playlistIdentifier, maximumArtworks, maximumExaminedTracks)
	set collectedArtworks to {}
	set seenAlbums to {}
	tell application id "com.apple.Music"
		set describedPlaylist to first playlist whose persistent ID is playlistIdentifier
		set nameOfPlaylist to name of describedPlaylist
		set examinedTracks to count of tracks of describedPlaylist
		if examinedTracks > maximumExaminedTracks then set examinedTracks to maximumExaminedTracks
		repeat with trackIndex from 1 to examinedTracks
			if (count of collectedArtworks) >= maximumArtworks then exit repeat
			try
				set examinedTrack to track trackIndex of describedPlaylist
				set albumOfTrack to album of examinedTrack
				if seenAlbums does not contain {albumOfTrack} then
					set end of collectedArtworks to raw data of artwork 1 of examinedTrack
					set end of seenAlbums to albumOfTrack
				end if
			end try
		end repeat
	end tell
	return {nameOfPlaylist, collectedArtworks}
end describePlaylist
"""
