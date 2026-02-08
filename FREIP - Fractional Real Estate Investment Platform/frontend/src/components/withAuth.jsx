
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const withAuth = (WrappedComponent, allowedRoles = []) => {
    return (props) => {
        const router = useRouter();
        const [verified, setVerified] = useState(false);

        useEffect(() => {
            const checkAuth = async () => {
                const token = localStorage.getItem('token');
                const userStr = localStorage.getItem('user');

                if (!token || !userStr) {
                    router.replace('/login');
                    return;
                }

                const user = JSON.parse(userStr);

                // Check if role is allowed
                if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                    // Redirect to appropriate dashboard based on their actual role
                    if (user.role === 'admin') router.replace('/admin');
                    else if (user.role === 'seller') router.replace('/seller');
                    else if (user.role === 'staff') router.replace('/staff');
                    else router.replace('/dashboard'); // Default investor
                    return;
                }

                setVerified(true);
            };

            checkAuth();
        }, []);

        if (!verified) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-daoblue"></div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
