"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
        } else {
          // Redirect to login if no user
          window.location.href = "/login"
        }
      } catch (error) {
        console.error("Error getting user:", error)
        window.location.href = "/login"
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-[#e78a53]/30 border-t-[#e78a53] rounded-full animate-spin" />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-[#e78a53] font-bold text-xl">
                YuktiBharat
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-zinc-300">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to Your Dashboard
            </h1>
            <p className="text-zinc-400 text-lg">
              Manage your learning journey with YuktiBharat
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-[#e78a53]/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Profile</h3>
                  <p className="text-zinc-400 text-sm">Manage and<br></br>Edit your account</p>
                </div>
              </div>
              {/* <p className="text-zinc-300 text-sm mb-4">
                Update your profile information and preferences
              </p> */}
              <Button className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white">
                Edit Profile
              </Button>
            </motion.div>

            {/* Courses Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-[#e78a53]/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Assessment Status</h3>
                  <p className="text-zinc-400 text-sm">Discover the career that suits you best. <br /> Take the quiz to begin your journey.</p>
                </div>
              </div>
              {/* <p className="text-zinc-300 text-sm mb-4">
                check now!!!
              </p> */}
              <Button className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white">
                Take Assessment
              </Button>
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-[#e78a53]/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#e78a53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Your Recommended Careers</h3>
                  <p className="text-zinc-400 text-sm">Based on your responses, here are <br /> the top career paths tailored to you.</p>
                </div>
              </div>
              {/* <p className="text-zinc-300 text-sm mb-4">
                Monitor your learning progress and achievements
              </p> */}
              <Button className="w-full bg-[#e78a53] hover:bg-[#e78a53]/90 text-white">
                View Reccomendations
              </Button>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                Browse Courses
              </Button>
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                Join Community
              </Button>
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                Get Help
              </Button>
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                Settings
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
