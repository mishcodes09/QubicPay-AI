import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Code, Mic, MicOff, DollarSign, Check, X, Calendar, Clock, Repeat, History, Star, Trash2, Plus, RefreshCw, Zap, TrendingUp, Activity, ArrowUpRight, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

interface ArcBotFaceProps {
  speaking: boolean;
  mood?: 'neutral' | 'happy' | 'thinking';
  processing?: boolean;
  listening?: boolean;
}

interface ProcessStepProps {
  step: StepData;
  index: number;
  isActive: boolean;
  isComplete: boolean;
}

interface StepData {
  title: string;
  description: string;
  duration?: string;
  details?: any;
}

interface PaymentData {
  recipient: string;
  amount: number;
  currency: string;
  description?: string;
}

interface ScheduleData {
  recipient: string;
  amount: number;
  currency: string;
  scheduledDate: string;
  recurring?: {
    enabled: boolean;
    frequency?: string;
  };
  description?: string;
}

interface Message {
  type: 'user' | 'bot' | 'payment-request' | 'schedule-request';
  content: string;
  timestamp: string;
  id: number;
  steps?: StepData[];
  streaming?: boolean;
  paymentData?: PaymentData;
  scheduleData?: ScheduleData;
}

interface Profile {
  wallet?: {
    balance: number;
    address: string;
  };
}

interface ScheduledPayment {
  paymentId: string;
  payee: string;
  amount: number;
  currency: string;
  scheduledDate: string;
  status: string;
  recurring?: {
    enabled: boolean;
    frequency?: string;
  };
  description?: string;
}

interface SavedTransfer {
  transferId: string;
  payee: string;
  nickname?: string;
  amount?: number;
  currency: string;
  category: string;
  favorite: boolean;
  useCount: number;
}

interface PaymentHistory {
  historyId: string;
  payee: string;
  amount: number;
  currency: string;
  status: string;
  txHash?: string;
  explorerUrl?: string;
  timestamp: any;
}

interface LipSyncAPI {
  start: (audioElement: HTMLAudioElement) => void;
  stop: () => void;
}

