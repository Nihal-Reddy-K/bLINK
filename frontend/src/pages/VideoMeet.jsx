import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getAvatarProps } from '../utils/avatar';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  Paper,
  InputAdornment,
  CircularProgress,
  Container,
  Divider
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  Chat,
  People,
  Send,
  PanTool,
  EmojiEmotions,
  ContentCopy,
  VolumeUp,
  VolumeMute,
  FiberManualRecord,
  Fullscreen,
  FullscreenExit,
  Settings,
  PhotoFilter
} from '@mui/icons-material';



// Google STUN servers for WebRTC NAT traversal
const iceServersConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const RemoteVideo = ({ stream }) => {
  return (
    <video
      ref={(el) => {
        if (el && stream) {
          el.srcObject = stream;
        }
      }}
      autoPlay
      playsInline
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  );
};

const VideoMeet = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Socket & WebRTC references
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pcs = useRef({}); // Stores RTCPeerConnection objects: { socketId: RTCPeerConnection }
  const remoteStreams = useRef({}); // Stores remote media streams: { socketId: MediaStream }
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micVolumeInterval = useRef(null);

  // Layout states
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [showDeviceSetup, setShowDeviceSetup] = useState(true);
  const [waitingRoomStatus, setWaitingRoomStatus] = useState(''); // 'waiting', 'approved', 'denied'
  const [meetingTitle, setMeetingTitle] = useState('Sync Call');
  const [meetingCreator, setMeetingCreator] = useState('');

  // Device selections
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  // Local Media controls
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);

  // Sidebars
  const [sidebarTab, setSidebarTab] = useState(''); // 'chat', 'participants', or '' (hidden)
  const [unreadCount, setUnreadCount] = useState(0);

  // Participants & Sockets list
  const [participants, setParticipants] = useState([]); // Array of peer info
  const [waitingParticipants, setWaitingParticipants] = useState([]); // List of users in waiting room

  // Chat & Messages
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [typingPeers, setTypingPeers] = useState({}); // { socketId: { name, timestamp } }
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Reaction Floating Emojis
  const [activeReactions, setActiveReactions] = useState([]); // Array of { id, emoji, senderName }
  
  // Timer & Stats
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Dialog settings
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // HTML Video Elements refs for streams
  const chatBottomRef = useRef(null);
  const [peerStreams, setPeerStreams] = useState({}); // { socketId: MediaStream }
  const [localStream, setLocalStream] = useState(null);
  const candidateQueues = useRef({}); // { socketId: [RTCIceCandidate] }

  // 1. Initial Device Enumerate & Setup
  useEffect(() => {
    // Read local preferences
    const camSetting = localStorage.getItem('blink_setting_camera');
    const micSetting = localStorage.getItem('blink_setting_mic');
    if (camSetting !== null) setVideoEnabled(camSetting === 'true');
    if (micSetting !== null) setAudioEnabled(micSetting === 'true');

    enumerateDevices();
    fetchMeetingDetails();
    
    return () => {
      cleanupResources();
    };
  }, []);

  // Timer loop
  useEffect(() => {
    let interval;
    if (meetingJoined) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [meetingJoined]);

  // Handle auto-scroll for chat message list
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sidebarTab]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await api.get(`/meetings/${roomId}`);
      if (response.data.success) {
        setMeetingTitle(response.data.meeting.title);
        setMeetingCreator(response.data.meeting.creator);
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      console.warn('Meeting room does not exist in DB yet, will create when joining');
    }
  };

  const enumerateDevices = async () => {
    try {
      // Request permissions first so we can label devices
      const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      initialStream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      if (videoInputs.length > 0) setSelectedVideoDevice(videoInputs[0].deviceId);
      if (audioInputs.length > 0) setSelectedAudioDevice(audioInputs[0].deviceId);

      // Start local stream preview
      startLocalPreview(videoInputs[0]?.deviceId, audioInputs[0]?.deviceId);
    } catch (err) {
      console.error('Error listing devices:', err);
    }
  };

  const startLocalPreview = async (videoDeviceId, audioDeviceId) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Apply initial enabled preferences
      const camSetting = localStorage.getItem('blink_setting_camera');
      const micSetting = localStorage.getItem('blink_setting_mic');
      
      const camOn = camSetting !== null ? camSetting === 'true' : true;
      const micOn = micSetting !== null ? micSetting === 'true' : true;

      stream.getVideoTracks().forEach(track => track.enabled = camOn);
      stream.getAudioTracks().forEach(track => track.enabled = micOn);
    } catch (err) {
      console.error('Failed to get media preview:', err);
    }
  };

  // 2. Setup socket connections, register WebRTC signaling event listeners
  const initSocketAndJoin = () => {
    setShowDeviceSetup(false);

    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : `http://${window.location.hostname}:5000`;
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      secure: true,
      rejectUnauthorized: false
    });

    const isHost = user?.username === meetingCreator;
    const wrSetting = localStorage.getItem('blink_setting_waitingroom');
    const waitingRoomActive = wrSetting === 'true' && !isHost;

    if (waitingRoomActive) {
      // Request waiting room entrance
      setWaitingRoomStatus('waiting');
      socketRef.current.emit('join-waiting-room', {
        roomId,
        username: user?.username,
        name: user?.name,
        avatar: user?.avatar
      });
    } else {
      // Join call directly
      joinCallDirectly();
    }

    // --- SOCKET.IO EVENT LISTENERS ---

    // Waiting room statuses updates
    socketRef.current.on('waiting-room-status', ({ status }) => {
      setWaitingRoomStatus(status);
      if (status === 'approved') {
        joinCallDirectly();
      } else if (status === 'denied') {
        socketRef.current.disconnect();
      }
    });

    // Hosts list of waiting participants
    socketRef.current.on('waiting-room-update', ({ waitingList }) => {
      setWaitingParticipants(waitingList);
    });

    // Received participants details in room
    socketRef.current.on('all-peers', (peersList) => {
      console.log('Received list of all peers in room:', peersList);
      
      // We initiate WebRTC PeerConnections to all existing peers in the room
      peersList.forEach(peer => {
        const pc = createPeerConnection(peer.socketId);
        pcs.current[peer.socketId] = pc;
        
        // Add our local tracks to the connection
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
          });
        }

        // Create offer to connect
        initiateCallOffer(pc, peer.socketId);
      });
    });

    // A new peer joins the room
    socketRef.current.on('peer-joined', (peerInfo) => {
      console.log('A new peer joined:', peerInfo);
      // We don't create PC here immediately; we let the new peer initiate connections (all-peers offer)
      // However, we initialize placeholders in our state to render their cell
      setParticipants(prev => {
        if (prev.find(p => p.socketId === peerInfo.socketId)) return prev;
        return [...prev, peerInfo];
      });
    });

    // WebRTC signaling: Receive SDP Offer
    socketRef.current.on('receive-offer', async ({ senderSocketId, offer }) => {
      console.log(`Received SDP Offer from ${senderSocketId}`);
      
      let pc = pcs.current[senderSocketId];
      if (!pc) {
        pc = createPeerConnection(senderSocketId);
        pcs.current[senderSocketId] = pc;
        
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
          });
        }
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socketRef.current.emit('send-answer', {
          targetSocketId: senderSocketId,
          answer
        });

        // Flush candidates
        await processQueuedCandidates(senderSocketId);
      } catch (err) {
        console.error('Error handling SDP offer:', err);
      }
    });

    // WebRTC signaling: Receive SDP Answer
    socketRef.current.on('receive-answer', async ({ senderSocketId, answer }) => {
      console.log(`Received SDP Answer from ${senderSocketId}`);
      const pc = pcs.current[senderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Flush candidates
          await processQueuedCandidates(senderSocketId);
        } catch (err) {
          console.error('Error handling SDP answer:', err);
        }
      }
    });

    // WebRTC signaling: Receive ICE Candidate
    socketRef.current.on('receive-ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = pcs.current[senderSocketId];
      if (pc && candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        } else {
          // Queue candidate
          if (!candidateQueues.current[senderSocketId]) {
            candidateQueues.current[senderSocketId] = [];
          }
          candidateQueues.current[senderSocketId].push(candidate);
        }
      }
    });

    // Room info updates (participants listing, media indicators)
    socketRef.current.on('room-info', ({ participants: roomPeers }) => {
      // Filter out our own socket ID to only display other peers
      const filteredPeers = roomPeers.filter(p => p.socketId !== socketRef.current.id);
      setParticipants(filteredPeers);
    });

    // Peer toggled video/audio mute/raise hand/screenshare status
    socketRef.current.on('peer-media-toggled', ({ socketId, type, status }) => {
      setParticipants(prev => prev.map(p => {
        if (p.socketId === socketId) {
          return { ...p, [type]: status };
        }
        return p;
      }));
    });

    // Peer speaking volume indicator
    socketRef.current.on('peer-speaking', ({ socketId, isSpeaking }) => {
      setParticipants(prev => prev.map(p => {
        if (p.socketId === socketId) {
          return { ...p, speaking: isSpeaking };
        }
        return p;
      }));
    });

    // Peer network strength report
    socketRef.current.on('peer-network-updated', ({ socketId, quality }) => {
      setParticipants(prev => prev.map(p => {
        if (p.socketId === socketId) {
          return { ...p, networkQuality: quality };
        }
        return p;
      }));
    });

    // Floating reaction triggers
    socketRef.current.on('receive-reaction', ({ socketId, senderName, emoji }) => {
      const reactionId = Math.random().toString(36).substring(2, 9);
      setActiveReactions(prev => [...prev, { id: reactionId, emoji, senderName }]);
      
      // Auto dismiss reaction after 3 seconds
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== reactionId));
      }, 3000);
    });

    // Chat Message persistence logs
    socketRef.current.on('receive-chat-message', (message) => {
      setMessages(prev => [...prev, message]);
      
      // Increment unread chat message badge if sidebar is not active
      if (sidebarTab !== 'chat') {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Typing indicators updates
    socketRef.current.on('peer-typing', ({ socketId, name, isTyping }) => {
      setTypingPeers(prev => {
        const next = { ...prev };
        if (isTyping) {
          next[socketId] = { name, timestamp: Date.now() };
        } else {
          delete next[socketId];
        }
        return next;
      });
    });

    // Peer left room
    socketRef.current.on('peer-left', ({ socketId, username, name }) => {
      console.log(`Peer left call: ${name} (${username})`);
      
      // Close peer connection
      if (pcs.current[socketId]) {
        pcs.current[socketId].close();
        delete pcs.current[socketId];
      }
      
      // Remove remote streams
      if (remoteStreams.current[socketId]) {
        delete remoteStreams.current[socketId];
      }

      setPeerStreams(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });

      if (candidateQueues.current[socketId]) {
        delete candidateQueues.current[socketId];
      }
      
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      
      // Remove typing indicators if any
      setTypingPeers(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });
  };

  const joinCallDirectly = () => {
    setMeetingJoined(true);
    
    // Register meeting in database and join
    socketRef.current.emit('join-room', {
      roomId,
      username: user?.username,
      name: user?.name,
      avatar: user?.avatar
    });

    // Initialize audio analyzer for active speaker indicator
    startMicVolumeDetection();

    // Trigger host fetching waiting list on start
    if (user?.username === meetingCreator) {
      socketRef.current.emit('get-waiting-list', { roomId });
    }
  };

  // Helper to flush queued candidates
  const processQueuedCandidates = async (socketId) => {
    const pc = pcs.current[socketId];
    const queue = candidateQueues.current[socketId];
    if (pc && queue && queue.length > 0) {
      console.log(`Processing ${queue.length} queued ICE candidates for ${socketId}`);
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err);
        }
      }
      candidateQueues.current[socketId] = [];
    }
  };

  // 3. WebRTC Peer Connection Core Logic
  const createPeerConnection = (peerSocketId) => {
    // Create new RTCPeerConnection with STUN servers config
    const pc = new RTCPeerConnection(iceServersConfig);
    candidateQueues.current[peerSocketId] = [];

    // Track ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('send-ice-candidate', {
          targetSocketId: peerSocketId,
          candidate: event.candidate
        });
      }
    };

    // Track remote stream track arrivals
    pc.ontrack = (event) => {
      console.log(`Received tracks from peer: ${peerSocketId}`);
      const stream = event.streams[0];
      
      // Save remote stream object in ref
      remoteStreams.current[peerSocketId] = stream;

      // Update state to trigger re-render
      setPeerStreams(prev => ({
        ...prev,
        [peerSocketId]: stream
      }));
    };

    // Track connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerSocketId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Retry connection or cleanup
      }
    };

    return pc;
  };

  const initiateCallOffer = async (pc, peerSocketId) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current.emit('send-offer', {
        targetSocketId: peerSocketId,
        offer
      });
    } catch (err) {
      console.error('Failed to create call offer:', err);
    }
  };

  // 4. Local Media Track controls (Camera, Mic, Screen Share, Blur)
  const toggleVideo = () => {
    const nextVal = !videoEnabled;
    setVideoEnabled(nextVal);
    
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = nextVal;
      });
    }

    if (socketRef.current) {
      socketRef.current.emit('toggle-media', {
        roomId,
        type: 'video',
        status: nextVal
      });
    }
  };

  const toggleAudio = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextVal;
      });
    }

    if (socketRef.current) {
      socketRef.current.emit('toggle-media', {
        roomId,
        type: 'audio',
        status: nextVal
      });
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      stopScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];

        // Replace local camera video track with screenshare video track in all active PeerConnections
        for (const socketId in pcs.current) {
          const senders = pcs.current[socketId].getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        // Display screen stream locally
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Notify room about screen share status
        if (socketRef.current) {
          socketRef.current.emit('toggle-media', {
            roomId,
            type: 'screenShare',
            status: true
          });
        }

        // Listen for user stopping screen sharing from browser banner
        screenTrack.onended = () => {
          stopScreenShare();
        };

      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    setScreenSharing(false);

    // Restore camera video track in all active connections
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      for (const socketId in pcs.current) {
        const senders = pcs.current[socketId].getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraTrack);
        }
      }
    }

    // Display camera locally again
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    // Notify room about screen share status
    if (socketRef.current) {
      socketRef.current.emit('toggle-media', {
        roomId,
        type: 'screenShare',
        status: false
      });
    }
  };

  const toggleHandRaise = () => {
    const nextVal = !handRaised;
    setHandRaised(nextVal);
    
    if (socketRef.current) {
      socketRef.current.emit('toggle-media', {
        roomId,
        type: 'handRaised',
        status: nextVal
      });
    }
  };

  // 5. Active Speaker Audio Level Analyser
  const startMicVolumeDetection = () => {
    try {
      const stream = localStreamRef.current;
      if (!stream || stream.getAudioTracks().length === 0) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let speakingState = false;

      micVolumeInterval.current = setInterval(() => {
        if (!audioEnabled) {
          if (speakingState) {
            speakingState = false;
            socketRef.current.emit('active-speaker', { roomId, isSpeaking: false });
            setLocalSpeaking(false);
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        
        // Compute volume RMS amplitude
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // If average volume exceeds speaking threshold
        const isSpeaking = average > 25;

        if (isSpeaking !== speakingState) {
          speakingState = isSpeaking;
          socketRef.current.emit('active-speaker', { roomId, isSpeaking });
          setLocalSpeaking(isSpeaking);
        }
      }, 400);

    } catch (err) {
      console.warn('Audio Speaker Analyser not started:', err.message);
    }
  };

  // 6. Typing and Chat Actions
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit('send-chat-message', {
        roomId,
        text: chatInput.trim()
      });
      setChatInput('');
      handleTyping(false);
    }
  };

  const handleTyping = (typingStatus) => {
    if (!socketRef.current) return;

    if (typingStatus) {
      if (!isTyping) {
        setIsTyping(true);
        socketRef.current.emit('typing', { roomId, isTyping: true });
      }

      // Reset typing timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit('typing', { roomId, isTyping: false });
      }, 2000);
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('typing', { roomId, isTyping: false });
    }
  };

  const handleReaction = (emoji) => {
    if (socketRef.current) {
      socketRef.current.emit('send-reaction', { roomId, emoji });
    }
  };

  const handleWaitingRoomAction = (targetSocketId, action) => {
    if (socketRef.current) {
      socketRef.current.emit('waiting-room-action', {
        roomId,
        targetSocketId,
        action
      });
    }
  };

  // 7. Fullscreen & Settings Dialog
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleDeviceSettingSave = () => {
    setShowSettingsDialog(false);
    startLocalPreview(selectedVideoDevice, selectedAudioDevice);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/meet/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
  };

  // 8. Leave Room and Cleanup
  const cleanupResources = () => {
    // 1. Tell socket server we are leaving
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 2. Stop local audio/video tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // 3. Clear audio interval & context
    if (micVolumeInterval.current) clearInterval(micVolumeInterval.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // 4. Close all peer connections
    for (const socketId in pcs.current) {
      pcs.current[socketId].close();
    }
    pcs.current = {};
    remoteStreams.current = {};
    setPeerStreams({});
    setLocalStream(null);
    candidateQueues.current = {};
  };

  const leaveMeeting = () => {
    cleanupResources();
    navigate('/dashboard');
  };

  // Helper formats elapsed seconds to hh:mm:ss
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
  };



  // Auto layout depending on participant count
  const getLayoutGridSize = (count) => {
    if (count <= 1) return { xs: 12 };
    if (count === 2) return { xs: 12, sm: 6 };
    if (count <= 4) return { xs: 12, sm: 6 };
    return { xs: 12, sm: 6, md: 4 };
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const participantCount = participants.length + 1; // plus local user
  const gridSizes = getLayoutGridSize(participantCount);

  // --- WAITING ROOM LANDING CARD ---
  if (waitingRoomStatus === 'waiting') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: '400px', width: '100%', textAlign: 'center', p: 3 }}>
          <CardContent>
            <CircularProgress color="primary" sx={{ mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
              Waiting Room
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              You are in the queue. Please wait for the meeting host to admit you to the video call.
            </Typography>
            <Button variant="outlined" color="error" fullWidth onClick={leaveMeeting}>
              Leave Meeting
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (waitingRoomStatus === 'denied') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ maxWidth: '400px', width: '100%', textAlign: 'center', p: 3 }}>
          <CardContent>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <FiberManualRecord sx={{ color: 'var(--danger)' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'var(--danger)' }}>
              Entry Denied
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              The meeting host has declined your request to join this session.
            </Typography>
            <Button variant="contained" fullWidth onClick={leaveMeeting}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // --- DEVICE SETUP CARD PREVIEW ---
  if (showDeviceSetup) {
    return (
      <Container maxWidth="md" sx={{ py: 8, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={4} alignItems="center" className="animate-fade-in">
          {/* Left Preview Stream */}
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#09090b', border: '1px solid var(--card-border)' }}>
              <video
                ref={(el) => {
                  if (el && localStream) {
                    el.srcObject = localStream;
                  }
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror local stream
                  filter: backgroundBlur ? 'blur(15px)' : 'none'
                }}
              />
              
              {/* Media status banners */}
              {!videoEnabled && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b' }}>
                  <Avatar {...getAvatarProps(user?.name || user?.username, { width: 80, height: 80, border: '2px solid var(--primary)', fontSize: '2rem' })} />
                </Box>
              )}

              {/* Float settings */}
              <Stack direction="row" spacing={1.5} sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                <IconButton onClick={toggleAudio} sx={{ backgroundColor: audioEnabled ? 'rgba(255,255,255,0.1)' : 'var(--danger)', color: '#fff', '&:hover': { backgroundColor: audioEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.8)' } }}>
                  {audioEnabled ? <Mic /> : <MicOff />}
                </IconButton>
                <IconButton onClick={toggleVideo} sx={{ backgroundColor: videoEnabled ? 'rgba(255,255,255,0.1)' : 'var(--danger)', color: '#fff', '&:hover': { backgroundColor: videoEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.8)' } }}>
                  {videoEnabled ? <Videocam /> : <VideocamOff />}
                </IconButton>
                <IconButton onClick={() => setBackgroundBlur(!backgroundBlur)} sx={{ backgroundColor: backgroundBlur ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  <PhotoFilter />
                </IconButton>
              </Stack>
            </Box>
          </Grid>

          {/* Right settings form */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                  Ready to join?
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 4 }}>
                  Room title: <strong>{meetingTitle}</strong>
                </Typography>

                <Stack spacing={3} sx={{ mb: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Camera Device</InputLabel>
                    <Select
                      value={selectedVideoDevice}
                      label="Camera Device"
                      onChange={(e) => {
                        setSelectedVideoDevice(e.target.value);
                        startLocalPreview(e.target.value, selectedAudioDevice);
                      }}
                    >
                      {videoDevices.map(d => (
                        <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0, 5)}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Microphone Device</InputLabel>
                    <Select
                      value={selectedAudioDevice}
                      label="Microphone Device"
                      onChange={(e) => {
                        setSelectedAudioDevice(e.target.value);
                        startLocalPreview(selectedVideoDevice, e.target.value);
                      }}
                    >
                      {audioDevices.map(d => (
                        <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.substring(0, 5)}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" color="inherit" fullWidth onClick={() => navigate('/dashboard')} sx={{ py: 1.5 }}>
                    Cancel
                  </Button>
                  <Button variant="contained" fullWidth onClick={initSocketAndJoin} sx={{ py: 1.5 }}>
                    Join Meeting
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // --- MAIN MEETING INTERFACE RENDER ---
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#09090b', overflow: 'hidden', position: 'relative' }}>
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <Box sx={{ height: '64px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, backgroundColor: 'rgba(9, 9, 11, 0.8)', zIndex: 10 }}>
        <Stack direction="row" alignItems="center" spacing={2.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--danger)', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
              {meetingTitle}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'var(--card-border)', height: 20, my: 'auto' }} />
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {formatTimer(secondsElapsed)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopy fontSize="small" />}
            onClick={handleCopyLink}
            sx={{
              borderColor: 'var(--card-border)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              '&:hover': { borderColor: 'var(--text-secondary)' }
            }}
          >
            Copy Invite Link
          </Button>

          {/* Host Notification for approval requests */}
          {user?.username === meetingCreator && waitingParticipants.length > 0 && (
            <Badge badgeContent={waitingParticipants.length} color="error">
              <Button
                size="small"
                variant="contained"
                onClick={() => setSidebarTab('participants')}
                sx={{
                  backgroundColor: 'var(--accent-pink)',
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: 'rgba(236, 72, 153, 0.8)' }
                }}
              >
                Waiting List
              </Button>
            </Badge>
          )}
        </Stack>
      </Box>

      {/* 2. CENTRAL LAYOUT WRAPPER (Video grid + Sidebar) */}
      <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* Reaction overlay container */}
        {activeReactions.length > 0 && (
          <Box sx={{ position: 'absolute', bottom: 100, left: 30, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 1.5, pointerEvents: 'none' }}>
            {activeReactions.map(r => (
              <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '20px', px: 2, py: 0.8, border: '1px solid rgba(255,255,255,0.1)', animation: 'float-up 3s ease-in-out forwards' }}>
                <Typography variant="body1" sx={{ fontSize: '1.4rem' }}>{r.emoji}</Typography>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>@{r.senderName}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Video stream grids */}
        <Box sx={{ flexGrow: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
          <Grid container spacing={2} sx={{ width: '100%', height: '100%', alignContent: 'center', justifyContent: 'center' }}>
            
            {/* A. Local video feed */}
            <Grid item {...gridSizes} sx={{ display: 'flex', justifyContent: 'center', height: participantCount <= 2 ? '80%' : 'auto', maxHeight: '450px' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#0f0f12',
                  border: `2px solid ${user?.speaking ? 'var(--success)' : 'var(--card-border)'}`,
                  boxShadow: user?.speaking ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'var(--transition-fast)'
                }}
              >
                <video
                  ref={(el) => {
                    if (el && localStream) {
                      el.srcObject = localStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)', // Mirror local video
                    filter: backgroundBlur ? 'blur(15px)' : 'none'
                  }}
                />

                {/* Local user camera turned off block */}
                 {!videoEnabled && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f12' }}>
                    <Avatar {...getAvatarProps(user?.name || user?.username, { width: 70, height: 70, border: '2px solid var(--primary)', fontSize: '1.8rem' })} />
                  </Box>
                )}

                {/* Overlaid labels */}
                <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(0,0,0,0.6)', px: 1.2, py: 0.6, borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                    {user?.name || user?.username} (You)
                  </Typography>
                  {handRaised && <PanTool sx={{ color: 'var(--warning)', fontSize: 14 }} />}
                  {!audioEnabled ? <MicOff sx={{ color: 'var(--danger)', fontSize: 14 }} /> : <Mic sx={{ color: 'var(--success)', fontSize: 14 }} />}
                </Box>
                
                {/* Speaking indicator overlay */}
                {localSpeaking && (
                  <Box sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'var(--success)', color: '#fff', px: 1, py: 0.3, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                    SPEAKING
                  </Box>
                )}
              </Box>
            </Grid>

            {/* B. Remote video feeds */}
            {participants.map((peer) => {
              return (
                <Grid item {...gridSizes} key={peer.socketId} sx={{ display: 'flex', justifyContent: 'center', height: participantCount <= 2 ? '80%' : 'auto', maxHeight: '450px' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#0f0f12',
                      border: `2px solid ${peer.speaking ? 'var(--success)' : 'var(--card-border)'}`,
                      boxShadow: peer.speaking ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <RemoteVideo stream={peerStreams[peer.socketId]} />

                    {/* Remote user camera turned off block */}
                     {!peer.video && (
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f12' }}>
                        <Avatar {...getAvatarProps(peer.name, { width: 70, height: 70, border: '2px solid var(--secondary)', fontSize: '1.8rem' })} />
                      </Box>
                    )}

                    {/* Overlaid labels */}
                    <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(0,0,0,0.6)', px: 1.2, py: 0.6, borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                      <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                        {peer.name}
                      </Typography>
                      {peer.handRaised && <PanTool sx={{ color: 'var(--warning)', fontSize: 14 }} />}
                      {!peer.audio ? <MicOff sx={{ color: 'var(--danger)', fontSize: 14 }} /> : <Mic sx={{ color: 'var(--success)', fontSize: 14 }} />}
                    </Box>

                    {/* Speaking indicator overlay */}
                    {peer.speaking && (
                      <Box sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'var(--success)', color: '#fff', px: 1, py: 0.3, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                        SPEAKING
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* 3. SIDEBAR PANEL (CHAT / PARTICIPANTS / WAITING ROOM) */}
        {sidebarTab && (
          <Paper
            square
            sx={{
              width: '340px',
              borderLeft: '1px solid var(--card-border)',
              backgroundColor: 'rgba(9, 9, 11, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 5
            }}
          >
            {/* Sidebar header */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {sidebarTab === 'chat' ? 'Meeting Chat' : 'Participants'}
              </Typography>
              <IconButton size="small" onClick={() => setSidebarTab('')} sx={{ color: 'var(--text-secondary)' }}>
                <FullscreenExit />
              </IconButton>
            </Box>

            {/* Sidebar content */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2.5 }}>
              {sidebarTab === 'chat' ? (
                /* CHAT TAB SECTION */
                <Stack spacing={2}>
                  {messages.map((msg, index) => {
                    const isSelf = msg.sender === user.username;
                    return (
                      <Box key={msg._id || index} sx={{ alignSelf: isSelf ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 0.4, textAlign: isSelf ? 'right' : 'left' }}>
                          {isSelf ? 'You' : `@${msg.sender}`}
                        </Typography>
                        <Box sx={{ p: 1.5, borderRadius: '12px', border: '1px solid var(--card-border)', backgroundColor: isSelf ? 'var(--primary)' : 'rgba(255,255,255,0.03)' }}>
                          <Typography variant="body2" sx={{ color: '#fff', wordBreak: 'break-word' }}>
                            {msg.text}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block', mt: 0.4, textAlign: isSelf ? 'right' : 'left' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    );
                  })}
                  
                  {/* Typing indicators */}
                  {Object.values(typingPeers).map((tp, idx) => (
                    <Typography key={idx} variant="caption" sx={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      {tp.name} is typing...
                    </Typography>
                  ))}
                  
                  <div ref={chatBottomRef} />
                </Stack>
              ) : (
                /* PARTICIPANTS & WAITING ROOM TAB */
                <Stack spacing={3}>
                  {/* Waiting room queue approvals (Creator only) */}
                  {user.username === meetingCreator && waitingParticipants.length > 0 && (
                    <Box sx={{ p: 1.5, borderRadius: '12px', border: '1px solid var(--accent-pink)', backgroundColor: 'rgba(236,72,153,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--accent-pink)', mb: 2 }}>
                        Admission Requests
                      </Typography>
                      <Stack spacing={1.5}>
                        {waitingParticipants.map(wp => (
                          <Stack direction="row" justifyContent="space-between" alignItems="center" key={wp.socketId}>
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Avatar {...getAvatarProps(wp.name, { width: 28, height: 28, fontSize: '0.8rem' })} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{wp.name}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.8}>
                              <Button size="small" variant="contained" color="success" onClick={() => handleWaitingRoomAction(wp.socketId, 'approve')} sx={{ py: 0.4, px: 1.2, minWidth: 'auto', borderRadius: '6px', fontSize: '0.7rem' }}>Admit</Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleWaitingRoomAction(wp.socketId, 'deny')} sx={{ py: 0.4, px: 1.2, minWidth: 'auto', borderRadius: '6px', fontSize: '0.7rem' }}>Deny</Button>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Active List */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Active Callers ({participantCount})
                  </Typography>

                  <Stack spacing={2}>
                    {/* Local participant */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar {...getAvatarProps(user?.name || user?.username, { width: 32, height: 32, border: '1px solid var(--primary)', fontSize: '0.9rem' })} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name} (You)</Typography>
                          <Typography variant="caption" sx={{ color: 'var(--success)' }}>Excellent Connection</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        {!audioEnabled ? <MicOff sx={{ color: 'var(--danger)', fontSize: 16 }} /> : <Mic sx={{ color: 'var(--success)', fontSize: 16 }} />}
                        {!videoEnabled ? <VideocamOff sx={{ color: 'var(--danger)', fontSize: 16 }} /> : <Videocam sx={{ color: 'var(--success)', fontSize: 16 }} />}
                      </Stack>
                    </Stack>

                    {/* Remote participants list */}
                    {participants.map(peer => (
                      <Stack direction="row" justifyContent="space-between" alignItems="center" key={peer.socketId}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar {...getAvatarProps(peer.name, { width: 32, height: 32, border: '1px solid var(--secondary)', fontSize: '0.9rem' })} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{peer.name}</Typography>
                            <Typography variant="caption" sx={{ color: peer.networkQuality === 'excellent' ? 'var(--success)' : 'var(--warning)', textTransform: 'capitalize' }}>
                              {peer.networkQuality} Connection
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {peer.handRaised && <PanTool sx={{ color: 'var(--warning)', fontSize: 14 }} />}
                          {!peer.audio ? <MicOff sx={{ color: 'var(--danger)', fontSize: 16 }} /> : <Mic sx={{ color: 'var(--success)', fontSize: 16 }} />}
                          {!peer.video ? <VideocamOff sx={{ color: 'var(--danger)', fontSize: 16 }} /> : <Videocam sx={{ color: 'var(--success)', fontSize: 16 }} />}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Box>

            {/* Chat Send footer bar */}
            {sidebarTab === 'chat' && (
              <Box sx={{ p: 2, borderTop: '1px solid var(--card-border)' }}>
                <form onSubmit={handleSendChatMessage}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Send message..."
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      handleTyping(true);
                    }}
                    onBlur={() => handleTyping(false)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="submit" size="small" sx={{ color: 'var(--primary)' }}>
                            <Send fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </form>
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* 4. FOOTER MEDIA CONTROLS BAR */}
      <Box sx={{ height: '80px', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, backgroundColor: 'rgba(9, 9, 11, 0.9)', zIndex: 10 }}>
        
        {/* Left indicators */}
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Tooltip title="Network Strength">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                Secure Link
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>

        {/* Center Media Toggles */}
        <Stack direction="row" spacing={2}>
          <IconButton onClick={toggleAudio} sx={{ backgroundColor: audioEnabled ? 'rgba(255,255,255,0.05)' : 'var(--danger)', border: '1px solid var(--card-border)', color: '#fff', '&:hover': { backgroundColor: audioEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.8)' } }}>
            {audioEnabled ? <Mic /> : <MicOff />}
          </IconButton>
          
          <IconButton onClick={toggleVideo} sx={{ backgroundColor: videoEnabled ? 'rgba(255,255,255,0.05)' : 'var(--danger)', border: '1px solid var(--card-border)', color: '#fff', '&:hover': { backgroundColor: videoEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.8)' } }}>
            {videoEnabled ? <Videocam /> : <VideocamOff />}
          </IconButton>

          <IconButton onClick={toggleScreenShare} sx={{ backgroundColor: screenSharing ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff' }}>
            {screenSharing ? <StopScreenShare /> : <ScreenShare />}
          </IconButton>

          <IconButton onClick={toggleHandRaise} sx={{ backgroundColor: handRaised ? 'var(--warning)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff' }}>
            <PanTool />
          </IconButton>

          {/* Emoji Reactions Panel Button */}
          <Tooltip title="Send Reaction">
            <IconButton onClick={() => handleReaction('👍')} sx={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: '#fff' }}>
              <EmojiEmotions />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="error"
            startIcon={<CallEnd />}
            onClick={leaveMeeting}
            sx={{
              borderRadius: '12px',
              px: 3,
              backgroundColor: 'var(--danger)',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              '&:hover': { backgroundColor: '#dc2626', boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)' }
            }}
          >
            End Call
          </Button>
        </Stack>

        {/* Right sidebars toggles */}
        <Stack direction="row" spacing={1.5}>
          {/* Reaction shortcut quick bar on hover */}
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, backgroundColor: 'rgba(255,255,255,0.03)', px: 1, py: 0.5, borderRadius: '20px', border: '1px solid var(--card-border)' }}>
            {['❤️', '👏', '🎉', '🔥', '😮'].map(em => (
              <IconButton key={em} size="small" onClick={() => handleReaction(em)} sx={{ fontSize: '1rem', p: 0.6 }}>{em}</IconButton>
            ))}
          </Stack>

          <Tooltip title="Participants list">
            <IconButton onClick={() => setSidebarTab(prev => prev === 'participants' ? '' : 'participants')} sx={{ color: sidebarTab === 'participants' ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <People />
            </IconButton>
          </Tooltip>

          <Tooltip title="In-meeting Chat">
            <IconButton onClick={() => {
              setSidebarTab(prev => prev === 'chat' ? '' : 'chat');
              setUnreadCount(0);
            }} sx={{ color: sidebarTab === 'chat' ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <Badge badgeContent={unreadCount} color="primary">
                <Chat />
              </Badge>
            </IconButton>
          </Tooltip>

          <IconButton onClick={() => setShowSettingsDialog(true)} sx={{ color: 'var(--text-secondary)' }}>
            <Settings />
          </IconButton>

          <IconButton onClick={toggleFullscreen} sx={{ color: 'var(--text-secondary)' }}>
            <Fullscreen />
          </IconButton>
        </Stack>
      </Box>

      {/* 5. SETTINGS CHANGE DIALOG */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Device Settings</DialogTitle>
        <DialogContent sx={{ minWidth: '320px', pt: 2 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Camera Input</InputLabel>
              <Select
                value={selectedVideoDevice}
                label="Camera Input"
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
              >
                {videoDevices.map(d => (
                  <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0, 5)}`}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Microphone Input</InputLabel>
              <Select
                value={selectedAudioDevice}
                label="Microphone Input"
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
              >
                {audioDevices.map(d => (
                  <MenuItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.substring(0, 5)}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowSettingsDialog(false)} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
          <Button onClick={handleDeviceSettingSave} variant="contained">Apply Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoMeet;
