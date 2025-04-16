
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { ArrowRight, Bot, MessageSquareText, Code, Workflow } from 'lucide-react';

const Index = () => {
  const { authState } = useAuth();
  const { isAuthenticated } = authState;

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <section className="py-20 md:py-28 flex flex-col items-center text-center">
          <div className="max-w-3xl">
            <div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              AI-Powered Chatbots for GoHighLevel
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Supercharge your GoHighLevel experience with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect ChatGPT with GoHighLevel to automate customer interactions and collect valuable information with intelligent conversations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="gap-2">
                  <Link to="/dashboard">
                    Go to Dashboard <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="gap-2">
                    <Link to="/login">
                      Get Started <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/login">
                      Log In
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Configure Your Chatbot</h3>
              <p className="text-muted-foreground">
                Set up your AI chatbot with custom behavior, objectives, and conversation flows.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Connect to GoHighLevel</h3>
              <p className="text-muted-foreground">
                Integrate your chatbot with GoHighLevel to synchronize customer data automatically.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquareText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Start Conversations</h3>
              <p className="text-muted-foreground">
                Let your AI handle customer interactions while mapping responses to your CRM fields.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30 rounded-3xl px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your customer interactions?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start automating meaningful conversations that convert and collect valuable customer data.
            </p>
            <Button asChild size="lg">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started Today"}
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