declare global {
  interface Window {
    arcBotLipSync?: LipSyncAPI;
    webkitAudioContext?: typeof AudioContext;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

function ArcBotFace({ speaking, mood = 'neutral', processing = false, listening = false }: ArcBotFaceProps) {
  const [blink, setBlink] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [speakPhase, setSpeakPhase] = useState(0);
  const [mouthWave, setMouthWave] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);
  
  useEffect(() => {
    if (processing) {
      const pulseInterval = setInterval(() => {
        setPulse(p => (p + 1) % 3);
      }, 400);
      return () => clearInterval(pulseInterval);
    }
  }, [processing]);
  
  useEffect(() => {
    if (speaking) {
      const speakInterval = setInterval(() => {
        setSpeakPhase(p => (p + 1) % 4);
        setMouthWave(Math.random());
      }, 150);
      return () => clearInterval(speakInterval);
    } else {
      setAudioLevel(0);
    }
  }, [speaking]);
  
  const startAudioAnalysis = useCallback((audioElement: HTMLAudioElement) => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaElementSource(audioElement);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const analyze = () => {
        if (!analyserRef.current || !speaking) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const vocalRange = dataArray.slice(5, 15);
        const average = vocalRange.reduce((a, b) => a + b, 0) / vocalRange.length;
        const normalized = Math.min(average / 128, 1);
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(analyze);
      };
      analyze();
    } catch (error) {
      console.error('Audio analysis error:', error);
    }
  }, [speaking]);
  
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
  }, []);
  
  useEffect(() => {
    window.arcBotLipSync = {
      start: startAudioAnalysis,
      stop: stopAudioAnalysis
    };
    return () => {
      stopAudioAnalysis();
      delete window.arcBotLipSync;
    };
  }, [startAudioAnalysis, stopAudioAnalysis]);
  
  const getMouthHeight = () => {
    if (!speaking) return mood === 'happy' ? 8 : 4;
    if (audioLevel > 0) return 8 + (audioLevel * 20);
    const heights = [12, 18, 15, 10];
    return heights[speakPhase] + mouthWave * 3;
  };
  
  const mouthHeight = getMouthHeight();
  const eyeHeight = blink ? 2 : 14;
  const faceScale = processing ? 1 + Math.sin(pulse) * 0.02 : 1;
  
  const faceColors: Record<string, { primary: string; secondary: string }> = {
    neutral: { primary: '#06b6d4', secondary: '#0891b2' },
    happy: { primary: '#10b981', secondary: '#059669' },
    thinking: { primary: '#8b5cf6', secondary: '#7c3aed' }
  };
  
  const colors = faceColors[mood] || faceColors.neutral;
  
  return (
    <div className="relative w-full aspect-square flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
      {processing && <div className="absolute inset-0 border-2 border-cyan-400 rounded-3xl animate-ping opacity-20" />}
      {listening && <div className="absolute inset-0 border-2 border-green-400 rounded-3xl animate-pulse opacity-30" />}
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }`}</style>
      
      {listening && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/50">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-semibold">Listening</span>
        </div>
      )}
      
      <svg width="100%" height="100%" viewBox="0 0 260 260" className="relative z-10 transition-transform duration-200" style={{ transform: `scale(${faceScale})` }}>
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="130" cy="130" r="110" fill="url(#faceGrad)" opacity="0.95" filter={processing || speaking ? "url(#glow)" : ""} />
        <ellipse cx="100" cy="90" rx="40" ry="50" fill="rgba(255,255,255,0.08)" transform="rotate(-30 100 90)" />
        <ellipse cx="95" cy="110" rx="16" ry={eyeHeight} fill="#0f172a" className="transition-all duration-300" />
        <ellipse cx="165" cy="110" rx="16" ry={eyeHeight} fill="#0f172a" className="transition-all duration-300" />
        {!blink && (
          <>
            <circle cx="98" cy="108" r="5" fill="rgba(255,255,255,0.7)" />
            <circle cx="168" cy="108" r="5" fill="rgba(255,255,255,0.7)" />
            <circle cx="100" cy="106" r="2" fill="rgba(255,255,255,0.9)" />
            <circle cx="170" cy="106" r="2" fill="rgba(255,255,255,0.9)" />
          </>
        )}
        {mood === 'thinking' && (
          <>
            <path d="M 75 95 Q 95 90 115 95" stroke="#0f172a" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 145 95 Q 165 90 185 95" stroke="#0f172a" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
        {speaking ? (
          <ellipse cx="130" cy="165" rx="40" ry={mouthHeight} fill="#0f172a" className="transition-all duration-100" />
        ) : (
          <path d="M 95 160 Q 130 185 165 160" stroke="#0f172a" strokeWidth="5" fill="none" strokeLinecap="round" />
        )}
        <circle cx="70" cy="135" r="14" fill="#f43f5e" opacity="0.3" className="animate-pulse" />
        <circle cx="190" cy="135" r="14" fill="#f43f5e" opacity="0.3" className="animate-pulse" />
      </svg>
      
      {speaking && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 bg-cyan-400 rounded-full transition-all duration-100" style={{ height: `${8 + Math.sin((speakPhase + i) * 1.5) * 8}px`, opacity: 0.6 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProcessStep({ step, index, isActive, isComplete }: ProcessStepProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className={`relative border-l-4 pl-6 pb-6 ${
      isComplete ? 'border-green-500' : isActive ? 'border-cyan-500' : 'border-slate-700'
    }`}>
      <div className={`absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center ${
        isComplete ? 'bg-green-500' : isActive ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'
      }`}>
        {isComplete ? (
          <CheckCircle size={14} className="text-white" />
        ) : (
          <span className="text-xs font-bold text-white">{index + 1}</span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className={`font-semibold ${isComplete ? 'text-green-400' : isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
            {step.title}
          </h4>
          {step.duration && (
            <span className="text-xs text-slate-500">{step.duration}</span>
          )}
        </div>
        
        <p className="text-sm text-slate-400">{step.description}</p>
        
        {step.details && (
          <div className="mt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Code size={12} />
              {showDetails ? 'Hide' : 'Show'} technical details
              {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            
            {showDetails && (
              <div className="mt-2 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <pre className="text-xs text-slate-300 overflow-auto">
                  {JSON.stringify(step.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleRequestCard({ 
  scheduleData, 
  messageId,
  onApprove,
  onReject,
  processing
}: { 
  scheduleData: ScheduleData;
  messageId: number;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="mt-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-4 border-2 border-indigo-500/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Calendar className="text-indigo-400" size={20} />
        </div>
        <h4 className="font-bold text-indigo-300">Schedule Payment Request</h4>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Recipient:</span>
          <span className="text-white font-mono text-xs">{scheduleData.recipient.slice(0, 10)}...</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Amount:</span>
          <span className="text-cyan-400 font-bold text-xl">{scheduleData.amount} {scheduleData.currency}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Scheduled For:</span>
          <span className="text-white font-semibold">{formatDate(scheduleData.scheduledDate)}</span>
        </div>
        {scheduleData.recurring?.enabled && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Recurring:</span>
            <span className="text-purple-400 font-semibold flex items-center gap-1">
              <Repeat size={14} />
              {scheduleData.recurring.frequency}
            </span>
          </div>
        )}
        {scheduleData.description && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Description:</span>
            <span className="text-white">{scheduleData.description}</span>
          </div>
        )}
      </div>
      
      <div className="bg-indigo-500/10 rounded-lg p-3 mb-4 border border-indigo-500/30">
        <p className="text-xs text-indigo-300 flex items-center gap-2">
          <Clock size={14} />
          This payment will be executed automatically at the scheduled time
        </p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={processing}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader className="animate-spin" size={16} />
              Scheduling...
            </>
          ) : (
            <>
              <Check size={16} />
              Confirm Schedule
            </>
          )}
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function PaymentRequestCard({ 
  paymentData, 
  messageId,
  onApprove,
  onReject,
  processing
}: { 
  paymentData: PaymentData;
  messageId: number;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}) {
  return (
    <div className="mt-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 border-2 border-purple-500/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <DollarSign className="text-purple-400" size={20} />
        </div>
        <h4 className="font-bold text-purple-300">Payment Request</h4>
        {/* ✅ ADDED: Qubic badge */}
        <span className="ml-auto px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-semibold border border-cyan-500/50">
          ⚡ Qubic
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Recipient:</span>
          <span className="text-white font-mono text-xs">{paymentData.recipient.slice(0, 10)}...</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Amount:</span>
          <span className="text-cyan-400 font-bold text-xl">{paymentData.amount} {paymentData.currency}</span>
        </div>
        {paymentData.description && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Description:</span>
            <span className="text-white">{paymentData.description}</span>
          </div>
        )}
      </div>
      
      {/* ✅ ADDED: Qubic blockchain info */}
      <div className="bg-cyan-500/10 rounded-lg p-3 mb-4 border border-cyan-500/30">
        <p className="text-xs text-cyan-300 flex items-center gap-2">
          <Zap size={14} />
          This payment will be logged on Qubic blockchain with full audit trail
        </p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={processing}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader className="animate-spin" size={16} />
              Processing on Qubic...
            </>
          ) : (
            <>
              <Check size={16} />
              Approve Payment
            </>
          )}
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed"
        >
          <X size={16} />
          Reject
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('Voice inactive');
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [processingSchedule, setProcessingSchedule] = useState<number | null>(null);
  
  const [activeView, setActiveView] = useState<'dashboard' | 'chat'>('dashboard');
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);
  const [savedTransfers, setSavedTransfers] = useState<SavedTransfer[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const processingVoiceRef = useRef(false);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    fetch(`${API_BASE}/me`)
      .then(res => res.json())
      .then((data: Profile) => {
        setProfile(data);
        addBotMessage("Hello! I'm ArcBot, your AI wallet assistant. Say 'Hey Arc' or 'Arc' to talk to me, or type your message below.");
      })
      .catch(err => {
        console.error('Profile error:', err);
        addBotMessage("I'm having trouble connecting. Please make sure the backend is running on port 4000.");
      });
    
    loadScheduledPayments();
    loadSavedTransfers();
    loadPaymentHistory();
  }, []);
  
  const loadScheduledPayments = async () => {
    setLoadingScheduled(true);
    try {
      const response = await fetch(`${API_BASE}/scheduler/scheduled`);
      const data = await response.json();
      if (data.success) {
        setScheduledPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to load scheduled payments:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };
  
  const loadSavedTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const response = await fetch(`${API_BASE}/scheduler/transfers`);
      const data = await response.json();
      if (data.success) {
        setSavedTransfers(data.transfers || []);
      }
    } catch (error) {
      console.error('Failed to load saved transfers:', error);
    } finally {
      setLoadingTransfers(false);
    }
  };
  
  const loadPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE}/scheduler/history?limit=50&_=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      if (data.success) {
        setPaymentHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  const cancelScheduledPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`${API_BASE}/scheduler/scheduled/${paymentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        addBotMessage(`Payment ${paymentId} has been cancelled.`);
        loadScheduledPayments();
      }
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      addBotMessage('Failed to cancel payment. Please try again.');
    }
  };
  
useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  let lastProcessedTime = 0;
  const PROCESS_COOLDOWN = 2000; // 2 seconds between processing

  recognition.onstart = () => {
    setIsListening(true);
    setVoiceStatus('🎤 Listening... Just talk!');
    console.log('✅ Voice recognition started - Always listening mode');
  };

  recognition.onresult = (event: any) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    const transcriptLower = transcript.toLowerCase().trim();
    
    // Update transcript display
    setTranscript(transcript);
    
    // Check if this is a final result
    const isFinal = event.results[current].isFinal;
    
    console.log('🎤 Heard:', transcript, '| Final:', isFinal);
    
    // Only process final results
    if (isFinal) {
      // Ignore very short utterances (probably noise)
      if (transcript.length < 3) {
        console.log('⏭️ Ignoring short utterance');
        return;
      }
      
      // Ignore if currently processing or typing
      if (processingVoiceRef.current || isTyping) {
        console.log('⏸️ Already processing, skipping');
        return;
      }
      
      const now = Date.now();
      
      // Cooldown to prevent rapid-fire processing
      if (now - lastProcessedTime < PROCESS_COOLDOWN) {
        console.log('⏳ Cooldown active, ignoring');
        return;
      }
      
      lastProcessedTime = now;
      
      // Process the command
      handleVoiceCommand(transcriptLower);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('❌ Speech recognition error:', event.error);
    
    if (event.error === 'not-allowed') {
      setVoiceStatus('❌ Microphone access denied');
      setVoiceEnabled(false);
      setIsListening(false);
      alert('Please allow microphone access in your browser settings.');
    } else if (event.error === 'no-speech') {
      console.log('⏸️ No speech detected, continuing...');
    } else if (event.error === 'network') {
      console.log('🌐 Network error, restarting...');
      setVoiceStatus('🌐 Network issue, reconnecting...');
    } else {
      console.log(`⚠️ Error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    console.log('🔄 Recognition ended');
    setIsListening(false);
    
    // Auto-restart if voice is still enabled
    if (voiceEnabled && !processingVoiceRef.current) {
      console.log('🔄 Auto-restarting recognition...');
      setTimeout(() => {
        try {
          recognition.start();
          console.log('✅ Recognition restarted');
        } catch (e) {
          console.log('⚠️ Could not restart:', e);
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e2) {
              console.log('❌ Restart failed completely');
              setVoiceEnabled(false);
              setVoiceStatus('❌ Voice recognition stopped');
            }
          }, 1000);
        }
      }, 100);
    }
  };

  recognitionRef.current = recognition;

  return () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }
  };
}, [voiceEnabled, isTyping]);

