import { SignUp } from "@clerk/clerk-react";

const Signup = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <SignUp 
      path="/signup" 
      routing="path" 
      signInUrl="/login" 
      signInForceRedirectUrl="/"
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary text-white hover:bg-primary/90",
        },
      }}
    />
  </div>
);

export default Signup;
