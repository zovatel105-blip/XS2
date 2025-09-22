import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, Loader2, Instagram, Heart, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Google Icon Component for OAuth
const GoogleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const ModernAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    display_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de correo electrónico inválido';
    }
    
    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Register-specific validations
    if (!isLogin) {
      if (!formData.username.trim()) {
        newErrors.username = 'El nombre de usuario es requerido';
      } else if (formData.username.length < 3) {
        newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      }
      
      if (!formData.display_name.trim()) {
        newErrors.display_name = 'El nombre para mostrar es requerido';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      let result;
      
      if (isLogin) {
        // Login flow
        result = await login(formData.email, formData.password);
        
        if (result.success) {
          toast({
            title: "¡Bienvenido de vuelta!",
            description: `Hola ${result.user.display_name}, sesión iniciada correctamente.`,
          });
          // Redirect to feed
          navigate('/feed');
        } else {
          // Handle login errors
          handleAuthError(result.error);
        }
      } else {
        // Register flow
        result = await register({
          email: formData.email,
          username: formData.username,
          display_name: formData.display_name,
          password: formData.password
        });

        if (result.success) {
          toast({
            title: "¡Cuenta creada exitosamente!",
            description: `Bienvenido ${result.user.display_name}, tu cuenta ha sido registrada.`,
          });
          // Redirect to dashboard after successful registration
          navigate('/dashboard');
        } else {
          // Handle registration errors
          handleAuthError(result.error);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMsg = "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
      setErrors({ general: errorMsg });
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Handle authentication errors from backend
  const handleAuthError = (error) => {
    let errorMessage = error;
    
    // Map common backend errors to user-friendly messages
    if (error.toLowerCase().includes('incorrect email or password')) {
      errorMessage = 'Correo electrónico o contraseña incorrectos';
    } else if (error.toLowerCase().includes('user already exists') || error.toLowerCase().includes('email already registered')) {
      errorMessage = 'Este correo electrónico ya está registrado';
      setErrors({ email: errorMessage });
    } else if (error.toLowerCase().includes('username already exists')) {
      errorMessage = 'Este nombre de usuario ya está en uso';
      setErrors({ username: errorMessage });
    } else if (error.toLowerCase().includes('invalid email')) {
      errorMessage = 'Formato de correo electrónico inválido';
      setErrors({ email: errorMessage });
    } else {
      setErrors({ general: errorMessage });
    }
    
    toast({
      title: isLogin ? "Error al iniciar sesión" : "Error al registrarse",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Toggle between login and register
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      username: '',
      display_name: ''
    });
    setErrors({});
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-orange-200/25 to-pink-200/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Floating icons */}
        <div className="absolute top-16 right-20 text-pink-300/40 animate-bounce" style={{animationDelay: '0.5s'}}>
          <Heart className="w-6 h-6" />
        </div>
        <div className="absolute bottom-20 left-20 text-blue-300/40 animate-bounce" style={{animationDelay: '1.5s'}}>
          <Camera className="w-5 h-5" />
        </div>
      </div>

      {/* Main content container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-sm mx-auto">
          
          {/* App Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
              <span className="text-white text-3xl font-bold">V</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isLogin ? 'Bienvenido de vuelta a VotaTok' : 'Únete a la comunidad VotaTok'}
            </p>
          </div>

          {/* Auth Form Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* General Error Alert */}
              {errors.general && (
                <div className="p-4 bg-red-50/80 border border-red-200/60 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700 text-sm leading-relaxed">{errors.general}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50/80 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white hover:bg-gray-50 transition-all duration-200 ${
                      errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                    }`}
                    placeholder="ejemplo@correo.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Register-only fields */}
              {!isLogin && (
                <>
                  {/* Username Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">
                      Nombre de Usuario
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50/80 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white hover:bg-gray-50 transition-all duration-200 ${
                          errors.username ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                        }`}
                        placeholder="usuario123"
                        disabled={loading}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  {/* Display Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">
                      Nombre para Mostrar
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                      <input
                        type="text"
                        name="display_name"
                        value={formData.display_name}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50/80 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white hover:bg-gray-50 transition-all duration-200 ${
                          errors.display_name ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                        }`}
                        placeholder="Tu Nombre"
                        disabled={loading}
                      />
                    </div>
                    {errors.display_name && (
                      <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.display_name}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-14 py-4 bg-gray-50/80 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:bg-white hover:bg-gray-50 transition-all duration-200 ${
                      errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs ml-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-2xl font-semibold hover:from-gray-800 hover:to-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading 
                  ? (isLogin ? 'Iniciando sesión...' : 'Creando cuenta...') 
                  : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
                }
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium px-2">o continúa con</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => {
                  const currentUrl = window.location.origin;
                  const redirectUrl = `${currentUrl}/profile`;
                  const googleAuthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                  window.location.href = googleAuthUrl;
                }}
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Continuar con Google</span>
              </button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                {' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="text-gray-900 hover:text-gray-700 font-semibold transition-colors disabled:opacity-50 underline decoration-2 underline-offset-2 hover:decoration-gray-400"
                >
                  {isLogin ? 'Crear una' : 'Iniciar sesión'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
              Al continuar, aceptas nuestros{' '}
              <span className="text-gray-700 font-medium">términos de servicio</span>{' '}
              y{' '}
              <span className="text-gray-700 font-medium">política de privacidad</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAuthPage;