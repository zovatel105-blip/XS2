import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Stars, Zap, Heart, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

// Google Icon Component
const GoogleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LoginPage = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [emailValid, setEmailValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time password strength checker
  const checkPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length >= 6 && /(?=.*[a-z])(?=.*[A-Z])/.test(password)) return 'strong';
    if (password.length >= 6) return 'medium';
    return 'weak';
  };

  // Handle email change with real-time validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value.length > 0) {
      setEmailValid(validateEmail(value));
    } else {
      setEmailValid(null);
    }
  };

  // Handle password change with strength indicator
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  // Google OAuth login
  const handleGoogleLogin = () => {
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/profile`;
    const googleAuthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = googleAuthUrl;
  };

  // Generate floating particles for background animation
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 3 + Math.random() * 4,
          size: 2 + Math.random() * 4
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const errors = {};
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast({
          title: "¡Bienvenido de vuelta!",
          description: `Hola ${result.user.display_name}, listo para continuar tu racha?`,
        });
      } else {
        toast({
          title: "Error al iniciar sesión",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-200/35 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-gray-400/60 rounded-full animate-bounce"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
          />
        ))}
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 left-10 w-4 h-4 border border-gray-300/50 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-20 right-10 w-6 h-6 border border-purple-300/50 rotate-12 animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-blue-300/50 rounded-full animate-ping"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with Enhanced Animation */}
        <div className="text-center mb-8 animate-fadeInUp">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 animate-slideInLeft">
            ¡Bienvenido de vuelta!
          </h1>
          <p className="text-gray-600 text-lg animate-slideInRight">Inicia sesión para acceder a tu cuenta</p>
        </div>

        {/* Enhanced Login Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-500 animate-fadeInUp relative overflow-hidden">
          {/* Form Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-indigo-50/50 rounded-3xl blur-xl opacity-50"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative">
            {/* Enhanced Email Field */}
            <div className="group">
              <label className="block text-gray-700 text-sm font-medium mb-3 transition-all duration-300 group-hover:text-gray-900">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-4 w-5 h-5 transition-all duration-300 ${
                  emailValid === true ? 'text-green-500' : 
                  emailValid === false ? 'text-red-500' : 
                  'text-gray-500 group-hover:text-gray-700 group-focus-within:text-purple-500'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50/80 border rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-gray-50 transition-all duration-300 backdrop-blur-sm ${
                    emailValid === true ? 'border-green-300 bg-green-50/50' :
                    emailValid === false ? 'border-red-300 bg-red-50/50' :
                    'border-gray-200 focus:border-purple-400'
                  }`}
                  placeholder="tu@email.com"
                  required
                />
                {emailValid === true && (
                  <CheckCircle className="absolute right-4 top-4 w-5 h-5 text-green-500" />
                )}
                {emailValid === false && (
                  <AlertTriangle className="absolute right-4 top-4 w-5 h-5 text-red-500" />
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-100/30 to-pink-100/30 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-500 flex items-center animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Enhanced Password Field */}
            <div className="group">
              <label className="block text-gray-700 text-sm font-medium mb-3 transition-all duration-300 group-hover:text-gray-900">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500 transition-all duration-300 group-hover:text-gray-700 group-focus-within:text-purple-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-12 pr-14 py-4 bg-gray-50/80 border rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:bg-gray-50 transition-all duration-300 backdrop-blur-sm ${
                    validationErrors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-purple-400'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 focus:text-purple-500 transition-all duration-300 transform hover:scale-110"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-100/30 to-pink-100/30 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-500 flex items-center animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {validationErrors.password}
                </p>
              )}
              {passwordStrength && (
                <div className="mt-2">
                  <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                    passwordStrength === 'weak' ? 'text-red-600 bg-red-100' :
                    passwordStrength === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                    'text-green-600 bg-green-100'
                  }`}>
                    <Shield className="w-3 h-3 mr-1" />
                    Seguridad: {passwordStrength === 'weak' ? 'Débil' : passwordStrength === 'medium' ? 'Media' : 'Fuerte'}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {loading ? (
                <div className="flex items-center justify-center relative z-10">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  <span className="animate-pulse">Iniciando sesión...</span>
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2 animate-pulse" />
                  Iniciar Sesión
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="mx-4 text-gray-500 text-sm font-medium">o continúa con</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 px-8 rounded-2xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 relative overflow-hidden group transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center relative z-10">
                <GoogleIcon className="w-5 h-5 mr-3" />
                <span>Continuar con Google</span>
              </div>
            </button>
          </form>

          {/* Enhanced Switch to Register */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-purple-600 hover:text-purple-800 font-medium transition-all duration-300 hover:underline transform hover:scale-105 inline-block"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>

        {/* Enhanced Features Preview */}
        <div className="mt-10 text-center animate-fadeInUp">
          <p className="text-gray-500 text-sm mb-6">Únete a la mejor plataforma social:</p>
          <div className="flex justify-center space-x-8">
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-3 mx-auto backdrop-blur-sm border border-gray-200 group-hover:bg-purple-200/80 group-hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <span className="text-2xl animate-bounce group-hover:animate-pulse">🏆</span>
              </div>
              <span className="text-gray-600 text-sm font-medium group-hover:text-gray-800 transition-colors duration-300">Logros</span>
            </div>
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-r from-pink-100 to-red-100 rounded-2xl flex items-center justify-center mb-3 mx-auto backdrop-blur-sm border border-gray-200 group-hover:bg-pink-200/80 group-hover:border-pink-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <span className="text-2xl animate-bounce group-hover:animate-pulse" style={{animationDelay: '0.2s'}}>💬</span>
              </div>
              <span className="text-gray-600 text-sm font-medium group-hover:text-gray-800 transition-colors duration-300">Chat</span>
            </div>
            <div className="text-center group transform hover:scale-110 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-3 mx-auto backdrop-blur-sm border border-gray-200 group-hover:bg-blue-200/80 group-hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <span className="text-2xl animate-bounce group-hover:animate-pulse" style={{animationDelay: '0.4s'}}>🔥</span>
              </div>
              <span className="text-gray-600 text-sm font-medium group-hover:text-gray-800 transition-colors duration-300">Rachas</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Hearts Animation */}
      <div className="absolute top-10 left-10 animate-ping">
        <Heart className="w-4 h-4 text-pink-400/60" />
      </div>
      <div className="absolute bottom-20 left-1/4 animate-pulse">
        <Stars className="w-5 h-5 text-purple-400/50" />
      </div>
    </div>
  );
};

const RegisterPage = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    display_name: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [emailValid, setEmailValid] = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);
  const { register } = useAuth();
  const { toast } = useToast();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'strong';
    if (password.length >= 6) return 'medium';
    return 'weak';
  };

  // Google OAuth registration
  const handleGoogleSignUp = () => {
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/profile`;
    const googleAuthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = googleAuthUrl;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    if (name === 'email') {
      setEmailValid(value.length > 0 ? validateEmail(value) : null);
    } else if (name === 'username') {
      setUsernameValid(value.length > 0 ? validateUsername(value) : null);
    } else if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
      if (formData.confirmPassword) {
        setPasswordMatch(value === formData.confirmPassword);
      }
    } else if (name === 'confirmPassword') {
      setPasswordMatch(formData.password === value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const errors = {};
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!validateUsername(formData.username)) {
      errors.username = 'Username must be at least 3 characters and contain only letters, numbers, and underscores';
    }
    if (formData.display_name.trim().length < 2) {
      errors.display_name = 'Display name must be at least 2 characters';
    }
    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        email: formData.email,
        username: formData.username,
        display_name: formData.display_name,
        password: formData.password
      });

      if (result.success) {
        toast({
          title: "¡Bienvenido!",
          description: `${result.user.display_name}, tu cuenta ha sido creada exitosamente`,
        });
      } else {
        toast({
          title: "Error al registrarse",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center p-4 relative">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 left-10 w-4 h-4 border border-gray-300/40 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-20 right-10 w-6 h-6 border border-purple-300/40 rotate-12 animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-blue-300/50 rounded-full animate-ping"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Únete ahora!</h1>
          <p className="text-gray-600">Crea tu cuenta y descubre nuevas experiencias</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:bg-white/90 hover:shadow-2xl transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 hover:bg-gray-50 transition-all duration-300"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Nombre de usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 hover:bg-gray-50 transition-all duration-300"
                  placeholder="usuario123"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="Solo letras, números y guiones bajos"
                />
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Nombre para mostrar
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 hover:bg-gray-50 transition-all duration-300"
                  placeholder="Tu Nombre"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 hover:bg-gray-50 transition-all duration-300"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:text-purple-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 hover:bg-gray-50 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="mx-4 text-gray-500 text-sm font-medium">o regístrate con</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center">
                <GoogleIcon className="w-5 h-5 mr-3" />
                <span>Continuar con Google</span>
              </div>
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors duration-300 hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginPage onSwitchToRegister={() => setIsLogin(false)} />
  ) : (
    <RegisterPage onSwitchToLogin={() => setIsLogin(true)} />
  );
};

export default AuthPage;