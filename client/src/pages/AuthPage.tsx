import { useState, useEffect } from "react";
import { useLocation, useRoute, Redirect } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { loginWithGoogle } from "@/lib/api";
import { registerSchema, loginSchema, forgotPasswordSchema, InsertUser } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Lock, Mail, User, KeyRound, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { forgotPassword } from "@/lib/api";

const AuthPage = () => {
  const [isMatch] = useRoute("/auth");
  const [, navigate] = useLocation();
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    register 
  } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(user?.role === 'admin' ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      first_name: "",
    },
  });

  // Login submit handler
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values);
      // No need to navigate as the auth hook will handle this automatically
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  
  // Forgot password form
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Forgot password submit handler
  const onForgotPasswordSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setIsForgotPasswordSubmitting(true);
      await forgotPassword(values);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account with that email exists, a password reset link has been sent.",
        variant: "default",
      });
      setShowForgotPassword(false);
      forgotPasswordForm.reset();
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "There was a problem sending the password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  // Register submit handler
  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      // Add role and subscription defaults for registration
      const userData: InsertUser = {
        ...values,
        role: 'client', // Default role
        subscription_plan: 'free', // Default plan
        subscription_status: 'active', // Default status
        subscription_expiry: null // No expiry for free plan
      };
      
      await register(userData);
      // No need to navigate as the auth hook will handle this automatically
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  if (isAuthenticated && !isLoading) {
    return <Redirect to={user?.role === 'admin' ? "/admin" : "/dashboard"} />;
  }

  return (
    <div className="flex min-h-screen relative bg-white overflow-hidden">
      {/* White background for clean look */}
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md bg-[#F28C38]/10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border-2 border-[#F28C38]"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#006039] flex items-center">
                <KeyRound className="mr-2 h-5 w-5 text-[#a37e2c]" />
                Reset Password
              </h2>
              <button 
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center p-3 bg-amber-50 text-amber-700 rounded mb-4">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p className="text-sm">
                  Enter your email address below. If an account exists, we'll send you a password reset link.
                </p>
              </div>
              
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#006039]">Email Address</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10 border-[#c9c08f] focus:border-[#a37e2c] focus:ring-[#a37e2c]"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-3 mt-6">
                    <Button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
                      disabled={isForgotPasswordSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#006039] to-[#9eca9e] hover:from-[#9eca9e] hover:to-[#006039] text-white"
                      disabled={isForgotPasswordSubmitting}
                    >
                      {isForgotPasswordSubmitting ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Left side: Forms */}
      <div className="w-full lg:w-1/2 p-8 md:p-12 flex items-center justify-center relative z-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo only, no text */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/local-authority-logo-light.png" 
              alt="Authority Local" 
              className="w-full max-w-xs" 
            />
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-[#0F172A]">
                  Welcome Back
                </h2>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0F172A] font-medium">Username</FormLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <FormControl>
                              <Input
                                placeholder="Enter your username"
                                className="pl-10 bg-gray-50 text-black border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0F172A] font-medium">Password</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10 bg-gray-50 text-black border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-medium py-2 shadow-md"
                      disabled={loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting ? (
                        "Logging in..."
                      ) : (
                        <span className="flex items-center justify-center">
                          Login <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                    
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[#F97316] hover:text-[#EA580C] text-sm font-medium transition duration-200"
                      >
                        Forgot your password?
                      </button>
                    </div>

                    <div className="mt-6 relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => loginWithGoogle()}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded shadow-sm transition duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                        </svg>
                        Sign in with Google
                      </button>
                    </div>
                  </form>
                </Form>
              </div>
            </TabsContent>

            {/* Registration Form */}
            <TabsContent value="register">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-[#0F172A]">
                  Create an Account
                </h2>
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0F172A] font-medium">First Name</FormLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <FormControl>
                              <Input
                                placeholder="Enter your first name"
                                className="pl-10 bg-gray-50 text-black border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0F172A] font-medium">Username</FormLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <FormControl>
                              <Input
                                placeholder="Choose a username"
                                className="pl-10 bg-gray-50 text-black border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0F172A] font-medium">Email</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10 bg-gray-50 text-black border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0F172A] font-medium">Password</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Create a password"
                                className="pl-10 bg-gray-50 text-black border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-medium py-2 shadow-md"
                      disabled={registerForm.formState.isSubmitting}
                    >
                      {registerForm.formState.isSubmitting ? (
                        "Creating account..."
                      ) : (
                        <span className="flex items-center justify-center">
                          Register <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Right side: Hero section */}
      <div className="hidden lg:block lg:w-1/2 bg-white border-l border-gray-100 relative z-10">
        <div className="h-full flex flex-col justify-center items-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex justify-center mb-8">
                <img 
                  src="/images/local-authority-logo-light.png" 
                  alt="Authority Local" 
                  className="w-full max-w-xs" 
                />
              </div>
              <div className="space-y-4">
                <Feature text="AI-powered GBP optimization" />
                <Feature text="Competitor analysis & insights" />
                <Feature text="Comprehensive review management" />
                <Feature text="Local rankings & visibility tracking" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feature component for the hero section
const Feature = ({ text }: { text: string }) => (
  <div className="flex items-center">
    <CheckCircle className="h-5 w-5 text-[#F97316] mr-3" />
    <p className="text-[#0F172A]">{text}</p>
  </div>
);

export default AuthPage;