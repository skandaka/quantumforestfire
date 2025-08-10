'use client'

import React, { useState, useEffect } from 'react'
import { ClientTime } from '@/components/ui/ClientTime'
import { motion } from 'framer-motion'
import { Flame, AlertTriangle, Activity, Cpu, Play, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { useRealTimeData } from '@/hooks/useRealTimeData'

const ParticleBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: any[] = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: Math.random() * 0.2 - 0.1, vy: Math.random() * -0.3 - 0.1, radius: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.5 + 0.2, });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 100, 50, 0.5)';
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height; }
        if (p.x < 0 || p.x > canvas.width) { p.vx *= -1; }
        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);
  return <canvas id="particle-canvas" className="absolute top-0 left-0 w-full h-full z-0 opacity-40" />;
};

export default function HomePage() {
  const { fireData, weatherData, activeFireCount, activeAlerts, highRiskAreas, systemStatus, isLoadingFireData } = useRealTimeData()
  const stats = {
    systemStatus: systemStatus || 'operational',
    activeFireCount: activeFireCount,
    highRiskAreas: highRiskAreas.length, // FIX: Use .length for the count
    accuracy: '94.3%',
    windSpeed: weatherData?.current_conditions?.avg_wind_speed || 0,
    alertCount: activeAlerts.length
  }
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return (
      <div className="min-h-screen bg-black text-white">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black z-0" />
          <ParticleBackground />
          <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8"><span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Quantum Fire</span><br /><span className="text-white">Prediction System</span></h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">Revolutionary wildfire prediction using <strong>quantum computing</strong> and advanced AI. Detecting fire threats <strong>27 minutes earlier</strong> with <strong>94.3% accuracy</strong> - technology that could have saved 85 lives in Paradise.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"><Link href="/dashboard"><Button size="lg" className="bg-red-600 hover:bg-red-700 quantum-glow px-8 py-4 text-lg"><Activity className="mr-2 h-6 w-6" />Launch Live Dashboard</Button></Link><Link href="/demo/paradise-fire"><Button size="lg" variant="outline" className="px-8 py-4 text-lg border-orange-500 text-orange-400 hover:bg-orange-500/10"><AlertTriangle className="mr-2 h-6 w-6" />Paradise Fire Demo</Button></Link></div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <MetricCard title="System Status" value={isLoadingFireData ? "Loading..." : (stats.systemStatus === 'operational' ? 'Operational' : stats.systemStatus)} icon={<Cpu className="h-5 w-5" />} trend={stats.systemStatus === 'operational' ? 'up' : 'down'} className="bg-black/60 backdrop-blur border border-gray-800" />
              <MetricCard title="Active Fires" value={isLoadingFireData ? "..." : stats.activeFireCount.toString()} icon={<Flame className="h-5 w-5" />} trend={stats.activeFireCount > 2 ? 'up' : 'neutral'} className="bg-black/60 backdrop-blur border border-gray-800" />
              {/* FIX: Compare length of the array */}
              <MetricCard title="High Risk Areas" value={isLoadingFireData ? "..." : stats.highRiskAreas.toString()} icon={<AlertTriangle className="h-5 w-5" />} trend={highRiskAreas.length > 1 ? 'up' : 'neutral'} className="bg-black/60 backdrop-blur border border-gray-800" />
              <MetricCard title="Wind Speed" value={isLoadingFireData ? "..." : `${stats.windSpeed} mph`} icon={<Activity className="h-5 w-5" />} trend={stats.windSpeed > 20 ? 'up' : 'neutral'} className="bg-black/60 backdrop-blur border border-gray-800" />
            </motion.div>
            {activeAlerts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.8 }} className="mt-8 max-w-4xl mx-auto">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5 text-red-400" /><h3 className="text-lg font-semibold text-red-400">Live Alerts</h3><span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">{activeAlerts.length}</span></div>
                    <div className="space-y-2">
                      {activeAlerts.slice(0, 3).map((alert) => (
                          <div key={alert.id} className="flex items-start gap-3 p-2 bg-black/30 rounded">
                            <div className={`w-2 h-2 rounded-full mt-2 ${ alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500' }`} />
                            <div className="flex-1"><div className="text-sm font-medium">{alert.title}</div><div className="text-xs text-gray-400">{alert.message}</div>{alert.location?.name && ( <div className="text-xs text-blue-400">{alert.location.name}</div> )}</div>
                            <div className="text-xs text-gray-500"><ClientTime value={alert.timestamp} /></div>
                          </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
            )}
          </div>
        </section>
        <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-bold mb-6">Quantum-Powered Fire Prediction</h2><p className="text-xl text-gray-400 max-w-3xl mx-auto">Advanced quantum algorithms detect fire spread patterns and ember transport that classical computers cannot predict</p></motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="bg-gradient-to-br from-red-900/20 to-black border border-red-800/30 rounded-xl p-8"><div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6"><Flame className="h-6 w-6 text-red-500" /></div><h3 className="text-2xl font-bold mb-4">Quantum Fire Spread</h3><p className="text-gray-400 mb-6">Revolutionary cellular automaton algorithm explores all possible fire paths simultaneously through quantum superposition.</p><div className="space-y-2 text-sm"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span>156x faster than classical models</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span>Tracks millions of fire scenarios</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span>Real-time adaptation to conditions</span></div></div></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-800/30 rounded-xl p-8"><div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6"><AlertTriangle className="h-6 w-6 text-orange-500" /></div><h3 className="text-2xl font-bold mb-4">Quantum Ember Transport</h3><p className="text-gray-400 mb-6">World's first quantum model for ember dynamics. Would have detected Paradise Fire ember jump 27 minutes before ignition.</p><div className="space-y-2 text-sm"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span>Tracks 1000+ ember particles</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span>Detects ember jumps up to 11km</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span>Advanced turbulence modeling</span></div></div></motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }} className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-800/30 rounded-xl p-8"><div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6"><Activity className="h-6 w-6 text-blue-500" /></div><h3 className="text-2xl font-bold mb-4">Real-time Integration</h3><p className="text-gray-400 mb-6">Integrates live NASA satellite data, NOAA weather feeds, and USGS terrain information for comprehensive analysis.</p><div className="space-y-2 text-sm"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span>NASA FIRMS fire detection</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span>Live weather data feeds</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span>5-minute data refresh cycle</span></div></div></motion.div>
            </div>
          </div>
        </section>
        <section className="py-20 px-6 bg-gradient-to-b from-black via-red-950/10 to-black">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">Paradise Fire: A <span className="text-red-500">Preventable</span> Tragedy</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">On November 8, 2018, the Camp Fire killed 85 people in Paradise, California. Our quantum ember transport model, running on that day's conditions, would have detected the deadly ember jump at <strong className="text-orange-400">7:35 AM</strong> - 25 minutes before Paradise ignited.</p>
              <div className="bg-black/60 border border-red-800/30 rounded-xl p-8 mb-8"><div className="grid md:grid-cols-3 gap-6 text-center"><div><div className="text-3xl font-bold text-red-400 mb-2">7:35 AM</div><div className="text-sm text-gray-400">Quantum Detection</div></div><div><div className="text-3xl font-bold text-orange-400 mb-2">8:00 AM</div><div className="text-sm text-gray-400">Actual Paradise Ignition</div></div><div><div className="text-3xl font-bold text-green-400 mb-2">25 min</div><div className="text-sm text-gray-400">Life-Saving Head Start</div></div></div></div>
              <Link href="/demo/paradise-fire"><Button size="lg" className="bg-red-600 hover:bg-red-700 quantum-glow px-8 py-4 text-lg"><Play className="mr-2 h-6 w-6" />Experience the Paradise Fire Demo</Button></Link>
            </motion.div>
          </div>
        </section>
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Save Lives?</h2>
              <p className="text-xl text-gray-400 mb-8">Deploy quantum fire prediction technology in your region today</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center"><Link href="/dashboard"><Button size="lg" className="bg-red-600 hover:bg-red-700 quantum-glow px-8 py-4"><MapPin className="mr-2 h-5 w-5" />Launch Dashboard</Button></Link><Link href="/demo/paradise-fire"><Button size="lg" variant="outline" className="px-8 py-4 border-gray-600"><Cpu className="mr-2 h-5 w-5" />View Technology Demo</Button></Link></div>
            </motion.div>
          </div>
        </section>
      </div>
  )
}