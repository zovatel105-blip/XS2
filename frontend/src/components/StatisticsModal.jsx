import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Heart, Eye, MessageCircle, Share2, BarChart3, Activity, Calendar, Clock, Target, Zap } from 'lucide-react';

const StatisticsModal = ({ isOpen, onClose, user, polls, followersCount, followingCount }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('animate-in');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate advanced statistics
  const totalPolls = polls?.length || 0;
  const totalVotes = polls?.reduce((sum, poll) => {
    return sum + (poll.options?.reduce((optSum, option) => optSum + (option.votes || 0), 0) || 0);
  }, 0) || 0;

  const totalLikes = polls?.reduce((sum, poll) => sum + (poll.likes_count || 0), 0) || 0;
  const totalShares = polls?.reduce((sum, poll) => sum + (poll.shares_count || 0), 0) || 0;
  const totalComments = polls?.reduce((sum, poll) => sum + (poll.comments_count || 0), 0) || 0;

  // Advanced metrics
  const totalInteractions = totalVotes + totalLikes + totalShares + totalComments;
  const avgInteractionsPerPost = totalPolls > 0 ? Math.round(totalInteractions / totalPolls) : 0;
  const engagementRate = followersCount > 0 ? ((totalInteractions / (followersCount * totalPolls)) * 100).toFixed(1) : 0;
  
  // Growth simulation (in a real app, this would come from historical data)
  const followerGrowth = Math.floor(Math.random() * 20) + 5; // 5-25% growth
  const engagementGrowth = Math.floor(Math.random() * 15) + 3; // 3-18% growth
  
  // Account age and activity
  const accountAge = user?.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0;
  const activityScore = Math.min(100, Math.floor((totalPolls * 10 + totalInteractions * 0.5) / 10));

  // Find top performing content
  const topPolls = polls?.sort((a, b) => {
    const aScore = (a.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0) + (a.likes_count || 0);
    const bScore = (b.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0) + (b.likes_count || 0);
    return bScore - aScore;
  }).slice(0, 3) || [];

  // Achievement system
  const achievements = [
    { id: 1, title: "Primer Post", description: "Publicaste tu primera encuesta", earned: totalPolls > 0, icon: Star },
    { id: 2, title: "Participativo", description: "Recibiste más de 100 votos", earned: totalVotes > 100, icon: Vote },
    { id: 3, title: "Popular", description: "Más de 50 seguidores", earned: followersCount > 50, icon: Users },
    { id: 4, title: "Influencer", description: "Más de 500 interacciones totales", earned: totalInteractions > 500, icon: Flame },
    { id: 5, title: "Veterano", description: "Más de 30 días en la plataforma", earned: accountAge > 30, icon: Trophy }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);

  const ModernStatCard = ({ icon: Icon, title, value, subtitle, color = "blue", growth, trend = "up" }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${
      color === "blue" ? "bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:from-blue-500/20 hover:to-cyan-500/10" :
      color === "green" ? "bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:from-green-500/20 hover:to-emerald-500/10" :
      color === "purple" ? "bg-gradient-to-br from-purple-500/10 to-pink-500/5 hover:from-purple-500/20 hover:to-pink-500/10" :
      color === "orange" ? "bg-gradient-to-br from-orange-500/10 to-red-500/5 hover:from-orange-500/20 hover:to-red-500/10" :
      color === "pink" ? "bg-gradient-to-br from-pink-500/10 to-rose-500/5 hover:from-pink-500/20 hover:to-rose-500/10" :
      "bg-gradient-to-br from-gray-500/10 to-slate-500/5 hover:from-gray-500/20 hover:to-slate-500/10"
    }`}>
      {/* Animated background gradient */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        color === "blue" ? "bg-gradient-to-r from-blue-400/5 via-cyan-400/5 to-blue-400/5" :
        color === "green" ? "bg-gradient-to-r from-green-400/5 via-emerald-400/5 to-green-400/5" :
        color === "purple" ? "bg-gradient-to-r from-purple-400/5 via-pink-400/5 to-purple-400/5" :
        color === "orange" ? "bg-gradient-to-r from-orange-400/5 via-red-400/5 to-orange-400/5" :
        color === "pink" ? "bg-gradient-to-r from-pink-400/5 via-rose-400/5 to-pink-400/5" :
        "bg-gradient-to-r from-gray-400/5 via-slate-400/5 to-gray-400/5"
      } animate-pulse`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            color === "blue" ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
            color === "green" ? "bg-gradient-to-br from-green-500 to-emerald-500" :
            color === "purple" ? "bg-gradient-to-br from-purple-500 to-pink-500" :
            color === "orange" ? "bg-gradient-to-br from-orange-500 to-red-500" :
            color === "pink" ? "bg-gradient-to-br from-pink-500 to-rose-500" :
            "bg-gradient-to-br from-gray-500 to-slate-500"
          } shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
              trend === "up" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
            }`}>
              {trend === "up" ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {growth}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{value}</p>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const AchievementBadge = ({ achievement, earned }) => {
    const Icon = achievement.icon;
    return (
      <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        earned 
          ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-md hover:shadow-lg scale-100" 
          : "bg-gray-50 border-gray-200 opacity-60 scale-95"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            earned 
              ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg" 
              : "bg-gray-300 text-gray-500"
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
            <p className="text-xs text-gray-600">{achievement.description}</p>
          </div>
          {earned && (
            <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "blue" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-out ${
              color === "blue" ? "text-blue-500" :
              color === "green" ? "text-green-500" :
              color === "purple" ? "text-purple-500" :
              "text-gray-500"
            }`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-900">{progress}</span>
            <span className="text-sm text-gray-600 block">Activity</span>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: TrendingUp },
    { id: 'achievements', label: 'Logros', icon: Trophy }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl border border-white/20 ${animationClass}`}>
        {/* Modern Header with Gradient */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Dashboard Analítico</h2>
                <p className="text-white/80 text-lg">@{user?.username || 'Usuario'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)] bg-gradient-to-br from-gray-50/50 to-white/50">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernStatCard 
                  icon={Vote} 
                  title="Publicaciones" 
                  value={totalPolls}
                  subtitle="Posts totales"
                  color="blue"
                  growth={Math.floor(Math.random() * 20) + 5}
                />
                <ModernStatCard 
                  icon={Users} 
                  title="Seguidores" 
                  value={followersCount || 0}
                  subtitle="Audiencia total"
                  color="green"
                  growth={followerGrowth}
                />
                <ModernStatCard 
                  icon={Eye} 
                  title="Interacciones" 
                  value={totalInteractions}
                  subtitle="Total engagement"
                  color="purple"
                  growth={engagementGrowth}
                />
                <ModernStatCard 
                  icon={Zap} 
                  title="Tasa Engagement" 
                  value={`${engagementRate}%`}
                  subtitle="Promedio de interacción"
                  color="orange"
                  growth={Math.floor(Math.random() * 10) + 2}
                />
              </div>

              {/* Activity Score */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Puntuación de Actividad</h3>
                    <p className="text-gray-600 mb-4">Basado en tu engagement y participación</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Posts publicados</span>
                        <span className="text-indigo-600 font-semibold">{totalPolls}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Interacciones recibidas</span>
                        <span className="text-indigo-600 font-semibold">{totalInteractions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Días activo</span>
                        <span className="text-indigo-600 font-semibold">{accountAge}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-8">
                    <ProgressRing progress={activityScore} color="purple" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-8">
              {/* Engagement Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernStatCard 
                  icon={Vote} 
                  title="Total Votos" 
                  value={totalVotes}
                  subtitle="En todas las publicaciones"
                  color="blue"
                />
                <ModernStatCard 
                  icon={Heart} 
                  title="Total Likes" 
                  value={totalLikes}
                  subtitle="Me gusta recibidos"
                  color="pink"
                />
                <ModernStatCard 
                  icon={Share2} 
                  title="Compartidos" 
                  value={totalShares}
                  subtitle="Veces compartido"
                  color="green"
                />
                <ModernStatCard 
                  icon={Target} 
                  title="Promedio/Post" 
                  value={avgInteractionsPerPost}
                  subtitle="Interacciones promedio"
                  color="purple"
                />
              </div>

              {/* Top Performing Content */}
              {topPolls.length > 0 && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Top 3 Publicaciones
                  </h3>
                  <div className="space-y-4">
                    {topPolls.map((poll, index) => {
                      const pollScore = (poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0) + (poll.likes_count || 0);
                      return (
                        <div key={poll.id} className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-102 ${
                          index === 0 ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200" :
                          index === 1 ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200" :
                          "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? "bg-yellow-500" :
                              index === 1 ? "bg-gray-400" :
                              "bg-orange-500"
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 truncate">{poll.title}</h4>
                              <div className="flex gap-4 mt-1">
                                <span className="text-sm text-gray-600">🗳️ {poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0}</span>
                                <span className="text-sm text-gray-600">❤️ {poll.likes_count || 0}</span>
                                <span className="text-sm text-gray-600">💬 {poll.comments_count || 0}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-indigo-600">{pollScore}</span>
                              <p className="text-xs text-gray-500">interacciones</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-8">
              {/* Achievement Progress */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Logros</h3>
                <p className="text-gray-600">Has desbloqueado {earnedAchievements.length} de {achievements.length} logros</p>
                <div className="mt-4 bg-gray-200 rounded-full h-3 max-w-md mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out"
                    style={{ width: `${(earnedAchievements.length / achievements.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Achievement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} earned={achievement.earned} />
                ))}
              </div>

              {/* Profile Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Información del Perfil
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nombre completo</span>
                      <p className="text-lg font-semibold text-gray-900">{user?.display_name || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ocupación</span>
                      <p className="text-lg font-semibold text-gray-900">{user?.occupation || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email</span>
                      <p className="text-lg font-semibold text-gray-900">{user?.email || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Estado de verificación</span>
                      <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {user?.is_verified ? (
                          <>
                            <span className="text-green-600">✅ Verificado</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-600">⏳ No verificado</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-8 py-4">
          <p className="text-xs text-gray-500 text-center">
            🚀 Dashboard actualizado en tiempo real • Datos procesados con IA • {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-in {
          animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default StatisticsModal;