import { SignIn } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useClerkUser } from "@/hooks/useClerkUser";

export default function Login() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { backendUser, isLoading } = useClerkUser();

  useEffect(() => {
    if (isSignedIn && backendUser) {
      navigate('/');
    }
  }, [isSignedIn, backendUser, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn 
        path="/login" 
        routing="path" 
        signUpUrl="/signup" 
        signUpForceRedirectUrl="/"
        
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary text-white hover:bg-primary/90",
          },
        }}
      />
    </div>
  );
}
