import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Heart, Eye, MessageCircle, Share2, BarChart3, Activity, Calendar, Clock, Target, Zap } from 'lucide-react';

import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Heart, Eye, MessageCircle, Share2, BarChart3, Activity, Target, Zap } from 'lucide-react';

const StatisticsModal = ({ isOpen, onClose, user, polls, followersCount, followingCount }) => {
  const [activeTab, setActiveTab] = useState('contenido');

  if (!isOpen) return null;

  // Cálculos de métricas con lenguaje natural
  const totalPolls = polls?.length || 0;
  const totalVotes = polls?.reduce((sum, poll) => {
    return sum + (poll.options?.reduce((optSum, option) => optSum + (option.votes || 0), 0) || 0);
  }, 0) || 0;
  const totalLikes = polls?.reduce((sum, poll) => sum + (poll.likes_count || 0), 0) || 0;
  const totalShares = polls?.reduce((sum, poll) => sum + (poll.shares_count || 0), 0) || 0;
  const totalComments = polls?.reduce((sum, poll) => sum + (poll.comments_count || 0), 0) || 0;
  const totalInteractions = totalVotes + totalLikes + totalShares + totalComments;

  // Formatear números de manera amigable
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Generar tendencias simuladas (en una app real vendrían del backend)
  const generateTrend = () => Math.random() > 0.5 ? 'up' : 'down';
  const generateGrowth = () => Math.floor(Math.random() * 30) + 1;

  // Componente de métrica minimalista
  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, growth, color = 'blue' }) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-50 text-blue-600' :
          color === 'pink' ? 'bg-pink-50 text-pink-600' :
          color === 'green' ? 'bg-green-50 text-green-600' :
          color === 'purple' ? 'bg-purple-50 text-purple-600' :
          'bg-gray-50 text-gray-600'
        }`}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="w-3 h-3" strokeWidth={2} />
            )}
            {growth}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );

  // Tabs deslizables
  const tabs = [
    { id: 'contenido', label: 'Contenido' },
    { id: 'audiencia', label: 'Audiencia' },
    { id: 'actividad', label: 'Actividad' }
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      
      {/* Header móvil minimalista */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Tu impacto</h1>
          <p className="text-sm text-gray-500">@{user?.username}</p>
        </div>
        
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Navegación por pestañas horizontal */}
      <div className="flex overflow-x-auto bg-white px-6 py-4 border-b border-gray-100 hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        <div className="px-6 py-8 space-y-8">

          {/* Vista de Contenido */}
          {activeTab === 'contenido' && (
            <>
              {/* Resumen de creación */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Tu contenido</h2>
                  <span className="text-sm text-gray-500">últimos 7 días</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    icon={BarChart3}
                    title="Publicaciones"
                    value={totalPolls}
                    subtitle="Posts creados"
                    trend={generateTrend()}
                    growth={generateGrowth()}
                    color="blue"
                  />
                  <MetricCard
                    icon={Eye}
                    title="Alcance"
                    value={totalInteractions}
                    subtitle="Personas alcanzadas"
                    trend={generateTrend()}
                    growth={generateGrowth()}
                    color="purple"
                  />
                </div>
              </div>

              {/* Métricas de interacción */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Interacciones</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    icon={Heart}
                    title="Me gusta"
                    value={totalLikes}
                    subtitle="Corazones recibidos"
                    trend={generateTrend()}
                    growth={generateGrowth()}
                    color="pink"
                  />
                  <MetricCard
                    icon={MessageCircle}
                    title="Comentarios"
                    value={totalComments}
                    subtitle="Conversaciones iniciadas"
                    trend={generateTrend()}
                    growth={generateGrowth()}
                    color="green"
                  />
                </div>
              </div>

              {/* Momento del día más activo */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tu mejor momento</h3>
                    <p className="text-sm text-gray-500">Cuando tu audiencia está más activa</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-900">9:00 PM</p>
                      <p className="text-sm text-orange-700">Horario ideal para publicar</p>
                    </div>
                    <div className="text-4xl">🌟</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Vista de Audiencia */}
          {activeTab === 'audiencia' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Tu comunidad</h2>
                  <span className="text-sm text-gray-500">hoy</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    icon={Users}
                    title="Seguidores"
                    value={followersCount || 0}
                    subtitle="Personas que te siguen"
                    trend={generateTrend()}
                    growth={generateGrowth()}
                    color="blue"
                  />
                  <MetricCard
                    icon={Users}
                    title="Siguiendo"
                    value={followingCount || 0}
                    subtitle="Personas que sigues"
                    color="green"
                  />
                </div>
              </div>

              {/* Crecimiento de la audiencia */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Crecimiento</h3>
                    <p className="text-sm text-gray-500">Evolución de tu audiencia</p>
                  </div>
                </div>

                {/* Gráfico de barras minimalista */}
                <div className="space-y-4">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[20, 35, 28, 45, 38, 52, 60].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-green-600">+12</span> nuevos seguidores esta semana
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Vista de Actividad */}
          {activeTab === 'actividad' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Tu actividad</h2>
                  <span className="text-sm text-gray-500">esta semana</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <MetricCard
                    icon={Activity}
                    title="Índice de actividad"
                    value={Math.min(100, Math.floor((totalPolls * 15 + totalInteractions * 0.3)))}
                    subtitle="Basado en tu participación"
                    trend={generateTrend()}
                    growth={generateGrowth()}
                    color="purple"
                  />
                </div>
              </div>

              {/* Racha de actividad */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Racha actual</h3>
                    <p className="text-sm text-gray-500">Días consecutivos activo</p>
                  </div>
                </div>

                <div className="text-center bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6">
                  <div className="text-5xl mb-2">🔥</div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">
                    {Math.floor(Math.random() * 15) + 3} días
                  </p>
                  <p className="text-sm text-purple-700">¡Sigue así!</p>
                </div>
              </div>

              {/* Momentos destacados */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Momentos destacados</h3>
                <div className="space-y-3">
                  {[
                    { icon: '🏆', text: 'Tu mejor publicación obtuvo 87 interacciones', time: 'hace 2 días' },
                    { icon: '🎯', text: 'Alcanzaste 100 seguidores', time: 'hace 5 días' },
                    { icon: '⭐', text: 'Primera publicación viral', time: 'hace 1 semana' }
                  ].map((moment, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <span className="text-2xl">{moment.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{moment.text}</p>
                        <p className="text-xs text-gray-500">{moment.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StatisticsModal;

export default StatisticsModal;