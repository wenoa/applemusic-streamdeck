// Every handler receives the running Music process and talks only to it: if Music quits halfway through a handler,
// the next Apple Event fails instead of launching Music again, as one addressed by its bundle identifier would.
let musicScriptSource = """
on snapshot(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess
			if player state is stopped then return {"stopped"}
			set stateOfPlayer to "playing"
			if player state is paused then set stateOfPlayer to "paused"
			try
				set trackOfPlayer to current track
				return {stateOfPlayer, persistent ID of trackOfPlayer, favorited of (my libraryVersionOf(musicProcess, trackOfPlayer)), artist of trackOfPlayer, album of trackOfPlayer}
			on error
				return {"stopped"}
			end try
		end tell
	end using terms from
end snapshot

-- Music plays the tracks that aren't in the library through a copy that loses their favorite and their cover. Once
-- favorited, a track is added to the library, and Music keeps both in that library track, not in the copy.
on libraryVersionOf(musicProcess, trackOfPlayer)
	using terms from application id "com.apple.Music"
		tell musicProcess
			set nameOfTrack to name of trackOfPlayer
			set artistOfTrack to artist of trackOfPlayer
			set albumOfTrack to album of trackOfPlayer
			set libraryTracks to (every track of library playlist 1 whose name is nameOfTrack and artist is artistOfTrack and album is albumOfTrack)
			if libraryTracks is {} then return trackOfPlayer
			return item 1 of libraryTracks
		end tell
	end using terms from
end libraryVersionOf

on artworkOfCurrentTrack(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess
			set trackOfPlayer to current track
			return {persistent ID of trackOfPlayer, raw data of artwork 1 of (my libraryVersionOf(musicProcess, trackOfPlayer))}
		end tell
	end using terms from
end artworkOfCurrentTrack

on togglePlayback(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess to playpause
	end using terms from
end togglePlayback

on skipToNextTrack(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess to next track
	end using terms from
end skipToNextTrack

on returnToPreviousTrack(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess to previous track
	end using terms from
end returnToPreviousTrack

on toggleFavoriteOfCurrentTrack(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess
			set favoriteHolder to my libraryVersionOf(musicProcess, current track)
			set favorited of favoriteHolder to not (favorited of favoriteHolder)
		end tell
	end using terms from
end toggleFavoriteOfCurrentTrack

on changeVolumeBy(musicProcess, changeOfVolume)
	using terms from application id "com.apple.Music"
		tell musicProcess
			set newVolume to (sound volume) + changeOfVolume
			if newVolume > 100 then set newVolume to 100
			if newVolume < 0 then set newVolume to 0
			set sound volume to newVolume
		end tell
	end using terms from
end changeVolumeBy

on playPlaylist(musicProcess, playlistIdentifier)
	using terms from application id "com.apple.Music"
		tell musicProcess to play (first playlist whose persistent ID is playlistIdentifier)
	end using terms from
end playPlaylist

on listPlaylists(musicProcess)
	using terms from application id "com.apple.Music"
		tell musicProcess
			return {persistent ID of every user playlist, name of every user playlist}
		end tell
	end using terms from
end listPlaylists

on describePlaylist(musicProcess, playlistIdentifier, maximumArtworks, maximumExaminedTracks)
	set collectedArtworks to {}
	set seenAlbums to {}
	using terms from application id "com.apple.Music"
		tell musicProcess
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
	end using terms from
	return {nameOfPlaylist, collectedArtworks}
end describePlaylist
"""
