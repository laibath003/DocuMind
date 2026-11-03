
import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

const AuthPage = () => {
  const { signIn, signUp } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')
    setMessage('')

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage(
          'Account created! Check your email for a confirmation link if required.'
        )
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-xl shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">
            DocuMind<span className="text-[#E63946]">.</span>
          </h1>

          <p className="text-sm text-gray-500 mt-3">
            Your AI-powered research assistant
          </p>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-semibold text-[#171717]">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            {isLogin
              ? 'Sign in to continue your research.'
              : 'Create an account to get started with DocuMind.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#E63946]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#E63946]"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#E63946]"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#171717] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#333] transition disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-7">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setMessage('')
            }}
            className="text-[#E63946] font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
