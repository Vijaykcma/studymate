import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, User } from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// Web Audio API Ringtone & Dial-Tone Synthesizer
function createToneGenerator() {
  let ctx = null;
  let interval = null;

  const stop = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    try {
      if (ctx && ctx.state !== 'closed') {
        ctx.close();
      }
    } catch {
      // ignore
    }
    ctx = null;
  };

  const playRingback = () => {
    stop();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();

      const pulse = () => {
        if (!ctx || ctx.state === 'closed') return;
        const now = ctx.currentTime;
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const gain = ctx.createGain();

        o1.frequency.setValueAtTime(440, now);
        o2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        gain.gain.setValueAtTime(0.06, now + 1.8);
        gain.gain.linearRampToValueAtTime(0, now + 2.0);

        o1.connect(gain);
        o2.connect(gain);
        gain.connect(ctx.destination);

        o1.start(now);
        o2.start(now);
        o1.stop(now + 2.0);
        o2.stop(now + 2.0);
      };

      pulse();
      interval = setInterval(pulse, 4000);
    } catch {
      // ignore audio context restrictions
    }
  };

  const playIncomingRing = () => {
    stop();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();

      const chime = () => {
        if (!ctx || ctx.state === 'closed') return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const now = ctx.currentTime + idx * 0.15;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
        });
      };

      chime();
      interval = setInterval(chime, 2500);
    } catch {
      // ignore
    }
  };

  return { playRingback, playIncomingRing, stop };
}