// SIMPLIFIED handleVoiceCommand - no wake word extraction needed
const handleVoiceCommand = async (command: string) => {
  if (processingVoiceRef.current) {
    console.log('⏸️ Already processing a command, skipping');
    return;
  }
  
  processingVoiceRef.current = true;
  setVoiceStatus('🤖 Processing...');

  try {
    console.log('🎯 Processing command:', command);
    
    // Clean up the command (remove common filler words at start)
    let cleanCommand = command
      .replace(/^(um|uh|hmm|well|so|okay|ok)\s+/i, '')
      .trim();
    
    if (!cleanCommand || cleanCommand.length < 2) {
      processingVoiceRef.current = false;
      setVoiceStatus('🎤 Listening... Just talk!');
      return;
    }

    setActiveView('chat');
    addUserMessage(`🎤 ${cleanCommand}`);
    await chatWithAI(cleanCommand);

  } catch (error) {
    console.error('❌ Error processing voice command:', error);
    addBotMessage("Sorry, I had trouble understanding that. Please try again.");
  } finally {
    processingVoiceRef.current = false;
    setVoiceStatus('🎤 Listening... Just talk!');
  }
};

// SIMPLIFIED toggleVoiceListening
const toggleVoiceListening = async () => {
  if (!recognitionRef.current) {
    alert('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
    return;
  }

  if (voiceEnabled) {
    // Turn OFF voice
    recognitionRef.current.stop();
    setVoiceEnabled(false);
    setVoiceStatus('Voice inactive');
    setIsListening(false);
  } else {
    // Turn ON voice
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setVoiceEnabled(true);
      setVoiceStatus('🎤 Listening... Just talk!');
    } catch (error: any) {
      console.error('Failed to start voice recognition:', error);
      setVoiceStatus('❌ Microphone access denied');
      alert('Please allow microphone access in your browser settings and refresh the page.');
    }
  }
};

  const handleConfirmSchedule = async (messageId: number, scheduleData: ScheduleData) => {
    console.log('📅 Confirming schedule:', { messageId, scheduleData });
    setProcessingSchedule(messageId);
    
    try {
      const response = await fetch(`${API_BASE}/scheduler/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user'
        },
        body: JSON.stringify({
          payee: scheduleData.recipient,
          amount: scheduleData.amount,
          currency: scheduleData.currency,
          scheduledDate: scheduleData.scheduledDate,
          recurring: scheduleData.recurring || { enabled: false },
          description: scheduleData.description || `Scheduled payment to ${scheduleData.recipient}`
        })
      });
      
      const result = await response.json();
      console.log('📅 Schedule result:', result);
      
      if (result.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                type: 'bot',
                content: `✅ Payment Scheduled Successfully!\n\nAmount: ${scheduleData.amount} ${scheduleData.currency}\nRecipient: ${scheduleData.recipient}\nScheduled for: ${new Date(scheduleData.scheduledDate).toLocaleString()}\n\n${scheduleData.recurring?.enabled ? `🔁 Recurring: ${scheduleData.recurring.frequency}` : ''}`
              }
            : msg
        ));
        
        addBotMessage(`Your payment has been scheduled successfully!`);
        
        // Refresh all dashboard data
        loadScheduledPayments();
        loadPaymentHistory();
        loadSavedTransfers();
      } else {
        addBotMessage(`❌ Failed to schedule payment: ${result.error}`);
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                type: 'bot',
                content: `❌ Schedule Failed: ${result.error}`
              }
            : msg
        ));
      }
    } catch (error: any) {
      console.error('❌ Schedule error:', error);
      addBotMessage(`❌ Failed to schedule: ${error.message}`);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              type: 'bot',
              content: `❌ Schedule Error: ${error.message}`
            }
          : msg
      ));
    } finally {
      setProcessingSchedule(null);
    }
  };

  const handleRejectSchedule = (messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            type: 'bot',
            content: '❌ Schedule request cancelled by user.'
          }
        : msg
    ));
    
    addBotMessage("Schedule cancelled. Is there anything else I can help you with?");
  };

  // FIXED: handleApprovePayment now uses correct Qubic endpoint
  const handleApprovePayment = async (messageId: number, paymentData: PaymentData) => {
    console.log('🔄 Starting Qubic payment approval:', { messageId, paymentData });
    setProcessingPayment(messageId);
    
    try {
      console.log('📤 Sending payment request to Qubic backend...');
      
      // ✅ FIXED: Changed from /thirdweb/payment/send to /qubic/payment/send
      const response = await fetch(`${API_BASE}/qubic/payment/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: paymentData.recipient,
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description || `Payment to ${paymentData.recipient}`
        })
      });
      
      console.log('📥 Qubic backend response status:', response.status);
      const result = await response.json();
      console.log('📥 Qubic backend response data:', result);
      
      if (result.success) {
        // ✅ ENHANCED: Show both Decision TX and Payment TX
        const successMessage = `✅ Payment Successful on Qubic!\n\n` +
          `Sent ${paymentData.amount} ${paymentData.currency} to ${paymentData.recipient}\n\n` +
          `🔗 Blockchain Transactions:\n` +
          `• Decision Log: ${result.decisionTxHash ? result.decisionTxHash.slice(0, 10) + '...' : 'N/A'}\n` +
          `• Payment TX: ${result.txHash ? result.txHash.slice(0, 10) + '...' : 'N/A'}\n\n` +
          `${result.explorerUrl ? `🔍 View on Qubic Explorer:\n${result.explorerUrl}` : ''}`;
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                type: 'bot',
                content: successMessage
              }
            : msg
        ));
        
        
        addBotMessage(`Payment completed on Qubic blockchain! ${result.newBalance ? `Your new balance is ${result.newBalance} USDC.` : ''} Both decision log and payment are now verified on-chain.`);
        
        // Refresh wallet and history
        try {
          const freshResponse = await fetch(`${API_BASE}/me?refresh=true`);
          const freshData = await freshResponse.json();
          setProfile(freshData);
          loadPaymentHistory();
          loadSavedTransfers();
        } catch (refreshError) {
          console.error('Balance refresh failed:', refreshError);
        }
      } else {
        addBotMessage(`❌ Payment failed on Qubic: ${result.error}`);
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                type: 'bot',
                content: `❌ Payment Failed on Qubic: ${result.error}`
              }
            : msg
        ));
      }
    } catch (error: any) {
      console.error('❌ Qubic payment error:', error);
      addBotMessage(`❌ Payment failed: ${error.message}`);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              type: 'bot',
              content: `❌ Qubic Payment Error: ${error.message}`
            }
          : msg
      ));
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleRejectPayment = (messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            type: 'bot',
            content: '❌ Payment rejected by user.'
          }
        : msg
    ));
    
    addBotMessage("Payment cancelled. Is there anything else I can help you with?");
  };
  
  const addUserMessage = (message: string) => {
    setMessages(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now()
    }]);
  };
  
  const addBotMessage = (message: string, steps?: StepData[]) => {
    setMessages(prev => [...prev, {
      type: 'bot',
      content: message,
      steps: steps,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now()
    }]);
    speak(message);
  };
  
  const speak = async (message: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      if (window.arcBotLipSync) {
        window.arcBotLipSync.stop();
      }
      setSpeaking(false);
    }
    
    try {
      const response = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      
      const data = await response.json();
      
      if (data.url && !data.fallback) {
        const audio = new Audio(data.url);
        currentAudioRef.current = audio;
        
        audio.onplay = () => {
          setSpeaking(true);
          if (window.arcBotLipSync) {
            window.arcBotLipSync.start(audio);
          }
        };
        
        audio.onended = () => {
          if (window.arcBotLipSync) {
            window.arcBotLipSync.stop();
          }
          setSpeaking(false);
          currentAudioRef.current = null;
        };
        
        audio.onerror = () => {
          if (window.arcBotLipSync) {
            window.arcBotLipSync.stop();
          }
          setSpeaking(false);
          currentAudioRef.current = null;
          fallbackToSpeechSynthesis(message);
        };
        
        await audio.play();
      } else {
        fallbackToSpeechSynthesis(message);
      }
    } catch (error) {
      console.error('TTS error:', error);
      fallbackToSpeechSynthesis(message);
    }
  };
  
  const fallbackToSpeechSynthesis = (message: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      utterance.volume = 0.9;
      
      utterance.onstart = () => {
        setSpeaking(true);
      };
      
      utterance.onend = () => {
        if (window.arcBotLipSync) {
          window.arcBotLipSync.stop();
        }
        setSpeaking(false);
      };
      
      utterance.onerror = () => {
        if (window.arcBotLipSync) {
          window.arcBotLipSync.stop();
        }
        setSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 2000);
    }
  };
  
  const chatWithAI = async (userText: string) => {
    setIsTyping(true);
    
    const conversationHistory = messages
      .filter(m => m.type === 'user' || m.type === 'bot')
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content.replace(/^🎤 /, '')
      }));
    
    conversationHistory.push({
      role: 'user',
      content: userText
    });
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let accumulatedText = '';
      
      const tempMessageId = Date.now();
      setMessages(prev => [...prev, {
        type: 'bot',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        id: tempMessageId,
        streaming: true
      }]);
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedText += parsed.content;
                
                setMessages(prev => prev.map(msg => 
                  msg.id === tempMessageId 
                    ? { ...msg, content: accumulatedText }
                    : msg
                ));
                
                // Real-time detection logging
                if (accumulatedText.includes('SCHEDULE_REQUEST')) {
                  console.log('🔔 SCHEDULE_REQUEST detected in stream!');
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessageId 
          ? { ...msg, streaming: false }
          : msg
      ));
      
      console.log('🔍 Final accumulated text:', accumulatedText);
      console.log('🔍 Checking for SCHEDULE_REQUEST...');
      
      if (accumulatedText) {
        // SUPER AGGRESSIVE SCHEDULE DETECTION
        // Check if text contains "SCHEDULE_REQUEST" anywhere
        if (accumulatedText.includes('SCHEDULE_REQUEST')) {
          console.log('✅ Found SCHEDULE_REQUEST keyword!');
          
          try {
            // Extract everything after SCHEDULE_REQUEST:
            const afterSchedule = accumulatedText.split('SCHEDULE_REQUEST:')[1];
            if (!afterSchedule) throw new Error('No content after SCHEDULE_REQUEST:');
            
            console.log('📄 Content after SCHEDULE_REQUEST:', afterSchedule.substring(0, 200));
            
            // Try to find JSON-like structure
            // Find first { and last }
            const firstBrace = afterSchedule.indexOf('{');
            const lastBrace = afterSchedule.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1) {
              throw new Error('No JSON braces found');
            }
            
            let jsonStr = afterSchedule.substring(firstBrace, lastBrace + 1);
            console.log('🔧 Extracted JSON string:', jsonStr);
            
            // Clean up common issues
            jsonStr = jsonStr
              .replace(/\n/g, ' ')           // Remove newlines
              .replace(/\s+/g, ' ')          // Normalize whitespace
              .replace(/,\s*}/g, '}')        // Remove trailing commas
              .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
              .replace(/:\s*,/g, ': null,')  // Fix missing values
              .replace(/:\s*}/g, ': null}')  // Fix missing values at end
              .trim();
            
            console.log('🧹 Cleaned JSON:', jsonStr);
            
            const scheduleData = JSON.parse(jsonStr);
            console.log('✅ Parsed schedule data:', scheduleData);
            
            // Extract required fields (with fallbacks)
            const recipient = scheduleData.recipient || scheduleData.to || scheduleData.payee;
            const amount = scheduleData.amount;
            const scheduledDate = scheduleData.scheduledDate || scheduleData.date;
            
            if (!recipient || !amount || !scheduledDate) {
              console.error('❌ Missing required fields:', { recipient, amount, scheduledDate });
              throw new Error('Missing required fields');
            }
            
            // Build clean schedule data
            const cleanScheduleData = {
              recipient: recipient,
              amount: parseFloat(amount),
              currency: scheduleData.currency || 'USDC',
              scheduledDate: scheduledDate,
              recurring: scheduleData.recurring || { enabled: false },
              description: scheduleData.description || 'Scheduled payment'
            };
            
            console.log('🎯 Final schedule data:', cleanScheduleData);
            
            // Remove the SCHEDULE_REQUEST block from content
            const cleanContent = accumulatedText.split('SCHEDULE_REQUEST:')[0].trim();
            
            setMessages(prev => prev.map(msg => 
              msg.id === tempMessageId 
                ? { 
                    ...msg, 
                    type: 'schedule-request',
                    scheduleData: cleanScheduleData,
                    content: cleanContent || "I've prepared a scheduled payment for your review. Please click 'Confirm Schedule' to proceed."
                  }
                : msg
            ));
            
            speak("I've prepared a scheduled payment request. Please review and confirm using the button.");
            setIsTyping(false);
            abortControllerRef.current = null;
            return; // CRITICAL: Exit here to prevent further processing
          } catch (error) {
            console.error('❌ Schedule parsing failed:', error);
            console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
            // Continue to regular message handling
          }
        }
        
        const paymentMatch = accumulatedText.match(/PAYMENT_REQUEST:\s*(\{[\s\S]*?\})/i);
        
        if (paymentMatch) {
          try {
            const jsonStr = paymentMatch[1].trim();
            const paymentData = JSON.parse(jsonStr);
            
            if (paymentData.recipient && paymentData.amount) {
              const cleanContent = accumulatedText.replace(/PAYMENT_REQUEST:\s*\{[\s\S]*?\}/i, '').trim();
              
              setMessages(prev => prev.map(msg => 
                msg.id === tempMessageId 
                  ? { 
                      ...msg, 
                      type: 'payment-request',
                      paymentData: {
                        recipient: paymentData.recipient,
                        amount: parseFloat(paymentData.amount),
                        currency: paymentData.currency || 'USDC',
                        description: paymentData.description
                      },
                      content: cleanContent || "I've prepared a payment for your review."
                    }
                  : msg
              ));
              
              speak(cleanContent || "I've prepared a payment request for your approval.");
              return;
            }
          } catch (e) {
            console.error('Failed to parse payment request:', e, paymentMatch[0]);
          }
        }
        
        speak(accumulatedText);
      }
      
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        addBotMessage("I'm having trouble connecting to my AI brain. Please check that the Cloudflare Worker is configured correctly.");
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleSend = async () => {
    if (!text.trim() || isTyping) return;
    
    const userText = text.trim();
    addUserMessage(userText);
    setText('');
    
    await chatWithAI(userText);
  };
  
  const getMood = (): 'neutral' | 'happy' | 'thinking' => {
    if (isTyping) return 'thinking';
    if (speaking) return 'happy';
    return 'neutral';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const upcomingPayments = scheduledPayments.filter(p => p.status === 'scheduled').slice(0, 3);
  const recentHistory = paymentHistory.slice(0, 3);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-2xl">
                  <Zap className="text-white" size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  ArcBot AI
                </h1>
                {/* ✅ ADDED: Qubic blockchain indicator */}
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  Intelligent Payment Assistant
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-[10px] font-semibold border border-cyan-500/50">
                    ⚡ Qubic Blockchain
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Voice button - keep as is */}
              <button
                onClick={toggleVoiceListening}
                className={`relative px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  voiceEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                <span className="text-sm font-semibold">Voice {voiceEnabled ? 'ON' : 'OFF'}</span>
                {isListening && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
              </button>
              
              {/* Balance display - keep as is */}
              {profile && (
                <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-400">Balance</div>
                  <div className="text-lg font-bold text-cyan-400">{profile.wallet?.balance || 0} USDC</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              activeView === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Activity size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              activeView === 'chat'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MessageSquare size={20} />
            AI Chat
          </button>
        </div>
        
        {activeView === 'dashboard' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <ArcBotFace speaking={speaking} mood={getMood()} processing={isTyping} listening={isListening} />
                
                {voiceEnabled && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-semibold text-green-400">Voice Active</span>
                    </div>
                    <p className="text-xs text-slate-400">{voiceStatus}</p>
                    {transcript && (
                      <p className="text-xs text-slate-500 italic mt-2 bg-slate-900/50 p-2 rounded">"{transcript}"</p>
                    )}
                  </div>
                )}
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    Say "Arc, what's my balance?"
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    Say "Arc, send 10 USDC"
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 bg-pink-400 rounded-full" />
                    Say "Arc, pay Netflix"
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-400" size={20} />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveView('chat')}
                    className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/50 text-cyan-400 font-semibold py-3 px-4 rounded-xl transition-all text-left flex items-center gap-3"
                  >
                    <MessageSquare size={18} />
                    <span>Chat with Arc</span>
                  </button>
                  <button
                    onClick={() => {
                      loadScheduledPayments();
                      loadSavedTransfers();
                      loadPaymentHistory();
                    }}
                    className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/50 text-purple-400 font-semibold py-3 px-4 rounded-xl transition-all text-left flex items-center gap-3"
                  >
                    <RefreshCw size={18} />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="text-cyan-400" size={24} />
                    Upcoming Payments
                  </h3>
                  <button
                    onClick={loadScheduledPayments}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <RefreshCw size={16} className={loadingScheduled ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                {loadingScheduled ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="animate-spin text-cyan-400" size={32} />
                  </div>
                ) : upcomingPayments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No upcoming payments</p>
                    <p className="text-sm mt-1">Schedule payments via AI chat</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingPayments.map(payment => (
                      <div key={payment.paymentId} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/50 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white">{payment.payee}</h4>
                              {payment.recurring?.enabled && (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full flex items-center gap-1">
                                  <Repeat size={10} />
                                  {payment.recurring.frequency}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatDate(payment.scheduledDate)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-cyan-400">{payment.amount} {payment.currency}</div>
                            <button
                              onClick={() => cancelScheduledPayment(payment.paymentId)}
                              className="mt-1 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {scheduledPayments.length > 3 && (
                      <button className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold">
                        View all {scheduledPayments.length} scheduled payments →
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Star className="text-yellow-400" size={20} />
                      Saved Transfers
                    </h3>
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs font-semibold">{savedTransfers.length}</span>
                  </div>
                  
                  {loadingTransfers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="animate-spin text-yellow-400" size={24} />
                    </div>
                  ) : savedTransfers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Star size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No saved transfers</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedTransfers.slice(0, 3).map(transfer => (
                        <div key={transfer.transferId} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                          <div className="flex items-center gap-2 mb-1">
                            {transfer.favorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                            <span className="font-semibold text-sm">{transfer.nickname || transfer.payee}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{transfer.useCount} uses</span>
                            <span className="text-cyan-400 font-semibold">{transfer.amount} {transfer.currency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <History className="text-purple-400" size={20} />
                      Recent Activity
                    </h3>
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs font-semibold">{paymentHistory.length}</span>
                  </div>
                  
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="animate-spin text-purple-400" size={24} />
                    </div>
                  ) : recentHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <History size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No payment history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentHistory.map(history => (
                        <div key={history.historyId} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{history.payee}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              history.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {history.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Transaction</span>
                            <span className="text-cyan-400 font-semibold">{history.amount} {history.currency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'chat' && (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm sticky top-24">
                <ArcBotFace speaking={speaking} mood={getMood()} processing={isTyping} listening={isListening} />
                
                {voiceEnabled && (
                  <div className="mt-4 p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                    <p className="text-xs text-slate-400">{voiceStatus}</p>
                    {transcript && (
                      <p className="text-xs text-slate-500 italic mt-2">"{transcript}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col" style={{ height: '600px' }}>
                <div className="p-6 border-b border-slate-700/50">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="text-purple-400" size={24} />
                    AI Conversation
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Chat with ArcBot about payments, scheduling, and more</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${
                        msg.type === 'user' 
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600' 
                          : msg.type === 'payment-request'
                          ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/60 border-2 border-purple-500/50'
                          : msg.type === 'schedule-request'
                          ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-2 border-indigo-500/50'
                          : 'bg-slate-700/50'
                      } rounded-2xl p-4 shadow-lg ${msg.streaming ? 'animate-pulse' : ''}`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <span className="text-xs text-slate-400 mt-2 block">{msg.timestamp}</span>
                        
                        {msg.type === 'payment-request' && msg.paymentData && (
                          <PaymentRequestCard
                            paymentData={msg.paymentData}
                            messageId={msg.id}
                            onApprove={() => handleApprovePayment(msg.id, msg.paymentData!)}
                            onReject={() => handleRejectPayment(msg.id)}
                            processing={processingPayment === msg.id}
                          />
                        )}
                        
                        {msg.type === 'schedule-request' && msg.scheduleData && (
                          <ScheduleRequestCard
                            scheduleData={msg.scheduleData}
                            messageId={msg.id}
                            onApprove={() => handleConfirmSchedule(msg.id, msg.scheduleData!)}
                            onReject={() => handleRejectSchedule(msg.id)}
                            processing={processingSchedule === msg.id}
                          />
                        )}
                        
                        {msg.steps && (
                          <div className="mt-4 pt-4 border-t border-slate-600/50">
                            {msg.steps.map((step, idx) => (
                              <ProcessStep key={idx} step={step} index={idx} isActive={false} isComplete={true} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700/50 rounded-2xl p-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-6 border-t border-slate-700/50">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type or say 'Arc' to speak..."
                      className="flex-1 bg-slate-900/50 text-white px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700/50 placeholder-slate-500"
                      disabled={isTyping}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isTyping || !text.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2 disabled:cursor-not-allowed"
                    >
                      {isTyping ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}