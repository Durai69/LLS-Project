import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // This is correctly imported
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate(); // This hook is correctly initialized

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(username, password);
      if (user) {
        if (user.role === 'admin') {
          // --- CHANGE THIS LINE ---
          // Use navigate for client-side routing within the same React app
          navigate("/dashboard"); // Redirect to Admin Dashboard
        } else if (user.role === 'http://localhost:8081/dashboard') {
          // --- CHANGE THIS LINE ---
          // For cross-application redirects (e.g., from Admin-frontend to User-frontend),
          // window.location.href might still be necessary if they are completely separate SPAs.
          // However, if the user-frontend dashboard is within the *same* SPA but a different route,
          // you'd use navigate here too. Assuming separate app for now:
          navigate("/dashboard"); // Redirect to User-Frontend
        } else {
          setError('Unknown role. Please contact administrator.');
        }
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-insight-soft-blue">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Login
          </h1>
          <p className="text-gray-500">Login to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-insight-blue hover:bg-insight-blue/90"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Use your credentials to login</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
