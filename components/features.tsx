"use client"

import type React from "react"

import { useTheme } from "next-themes"
import Earth from "./ui/globe"
import ScrambleHover from "./ui/scramble"
import { FollowerPointerCard } from "./ui/following-pointer"
import { motion, useInView } from "framer-motion"
import { Suspense, useEffect, useRef, useState } from "react"
import { geist } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { theme } = useTheme()
  const [isHovering, setIsHovering] = useState(false)
  const [isCliHovering, setIsCliHovering] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string>("")
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([])
  const [threadId, setThreadId] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string; thread_id: string }>>([])
  const [groupedChatHistory, setGroupedChatHistory] = useState<Array<{ thread_id: string; messages: Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string }>; last_updated: string }>>([])
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [baseColor, setBaseColor] = useState<[number, number, number]>([0.906, 0.541, 0.325]) // #e78a53 in RGB normalized
  const [glowColor, setGlowColor] = useState<[number, number, number]>([0.906, 0.541, 0.325]) // #e78a53 in RGB normalized

  const [dark, setDark] = useState<number>(theme === "dark" ? 1 : 0)

  useEffect(() => {
    setBaseColor([0.906, 0.541, 0.325]) // #e78a53
    setGlowColor([0.906, 0.541, 0.325]) // #e78a53
    setDark(theme === "dark" ? 1 : 0)
  }, [theme])


  // Prepare a chat thread and load current user
  useEffect(() => {
    setThreadId((typeof crypto !== "undefined" && (crypto as any).randomUUID?.()) || `thread-${Date.now()}`)
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setCurrentUser(data?.user || null)
        if (data?.user) {
          loadChatHistory(data.user.id)
        }
      } catch (_) {
        setCurrentUser(null)
      }
    }
    loadUser()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUser(session?.user || null)
      if (session?.user) {
        loadChatHistory(session.user.id)
      }
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      console.log('Speech synthesis initialized')
    }
  }, [])

  const loadChatHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading chat history:', error)
        return
      }
      
      setChatHistory(data || [])
      
      // Group messages by thread_id
      const grouped = (data || []).reduce((acc: any, message: any) => {
        const threadId = message.thread_id
        if (!acc[threadId]) {
          acc[threadId] = {
            thread_id: threadId,
            messages: [],
            last_updated: message.created_at
          }
        }
        acc[threadId].messages.push(message)
        // Update last_updated to the most recent message
        if (new Date(message.created_at) > new Date(acc[threadId].last_updated)) {
          acc[threadId].last_updated = message.created_at
        }
        return acc
      }, {})
      
      // Convert to array and sort by last_updated (most recent first)
      const groupedArray = Object.values(grouped).sort((a: any, b: any) => 
        new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      ) as Array<{ thread_id: string; messages: Array<{ id: string; role: "user" | "assistant"; content: string; created_at: string }>; last_updated: string }>
      
      setGroupedChatHistory(groupedArray)
    } catch (err) {
      console.error('Error loading chat history:', err)
    }
  }

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isPopupOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isPopupOpen])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Scroll within the chat container only, not the entire page
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [messages])

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-IN' // Changed to Indian English

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputValue(transcript)
          setIsListening(false)
          setIsVoiceInput(true) // Mark as voice input
          
          // Check if it's the special command
          const normalizedTranscript = transcript.toUpperCase().trim()
          if (normalizedTranscript === "YUKTI TELL US ABOUT YOURSELF") {
            // Handle special command immediately
            handleAsk()
            return
          }
          
          // Auto-send after 2 seconds of silence for regular commands
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current)
          }
          responseTimeoutRef.current = setTimeout(() => {
            if (transcript.trim()) {
              handleAsk()
            }
          }, 2000)
        }

        recognitionRef.current.onerror = () => {
          setIsListening(false)
          if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }

      // Initialize speech synthesis and load voices
      synthRef.current = window.speechSynthesis
      
      // Load voices (they might not be available immediately)
      const loadVoices = () => {
        if (synthRef.current) {
          const voices = synthRef.current.getVoices()
          console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`))
        }
      }
      
      // Load voices immediately and when they become available
      loadVoices()
      synthRef.current.onvoiceschanged = loadVoices
    }
  }, [])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      setIsVoiceInput(false) // Ensure text input is not marked as voice
      await handleAsk()
    }
  }

  const handleSendClick = async () => {
    setIsVoiceInput(false) // Ensure text input is not marked as voice
    await handleAsk()
  }

  const loadConversation = (threadId: string) => {
    const conversation = groupedChatHistory.find(group => group.thread_id === threadId)
    if (conversation) {
      setMessages(conversation.messages)
      setThreadId(threadId)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setThreadId((typeof crypto !== "undefined" && (crypto as any).randomUUID?.()) || `thread-${Date.now()}`)
    setAiError("")
  }

  // Helper function to send message to Yukti via n8n webhook
  const sendMessageToYukti = async (userId: string, userMessage: string) => {
    try {
      const response = await fetch("https://ebelthomasseiko.app.n8n.cloud/webhook/9a773b80-38c9-455f-bb27-6a9295197519", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          message: userMessage
        })
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = `HTTP error! status: ${response.status}`
        try {
          const errorText = await response.text()
          if (errorText) {
            errorDetails += ` - ${errorText}`
          }
        } catch (e) {
          // Could not read error response
        }
        throw new Error(errorDetails)
      }
      
      const data = await response.text()
      return data
    } catch (error) {
      console.error('sendMessageToYukti error:', error)
      throw error
    }
  }

  // Function to play Yukti's special audio
  const playYuktiAudio = () => {
    try {
      const audio = new Audio('/yukti-voice.mp3')
      audio.play().catch(error => {
        console.error('Error playing Yukti audio:', error)
      })
    } catch (error) {
      console.error('Error creating audio element:', error)
    }
  }

  const handleAsk = async () => {
    const prompt = inputValue.trim()
    if (!prompt) return
    if (!currentUser) {
      window.location.href = "/login"
      return
    }
    
    // Check for special command
    const normalizedPrompt = prompt.toUpperCase().trim()
    if (normalizedPrompt === "YUKTI TELL US ABOUT YOURSELF") {
      // Clear input and add user message immediately
      setInputValue("")
      setAiError("")
      const userMsg = { id: `${Date.now()}-u`, role: "user" as const, content: prompt }
      setMessages((prev) => [...prev, userMsg])
      
      // Add a special response message
      const botMsg = { id: `${Date.now()}-a`, role: "assistant" as const, content: "Let me introduce myself..." }
      setMessages((prev) => [...prev, botMsg])
      
      // Play the special audio
      playYuktiAudio()
      
      // Save to Supabase
      void saveMessagesToSupabase([userMsg, botMsg]).catch(() => {})
      
      // Reload chat history
      if (currentUser) {
        loadChatHistory(currentUser.id)
      }
      return
    }
    
    // Regular chat flow for other messages
    // Clear input and add user message immediately
    setInputValue("")
    setAiError("")
    const userMsg = { id: `${Date.now()}-u`, role: "user" as const, content: prompt }
    setMessages((prev) => [...prev, userMsg])
    
    setAiLoading(true)
    try {
      const data = await sendMessageToYukti(currentUser.id, prompt)
      
      if (data) {
        const botMsg = { id: `${Date.now()}-a`, role: "assistant" as const, content: data }
        setMessages((prev) => [...prev, botMsg])
        void saveMessagesToSupabase([userMsg, botMsg]).catch(() => {})
        // Only speak if the input was from voice
        if (isVoiceInput) {
          speakText(data)
        }
        // Reload chat history after new message
        if (currentUser) {
          loadChatHistory(currentUser.id)
        }
      } else {
        setAiError("No reply received from Yukti")
      }
    } catch (e: any) {
      console.error('Yukti webhook failed:', e)
      setAiError(`Failed to get response from Yukti: ${e?.message || 'Unknown error'}`)
    } finally {
      setAiLoading(false)
      setIsVoiceInput(false) // Reset voice input flag
    }
  }

  const saveMessagesToSupabase = async (msgs: Array<{ id: string; role: "user" | "assistant"; content: string }>) => {
    if (!currentUser) return
    try {
      const rows = msgs.map((m) => ({
        thread_id: threadId,
        user_id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || null,
        role: m.role,
        content: m.content,
      }))
      await supabase.from("chat_messages").insert(rows)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to save chat_messages:", err)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      // Clear any pending auto-response
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current)
      }
    }
  }

  const speakText = (text: string) => {
    if (synthRef.current && text) {
      // Stop any current speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0 // Normal speed
      utterance.pitch = 1
      utterance.volume = 0.8
      
      // Get all available voices
      const voices = synthRef.current.getVoices()
      
      // Filter only female voices
      const femaleVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('priya') ||
        voice.name.toLowerCase().includes('neerja') ||
        voice.name.toLowerCase().includes('linda') ||
        voice.name.toLowerCase().includes('melissa') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('serena') ||
        voice.name.toLowerCase().includes('tessa') ||
        voice.name.toLowerCase().includes('veena') ||
        voice.name.toLowerCase().includes('rekha')
      )
      
      if (femaleVoices.length > 0) {
        // Prefer Indian female voices first
        const indianFemale = femaleVoices.find(voice => 
          voice.name.toLowerCase().includes('priya') ||
          voice.name.toLowerCase().includes('neerja') ||
          voice.name.toLowerCase().includes('veena') ||
          voice.name.toLowerCase().includes('rekha') ||
          (voice.lang === 'en-IN' || voice.lang.includes('en-IN'))
        )
        
        utterance.voice = indianFemale || femaleVoices[0]
      }
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }


  return (
    <section id="features" className="text-foreground relative overflow-hidden py-12 sm:py-24 md:py-32">
      <div className="bg-primary absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-40 blur-3xl select-none"></div>
      <div className="via-primary/50 absolute top-0 left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent transition-all ease-in-out"></div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0 }}
        className="container mx-auto flex flex-col items-center gap-6 sm:gap-12"
      >
        <h2
          className={cn(
            "via-foreground mb-8 bg-gradient-to-b from-zinc-800 to-zinc-700 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px]",
            geist.className,
          )}
        >
          Features
        </h2>
        <FollowerPointerCard
          title={
            <div className="flex items-center gap-2">
              {/* <span>emoji here</span> */}
              <span>Unlock Guidance</span>
            </div>
          }
        >
          <div className="cursor-none">
            <div className="grid grid-cols-12 gap-4 justify-center">
              {/* Cli */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                onMouseEnter={() => setIsCliHovering(true)}
                onMouseLeave={() => setIsCliHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(231, 138, 83, 0.6)",
                  boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">Interactive Quizzes</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Assess Aptitude and Technical Skills with Engaging Quizzes Tailored for Students.
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none flex grow items-center justify-center select-none relative">
                  <div
                    className="relative w-full h-[400px] rounded-xl overflow-hidden"
                    style={{ borderRadius: "20px" }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <div className="relative w-full h-full">
                        <img
                          src="https://framerusercontent.com/images/UjqUIiBHmIcSH9vos9HlG2BF4bo.png"
                          alt="Add image link in further development"
                          className="absolute inset-0 w-full h-full object-cover rounded-xl bg-black/50 "
                        />
                        {/* <div className="absolute inset-0 bg-black/500 rounded-xl"></div> */}
                      </div>

                    </div>

                    {/* Animated SVG Connecting Lines */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={isCliHovering ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
                        <motion.path
                          d="M 60.688 1.59 L 60.688 92.449 M 60.688 92.449 L 119.368 92.449 M 60.688 92.449 L 1.414 92.449"
                          stroke="rgb(255,222,213)"
                          fill="transparent"
                          strokeDasharray="2 2"
                          initial={{ pathLength: 0 }}
                          animate={isCliHovering ? { pathLength: 1 } : { pathLength: 0 }}
                          transition={{
                            duration: 2,
                            ease: "easeInOut",
                          }}
                        />
                      </svg>
                      <svg width="100%" height="100%" viewBox="0 0 121 94" className="absolute">
                        <motion.path
                          d="M 60.688 92.449 L 60.688 1.59 M 60.688 1.59 L 119.368 1.59 M 60.688 1.59 L 1.414 1.59"
                          stroke="rgb(255,222,213)"
                          fill="transparent"
                          strokeDasharray="2 2"
                          initial={{ pathLength: 0 }}
                          animate={isCliHovering ? { pathLength: 1 } : { pathLength: 0 }}
                          transition={{
                            duration: 2,
                            delay: 0.5,
                            ease: "easeInOut",
                          }}
                        />
                      </svg>
                    </motion.div>

                    {/* Animated Purple Blur Effect */}
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-500 rounded-full blur-[74px] opacity-65 transform -translate-x-1/2 -translate-y-1/2"
                      initial={{ scale: 1 }}
                      animate={isCliHovering ? { scale: [1, 1.342, 1, 1.342] } : { scale: 1 }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: isCliHovering ? Number.POSITIVE_INFINITY : 0,
                        repeatType: "loop",
                      }}
                    />

                    {/* Main Content Container with Staggered Animations */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-8">
                        {/* Left Column */}
                        <div className="flex flex-col gap-3">
                          {["Career Recommendations – AI-based suggestions", "Skill Gap Analysis – Strengths & weaknesses", "Learning Pathways – Stepwise career roadmap"].map((item, index) => (
                            <motion.div
                              key={`left-${index}`}
                              className="bg-white rounded px-3 py-2 flex items-center gap-2 text-black text-sm font-medium shadow-sm"
                              initial={{ opacity: 1, x: 0 }}
                              animate={isCliHovering ? { x: [-20, 0] } : { x: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                              }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                {index === 0 && <span className="text-xs">😉</span>}
                                {index === 1 && <span className="text-xs">😁</span>}
                                {index === 2 && <span className="text-xs">😊</span>}
                              </div>
                              {item}
                            </motion.div>
                          ))}
                        </div>

                        {/* Center Logo */}
                        {/* <motion.div
                          className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden shadow-lg"
                          initial={{ opacity: 1, scale: 1 }}
                          animate={isCliHovering ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <img
                            src="/yb-removebg-preview.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        </motion.div> */}

                        {/* Right Column */}
                        <div className="flex flex-col gap-3">
                          {["Career Library – Explore career options", "Mentorship & Guidance – Expert support & advice", "Progress Tracking – Monitor growth & achievements"].map((item, index) => (
                            <motion.div
                              key={`right-${index}`}
                              className="bg-white rounded px-3 py-2 flex items-center gap-2 text-black text-sm font-medium shadow-sm"
                              initial={{ opacity: 1, x: 0 }}
                              animate={isCliHovering ? { x: [20, 0] } : { x: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                              }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="w-4 h-4 flex items-center justify-center">
                                {index === 0 && <span className="text-xs">👥</span>}
                                {index === 1 && <span className="text-xs">💳</span>}
                                {index === 2 && <span className="text-xs">👨‍⚕️</span>}
                              </div>
                              {item}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Animated Circular Border */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={isCliHovering ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg width="350" height="350" viewBox="0 0 350 350" className="opacity-40">
                        <motion.path
                          d="M 175 1.159 C 271.01 1.159 348.841 78.99 348.841 175 C 348.841 271.01 271.01 348.841 175 348.841 C 78.99 348.841 1.159 271.01 1.159 175 C 1.159 78.99 78.99 1.159 175 1.159 Z"
                          stroke="rgba(255, 255, 255, 0.38)"
                          strokeWidth="1.16"
                          fill="transparent"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0, rotate: 0 }}
                          animate={isCliHovering ? { pathLength: 1, rotate: 360 } : { pathLength: 0, rotate: 0 }}
                          transition={{
                            pathLength: { duration: 3, ease: "easeInOut" },
                            rotate: {
                              duration: 20,
                              repeat: isCliHovering ? Number.POSITIVE_INFINITY : 0,
                              ease: "linear",
                            },
                          }}
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Global */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(231, 138, 83, 0.6)",
                  boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">Geolocated College Directory​</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Discover colleges around you instantly. Search by location, view detailed profiles, courses offered, and make informed decisions about your higher education options.
                    </p>
                  </div>
                </div>
                <div className="flex min-h-[300px] grow items-start justify-center select-none">
                  <h1 className="mt-8 text-center text-5xl leading-[100%] font-semibold sm:leading-normal lg:mt-12 lg:text-6xl">
                    <span className='bg-background relative mt-3 inline-block w-fit rounded-md border px-1.5 py-0.5 before:absolute before:top-0 before:left-0 before:z-10 before:h-full before:w-full before:bg-[url("/noise.gif")] before:opacity-[0.09] before:content-[""]'>
                      <ScrambleHover
                        text="find now"
                        scrambleSpeed={70}
                        maxIterations={20}
                        useOriginalCharsOnly={false}
                        className="cursor-pointer bg-gradient-to-t from-[#e78a53] to-[#e78a53] bg-clip-text text-transparent"
                        isHovering={isHovering}
                        setIsHovering={setIsHovering}
                        characters="0100101010111010110101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101"
                      />
                    </span>
                  </h1>
                  <div className="absolute top-64 z-10 flex items-center justify-center">
                    <div className="w-[400px] h-[400px]">
                      <Suspense
                        fallback={
                          <div className="bg-secondary/20 h-[400px] w-[400px] animate-pulse rounded-full"></div>
                        }
                      >
                        <Earth baseColor={baseColor} markerColor={[0, 0, 0]} glowColor={glowColor} dark={dark} />
                      </Suspense>
                    </div>
                  </div>
                  <div className="absolute top-1/2 w-full translate-y-20 scale-x-[1.2] opacity-70 transition-all duration-1000 group-hover:translate-y-8 group-hover:opacity-100">
                    <div className="from-primary/50 to-primary/0 absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[512px] dark:opacity-100"></div>
                    <div className="from-primary/30 to-primary/0 absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[256px] dark:opacity-100"></div>
                  </div>
                </div>
              </motion.div>

              {/* Smart Components */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-2"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  scale: 1.02,
                  borderColor: "rgba(231, 138, 83, 0.5)",
                  boxShadow: "0 0 30px rgba(231, 138, 83, 0.2)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl leading-none font-semibold tracking-tight">YUKTI</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={startNewChat}
                        className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        New Chat
                      </button>
                      <button
                        onClick={() => setIsPopupOpen(true)}
                        className="px-4 py-2 bg-[#e78a53] hover:bg-[#e78a53]/90 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Open YUKTI in Pop-up
                      </button>
                    </div>
                  </div>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Your Ultimate Knowledge & Thoughtful Intelligence - AI assistants trained on human-researched data to provide reliable answers, personalized guidance, and accurate career advice.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="w-full max-w-lg">
                    <div className="relative rounded-2xl border border-white/10 bg-black/20 dark:bg-white/5 backdrop-blur-sm flex flex-col h-[400px]">
                      {/* Chat messages area */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {!currentUser && (
                          <div className="text-sm text-white/70 text-center">Please log in to use YUKTI.</div>
                        )}
                        {messages.map((m) => (
                          <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                            <div className={`${m.role === "assistant" ? "bg-white/10" : "bg-[#e78a53] text-black"} max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {aiError && (
                          <div className="text-xs text-red-400 whitespace-pre-wrap">{aiError}</div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      
                      {/* Input area at bottom */}
                      <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-3">
                          <textarea
                            className="flex-1 min-h-[44px] max-h-[120px] bg-transparent border-none text-white placeholder:text-white/50 resize-none focus:outline-none text-sm leading-relaxed"
                            placeholder={currentUser ? "Ask YUKTI..." : "Log in to chat with YUKTI"}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!currentUser || aiLoading}
                          />
                          {/* Voice input button */}
                          <button
                            onClick={isListening ? stopListening : startListening}
                            disabled={!currentUser || aiLoading}
                            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                              isListening 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "bg-white/10 hover:bg-white/20 text-white/70"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isListening ? "Stop listening" : "Start voice input"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                              <line x1="12" y1="19" x2="12" y2="23"></line>
                              <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                          </button>
                          <button
                            onClick={handleSendClick}
                            disabled={!currentUser || aiLoading || !inputValue.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e78a53] hover:bg-[#e78a53]/90 transition-colors text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                              <path d="M2 12h20"></path>
                            </svg>
                          {aiLoading ? "Thinking..." : "Ask"}
                        </button>
                        </div>
                        {/* Voice output controls */}
                        {isSpeaking && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#e78a53] rounded-full animate-pulse"></div>
                              <span>YUKTI is speaking...</span>
                            </div>
                            <button
                              onClick={stopSpeaking}
                              className="text-red-400 hover:text-red-300 underline"
                            >
                              Stop
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dynamic Layouts */}
              <motion.div
                className="group border-secondary/40 text-card-foreground relative col-span-12 flex flex-col overflow-hidden rounded-xl border-2 p-6 shadow-xl transition-all ease-in-out md:col-span-6 xl:col-span-6 xl:col-start-8"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                whileHover={{
                  rotateY: 5,
                  rotateX: 2,
                  boxShadow: "0 20px 40px rgba(231, 138, 83, 0.3)",
                  borderColor: "rgba(231, 138, 83, 0.6)",
                }}
                style={{ transition: "all 0s ease-in-out" }}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl leading-none font-semibold tracking-tight">Human Researched Data​</h3>
                  <div className="text-md text-muted-foreground flex flex-col gap-2 text-sm">
                    <p className="max-w-[460px]">
                      Powered by human-researched data collected from official sources, college websites, and real student insights to deliver accurate guidance and career advice.
                    </p>
                  </div>
                </div>
                <div className="flex grow items-center justify-center select-none relative min-h-[300px] p-4">
                  <div className="relative w-full max-w-sm">
                    <img
                      src="/image.png"
                      alt="Dynamic Layout Example"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </FollowerPointerCard>
      </motion.div>

      {/* YUKTI Popup Modal */}
      {isPopupOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPopupOpen(false)
            }
          }}
        >
          <div 
            className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl h-[80vh] flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Sidebar */}
            <div className="w-80 bg-zinc-800/50 border-r border-zinc-700 p-6 flex flex-col">
              {/* Close Button */}
              <button
                onClick={() => setIsPopupOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* YUKTI Title */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#e78a53] mb-2">YUKTI</h2>
                <p className="text-zinc-400 text-sm">Your Ultimate Knowledge & Thoughtful Intelligence</p>
              </div>
              
              {/* User Info */}
              {currentUser && (
                <div className="mb-6 p-4 bg-zinc-700/50 rounded-lg">
                  <div className="text-white font-medium mb-1">
                    {currentUser.user_metadata?.full_name || 'User'}
                  </div>
                  <div className="text-zinc-400 text-sm mb-2">
                    {currentUser.email}
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {new Date().toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
              
              {/* Chat History */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">Chat History</h3>
                  <button
                    onClick={startNewChat}
                    className="text-[#e78a53] hover:text-[#e78a53]/80 text-sm font-medium transition-colors"
                  >
                    + New Chat
                  </button>
                </div>
                <div 
                  className="h-full overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {groupedChatHistory.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No chat history yet</p>
                  ) : (
                    groupedChatHistory.map((conversation, index) => {
                      const firstUserMessage = conversation.messages.find(msg => msg.role === 'user')
                      const lastMessage = conversation.messages[conversation.messages.length - 1]
                      const isActive = conversation.thread_id === threadId
                      
                      return (
                        <div 
                          key={conversation.thread_id} 
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            isActive 
                              ? 'bg-[#e78a53]/20 border border-[#e78a53]/30' 
                              : 'bg-zinc-700/30 hover:bg-zinc-700/50'
                          }`}
                          onClick={() => loadConversation(conversation.thread_id)}
                        >
                          <div className="text-xs text-zinc-400 mb-1">
                            {new Date(conversation.last_updated).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-white text-sm">
                            <div className="font-medium mb-1">
                              {firstUserMessage && firstUserMessage.content.length > 50 
                                ? `${firstUserMessage.content.substring(0, 50)}...` 
                                : firstUserMessage?.content || 'New conversation'
                              }
                            </div>
                            <div className="text-zinc-400 text-xs">
                              {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div 
                className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800"
                onWheel={(e) => e.stopPropagation()}
              >
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      m.role === "assistant" 
                        ? "bg-zinc-700 text-white" 
                        : "bg-[#e78a53] text-white"
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}
                {aiError && (
                  <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">
                    {aiError}
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <div className="p-6 border-t border-zinc-700">
                <div className="flex items-center gap-3">
                  <textarea
                    className="flex-1 min-h-[44px] max-h-[120px] bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder:text-zinc-400 resize-none focus:outline-none focus:border-[#e78a53] text-sm leading-relaxed px-3 py-2"
                    placeholder={currentUser ? "Ask YUKTI" : "Log in to chat with YUKTI"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!currentUser || aiLoading}
                  />
                  {/* Voice input button */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={!currentUser || aiLoading}
                    className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                      isListening 
                        ? "bg-red-500 hover:bg-red-600 text-white" 
                        : "bg-zinc-700 hover:bg-zinc-600 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                  <button
                    onClick={handleSendClick}
                    disabled={!currentUser || aiLoading || !inputValue.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e78a53] hover:bg-[#e78a53]/90 transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    {aiLoading ? "Thinking..." : "Send"}
                  </button>
                </div>
                {/* Voice output controls */}
                {isSpeaking && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#e78a53] rounded-full animate-pulse"></div>
                      <span>YUKTI is speaking...</span>
                    </div>
                    <button
                      onClick={stopSpeaking}
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
