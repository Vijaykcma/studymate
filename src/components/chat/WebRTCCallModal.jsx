import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, User } from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function WebRTCCallModal({
  callState, // { status: 'incoming' | 'outgoing' | 'connected', callType: 'audio' | 'video', peer: object, offer?: object }
  onAccept,
  onReject,
  onEndCall,
  socket,
  currentUser,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callState.callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize WebRTC PeerConnection
  useEffect(() => {
    let isCancelled = false;

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callState.callType === 'video',
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && callState.callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // When remote stream tracks arrive
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // ICE candidate exchange
        pc.onicecandidate = (event) => {
          if (event.candidate && socket && callState.peer?._id) {
            socket.emit('webrtc_ice_candidate', {
              toUserId: callState.peer._id,
              candidate: event.candidate,
            });
          }
        };

        // If caller (outgoing), create and send Offer
        if (callState.status === 'outgoing') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_call_user', {
            toUserId: callState.peer._id,
            offer,
            callType: callState.callType,
          });
        }

        // If callee accepted incoming call, set remote offer and send Answer
        if (callState.status === 'connected' && callState.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_answer_call', {
            toUserId: callState.peer._id,
            answer,
          });
        }
      } catch (err) {
        console.error('[WebRTC] Media access error:', err);
        onEndCall(0, 'error');
      }
    };

    if (callState.status === 'outgoing' || callState.status === 'connected') {
      setupMedia();
    }

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      clearInterval(timerRef.current);
    };
  }, [callState.status]);

  // Socket signaling listeners for active call
  useEffect(() => {
    if (!socket) return;

    const handleCallAnswered = async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        startCallTimer();
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          // ignore candidate error
        }
      }
    };

    socket.on('webrtc_call_answered', handleCallAnswered);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc_call_answered', handleCallAnswered);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
    };
  }, [socket]);

  // Timer for connected call
  const startCallTimer = () => {
    clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    if (callState.status === 'connected') {
      startCallTimer();
    }
  }, [callState.status]);

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
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-white">
        
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${callState.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
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
            <div className="w-full h-full relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
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
                <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-4xl shadow-2xl ${
                  callState.status === 'incoming' || callState.status === 'outgoing' ? 'animate-bounce' : ''
                }`}>
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
              </div>
              {/* Hidden audio element for remote stream */}
              <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
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
                onClick={onAccept}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse"
                title="Answer Call"
              >
                {callState.callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
              </button>
            </div>
          ) : (
            /* Active Call Controls */
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
