import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    display_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, register, loginLoading, registrationLoading } = useAuth();
  const navigate = useNavigate();
  const loading = loginLoading || registrationLoading;

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Contraseña requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    
    if (!isLogin) {
      if (!formData.username.trim()) {
        newErrors.username = 'Usuario requerido';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Mínimo 3 caracteres';
      }
      
      if (!formData.display_name.trim()) {
        newErrors.display_name = 'Nombre requerido';
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
    
    if (!validateForm()) return;
    
    setErrors({});

    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register({
          email: formData.email,
          username: formData.username,
          display_name: formData.display_name,
          password: formData.password
        });
      }

      if (result.success) {
        navigate('/feed');
      } else {
        handleAuthError(result.error);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: "Error inesperado. Intenta de nuevo." });
    }
  };

  // Handle authentication errors
  const handleAuthError = (error) => {
    let errorMessage = error;
    
    if (error.toLowerCase().includes('incorrect email or password')) {
      errorMessage = 'Email o contraseña incorrectos';
    } else if (error.toLowerCase().includes('user already exists') || error.toLowerCase().includes('email already registered')) {
      errorMessage = 'Email ya registrado';
      setErrors({ email: errorMessage });
      return;
    } else if (error.toLowerCase().includes('username already exists')) {
      errorMessage = 'Usuario ya existe';
      setErrors({ username: errorMessage });
      return;
    }
    
    setErrors({ general: errorMessage });
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 md:px-6">
      {/* Background geometric elements - Hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-0 left-0 w-32 h-32 border border-gray-100 rotate-45 -translate-x-16 -translate-y-16" />
        <div className="absolute top-20 right-10 w-16 h-16 border border-gray-200 rounded-full" />
        <div className="absolute bottom-20 left-20 w-24 h-1 bg-black" />
        <div className="absolute bottom-10 right-1/4 w-1 h-20 bg-gray-300" />
      </div>

      <div className="w-full max-w-md md:max-w-lg relative z-10">
        
        {/* Header - Responsive design */}
        <div className="text-center mb-8 md:mb-12">
          {/* Logo - Instagram style gradient on mobile */}
          <div className="inline-flex items-center justify-center mb-10 md:mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </div>
          {/* Title - Hidden on mobile for Instagram style */}
          <h1 className="hidden md:block text-3xl font-bold text-black mb-2">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="hidden md:block text-gray-600">
            {isLogin ? 'Accede a tu cuenta' : 'Únete a nosotros'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Error */}
          {errors.general && (
            <div className="p-4 border border-black bg-gray-50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
              <span className="text-black text-sm">{errors.general}</span>
            </div>
          )}

          {/* Email Field - Instagram style */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black hidden md:block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hidden md:block" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full md:pl-10 px-4 py-3 border text-sm md:text-base text-black placeholder-gray-400 bg-gray-50 md:bg-white rounded-md md:rounded-none focus:outline-none focus:border-purple-600 md:focus:border-black transition-colors ${
                  errors.email ? 'border-red-500' : 'border-gray-300 md:border-gray-200'
                }`}
                placeholder="username, email or mobile number"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>

          {/* Register-only fields */}
          {!isLogin && (
            <>
              {/* Username Field - Instagram style */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-black hidden md:block">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hidden md:block" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full md:pl-10 px-4 py-3 border text-sm md:text-base text-black placeholder-gray-400 bg-gray-50 md:bg-white rounded-md md:rounded-none focus:outline-none focus:border-purple-600 md:focus:border-black transition-colors ${
                      errors.username ? 'border-red-500' : 'border-gray-300 md:border-gray-200'
                    }`}
                    placeholder="username"
                    disabled={loading}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs">{errors.username}</p>
                )}
              </div>

              {/* Display Name Field - Instagram style */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-black hidden md:block">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hidden md:block" />
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className={`w-full md:pl-10 px-4 py-3 border text-sm md:text-base text-black placeholder-gray-400 bg-gray-50 md:bg-white rounded-md md:rounded-none focus:outline-none focus:border-purple-600 md:focus:border-black transition-colors ${
                      errors.display_name ? 'border-red-500' : 'border-gray-300 md:border-gray-200'
                    }`}
                    placeholder="Full Name"
                    disabled={loading}
                  />
                </div>
                {errors.display_name && (
                  <p className="text-red-500 text-xs">{errors.display_name}</p>
                )}
              </div>
            </>
          )}

          {/* Password Field - Instagram style */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black hidden md:block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hidden md:block" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full md:pl-10 px-4 pr-12 py-3 border text-sm md:text-base text-black placeholder-gray-400 bg-gray-50 md:bg-white rounded-md md:rounded-none focus:outline-none focus:border-purple-600 md:focus:border-black transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-300 md:border-gray-200'
                }`}
                placeholder="Password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 md:hover:text-black transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password - Mobile only, Instagram style */}
          {isLogin && (
            <div className="text-right md:hidden -mt-2">
              <button
                type="button"
                className="text-sm text-purple-600 font-semibold hover:text-purple-800 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button - Purple on mobile, Black on desktop */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 md:bg-black text-white py-3.5 md:py-4 font-semibold rounded-lg md:rounded-none hover:bg-purple-700 md:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600 md:focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (isLogin ? 'Iniciando...' : 'Creando...') 
              : (isLogin ? 'Log in' : 'Sign up')
            }
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o</span>
            </div>
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
            className="w-full border-2 border-black text-black py-4 font-medium hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
            </svg>
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
              className="text-black font-medium hover:underline transition-colors disabled:opacity-50"
            >
              {isLogin ? 'Crear una' : 'Iniciar sesión'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-xs">
            Al continuar, aceptas nuestros términos y política de privacidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;