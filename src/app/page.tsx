'use client'
// YoutubePlaylists.tsx
import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = ''; // Replace with your OAuth 2.0 Client ID
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';


interface Video {
  id: string;
  title: string;
}

interface Playlist {
  id: string;
  title: string;
  videos: Video[];
}

const YoutubePlaylists = () => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    gapi.load('client:auth2', initClient);
  }, []);

  const initClient = () => {
    gapi.client.init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES,
    }).then(() => {
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
  };

  const updateSigninStatus = (signedIn: boolean) => {
    setIsSignedIn(signedIn);
    if (signedIn) {
      fetchPlaylists();
    }
  };

  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const handleSignoutClick = () => {
    gapi.auth2.getAuthInstance().signOut();
  };

  const fetchPlaylists = () => {
    gapi.client.youtube.playlists.list({
      part: "snippet,contentDetails",
      mine: true,
      maxResults: 25
    }).then(async response => {
      const items = response.result.items;
      console.log(response, "aaaaaaaaaaaaa")
      if (items) {
        const playlistsPromises = items.map(async (item: any) => {
          const playlistId = item.id;
          const playlistTitle = item.snippet.title;
          const videos = await fetchPlaylistVideos(playlistId);
  
          return {
            id: playlistId,
            title: playlistTitle,
            videos: videos
          };
        });
  
        const playlists = await Promise.all(playlistsPromises);
        setPlaylists(playlists);
      }
    }).catch(error => console.log(error));
  };
  
  const fetchPlaylistVideos = async (playlistId: string): Promise<Video[]> => {
    const response = await gapi.client.youtube.playlistItems.list({
      part: "snippet",
      playlistId: playlistId,
      maxResults: 50 // Adjust this number as needed
    });
  
    return response.result.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title
    }));
  };

  return (
    <div>
      {!isSignedIn ? (
        <button onClick={handleAuthClick}>Authorize</button>
      ) : (
        <button onClick={handleSignoutClick}>Sign Out</button>
      )}
  
      <h2>Your YouTube Playlists:</h2>
      <ul>
        {playlists.map(playlist => (
          <li key={playlist.id}>
            {playlist.title} (ID: {playlist.id})
            <ul>
              {playlist.videos.map(video => (
                <li key={video.id}>{video.title} (Video ID: {video.id})</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default YoutubePlaylists;
