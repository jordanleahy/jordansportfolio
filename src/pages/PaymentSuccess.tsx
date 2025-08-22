import { PageLayout } from '@/components/layout/PageLayout';
import { Section } from '@/components/layout/Section';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Calendar, Mail } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for payment confirmation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <PageLayout>
        <Section maxWidth="4xl" className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Confirming Payment...</h2>
              <p className="text-muted-foreground">Please wait while we process your payment.</p>
            </CardContent>
          </Card>
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section maxWidth="4xl" className="min-h-screen py-16">
        <div className="text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Thank you for your investment in the Query Innovation Workshop. 
              Your payment of <span className="font-semibold text-foreground">$6,750</span> has been processed successfully.
            </p>
          </div>

          {/* Payment Details */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center pb-4 border-b">
                  <h3 className="text-2xl font-semibold mb-2">CoFactorAI Query Innovation Workshop</h3>
                  <p className="text-muted-foreground">3-Week Team Alignment & Design Workshop</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </h4>
                    <p className="text-sm text-muted-foreground">3 weeks starting September 1st, 2024</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Investment</h4>
                    <p className="text-2xl font-bold text-primary">$6,750</p>
                  </div>
                </div>

                {sessionId && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Transaction ID:</strong> {sessionId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                Next Steps
              </h3>
              
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-1">1</div>
                  <div>
                    <h4 className="font-medium">Confirmation Email</h4>
                    <p className="text-sm text-muted-foreground">You'll receive a detailed confirmation email within the next few minutes with your receipt and workshop details.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-1">2</div>
                  <div>
                    <h4 className="font-medium">Kick-off Scheduling</h4>
                    <p className="text-sm text-muted-foreground">Our team will reach out within 24 hours to schedule your kick-off meeting and alignment session.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-1">3</div>
                  <div>
                    <h4 className="font-medium">Team Preparation</h4>
                    <p className="text-sm text-muted-foreground">We'll help you recruit the ideal sprint team and prepare all materials for maximum workshop success.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                Return to Home
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link to="/cofactor-proposal">
                View Proposal Details
              </Link>
            </Button>
          </div>

          {/* Contact Information */}
          <div className="text-center pt-8 border-t">
            <p className="text-muted-foreground">
              Questions about your workshop? Contact us at{' '}
              <a href="mailto:hello@cofactorai.com" className="text-primary hover:underline">
                hello@cofactorai.com
              </a>
            </p>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}