export function WebRTCCallModal({
  callState, // { status: 'incoming' | 'outgoing' | 'connected', callType: 'audio' | 'video', peer: object, offer?: object }
  onAccept,
  onReject,
  onEndCall,
  onConnected,
  socket,
  currentUser,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callState.callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueueRef = useRef([]);
  const timerRef = useRef(null);
  const toneGenRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Initialize Audio Tone Generator on Mount
  useEffect(() => {
    toneGenRef.current = createToneGenerator();
    if (callState.status === 'outgoing') {
      toneGenRef.current.playRingback();
    } else if (callState.status === 'incoming') {
      toneGenRef.current.playIncomingRing();
    }

    return () => {
      toneGenRef.current?.stop();
    };
  }, []);

  // When call status transitions to connected, stop audio tones
  useEffect(() => {
    if (callState.status === 'connected') {
      toneGenRef.current?.stop();
      startCallTimer();
    }
  }, [callState.status]);

  // Timer for connected call
  const startCallTimer = () => {
    if (timerRef.current) return;
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Helper to get local user media
  const getLocalMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callState.callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current && callState.callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('[WebRTC] Error acquiring media devices:', err);
      throw err;
    }
  };

  // Helper to create RTCPeerConnection and attach tracks & event handlers
  const createPeerConnection = (stream) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Attach local stream tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Attach remote stream to audio/video elements
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        remoteStreamRef.current = remoteStream;

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    // Forward local ICE candidates to remote peer via Socket.IO
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && callState.peer?._id) {
        socket.emit('webrtc_ice_candidate', {
          toUserId: callState.peer._id,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        toneGenRef.current?.stop();
        if (onConnected) onConnected();
      }
    };

    return pc;
  };

  // Flush any queued ICE candidates once remoteDescription is set
  const flushCandidateQueue = async (pc) => {
    while (candidateQueueRef.current.length > 0) {
      const candidate = candidateQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Candidate error while flushing:', err);
      }
    }
  };

  // Socket signaling listener for incoming call answers & candidates
  useEffect(() => {
    if (!socket) return;

    // Caller receives callee's Answer
    const handleCallAnswered = async ({ answer }) => {
      toneGenRef.current?.stop();
      try {
        if (pcRef.current && answer) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          await flushCandidateQueue(pcRef.current);
          if (onConnected) onConnected();
          startCallTimer();
        }
      } catch (err) {
        console.error('[WebRTC] Error setting remote answer:', err);
      }
    };

    // Either peer receives an ICE candidate
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Error adding received ICE candidate:', err);
        }
      } else {
        // Buffer until setRemoteDescription is called
        candidateQueueRef.current.push(candidate);
      }
    };

    socket.on('webrtc_call_answered', handleCallAnswered);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc_call_answered', handleCallAnswered);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
    };
  }, [socket, onConnected]);

  // Initiate Outgoing Call (Caller side)
  useEffect(() => {
    if (callState.status === 'outgoing' && !hasStartedRef.current) {
      hasStartedRef.current = true;

      const initOutgoing = async () => {
        try {
          const stream = await getLocalMedia();
          const pc = createPeerConnection(stream);

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callState.callType === 'video',
          });
          await pc.setLocalDescription(offer);

          socket.emit('webrtc_call_user', {
            toUserId: callState.peer._id,
            offer,
            callType: callState.callType,
          });
        } catch (err) {
          console.error('[WebRTC] Outgoing call initiation failed:', err);
          onEndCall(0, 'error');
        }
      };

      initOutgoing();
    }
  }, [callState.status]);

  // Callee Answers Call
  const handleInternalAccept = async () => {
    toneGenRef.current?.stop();
    try {
      const stream = await getLocalMedia();
      const pc = createPeerConnection(stream);

      if (callState.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
        await flushCandidateQueue(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc_answer_call', {
          toUserId: callState.peer._id,
          answer,
        });

        if (onConnected) onConnected();
        if (onAccept) onAccept();
        startCallTimer();
      }
    } catch (err) {
      console.error('[WebRTC] Callee answer failed:', err);
      onEndCall(0, 'error');
    }
  };

  // Re-attach streams to video/audio tags if DOM updates
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && callState.callType === 'video') {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [callState.status, isVideoDisabled]);

  // Teardown upon modal unmount
  useEffect(() => {
    return () => {
      toneGenRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((t) => t.stop());
        remoteStreamRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  // Toggle Mute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      {/* Permanent background audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-white">
        
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 z-10 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                callState.status === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {callState.status === 'connected'
                ? `In Call • ${formatDuration(callDuration)}`
                : callState.status === 'incoming'
                ? 'Incoming Call...'
                : 'Ringing...'}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[11px] font-bold uppercase tracking-wider">
            {callState.callType === 'video' ? 'Video Call' : 'Audio Call'}
          </span>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 min-h-[300px] sm:min-h-[360px] relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 to-slate-950">
          {callState.callType === 'video' && callState.status === 'connected' ? (
            <div className="w-full h-full min-h-[320px] relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Local PiP Video */}
              <div className="absolute bottom-3 right-3 w-28 h-40 rounded-xl overflow-hidden border-2 border-indigo-500 bg-slate-800 shadow-xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : 'block'}`}
                />
                {isVideoDisabled && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
                    <VideoOff size={20} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Audio Avatar Pulse Screen */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div
                  className={`w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-4xl shadow-2xl ${
                    callState.status === 'incoming' || callState.status === 'outgoing'
                      ? 'animate-bounce'
                      : ''
                  }`}
                >
                  {callState.peer?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {callState.status === 'connected' && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-900" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-xl">{callState.peer?.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {callState.peer?.department ? `${callState.peer.department} Student` : 'StudyMate Classmate'}
                </p>
                <p className="text-[11px] font-semibold text-indigo-400 mt-1">
                  {callState.status === 'connected'
                    ? formatDuration(callDuration)
                    : callState.status === 'incoming'
                    ? 'Incoming StudyMate Call'
                    : 'Connecting...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="p-5 border-t border-white/10 bg-slate-900/90 flex items-center justify-center gap-4">
          {callState.status === 'incoming' ? (
            /* Incoming Call Controls: Decline or Accept */
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={onReject}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-lg shadow-rose-600/30 cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff size={24} />
              </button>
              <button
                type="button"
                onClick={handleInternalAccept}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse"
                title="Answer Call"
              >
                {callState.callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
              </button>
            </div>
          ) : (
            /* Active / Outgoing Call Controls */
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                  isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white hover:bg-white/15'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {callState.callType === 'video' && (
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                    isVideoDisabled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                  title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoDisabled ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => onEndCall(callDuration)}
                className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-lg shadow-rose-600/30 cursor-pointer"
                title="End Call"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default WebRTCCallModal;
