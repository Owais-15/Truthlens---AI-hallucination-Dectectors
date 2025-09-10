import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card data-testid="card-privacy-overview">
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Account Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When you create an account, we collect your email address, username, and encrypted password.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Analysis Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We store the text you submit for fact-checking analysis and the results of those analyses to provide our service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Usage Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We collect information about how you use our service, including analysis frequency and feature usage.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-data-usage">
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Provide fact-checking analysis services</li>
              <li>• Maintain and improve our AI models</li>
              <li>• Send account-related notifications</li>
              <li>• Process subscription payments</li>
              <li>• Ensure platform security and prevent abuse</li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-data-protection">
          <CardHeader>
            <CardTitle>Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Security Measures</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We use industry-standard encryption to protect your data in transit and at rest. Passwords are hashed using bcrypt.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Retention</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analysis data is retained for service improvement. You can request deletion of your data at any time.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-user-rights">
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Access your personal data</li>
              <li>• Request data correction or deletion</li>
              <li>• Export your data</li>
              <li>• Withdraw consent for data processing</li>
              <li>• Object to automated decision-making</li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-third-party">
          <CardHeader>
            <CardTitle>Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We use Google Gemini and Exa API for content analysis. Text submitted for analysis may be processed by these services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Payment Processing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stripe processes subscription payments. We do not store payment card information.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Email Service</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SendGrid handles account verification and notification emails.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-contact">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you have questions about this privacy policy or your data, please contact us through your account settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}