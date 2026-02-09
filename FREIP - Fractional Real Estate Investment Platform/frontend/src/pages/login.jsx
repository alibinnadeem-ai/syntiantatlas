import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/landing/Layout';
import { FcGoogle } from 'react-icons/fc';
import { FaEnvelope, FaLock } from 'react-icons/fa';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'admin') router.push('/admin');
            else if (data.user.role === 'staff') router.push('/staff');
            else router.push('/dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <Head>
                <title>Login | Syntiant Atlas</title>
            </Head>

            <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 relative overflow-hidden py-20">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-2xl shadow-[0_12px_30px_0_rgba(19,21,35,0.1)] w-full max-w-md z-10 mx-4 border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Sign in to continue to your dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dao-blue focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-gray-700 text-sm font-medium">Password</label>
                                <Link href="/forgot-password">
                                    <span className="text-sm text-dao-blue hover:text-dao-blue-dark hover:underline cursor-pointer">Forgot password?</span>
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dao-blue focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-blue py-3 rounded-lg shadow-md hover:shadow-lg transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all bg-white">
                        <FcGoogle className="text-xl" />
                        <span>Sign in with Google</span>
                    </button>

                    <p className="mt-8 text-center text-gray-600 text-sm">
                        Don't have an account?{' '}
                        <Link href="/register">
                            <span className="text-dao-blue font-semibold cursor-pointer hover:underline">Sign up</span>
                        </Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
}
